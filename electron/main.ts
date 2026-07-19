import { app, BrowserWindow, ipcMain, shell, dialog, net, Tray, Menu, globalShortcut, nativeImage, type NativeImage } from "electron";
import path from "path";
import { spawn, exec, execSync, ChildProcess } from "child_process";
import { existsSync, lstatSync, readFileSync, writeFileSync, statSync, mkdirSync, unlinkSync, renameSync, readdirSync, createWriteStream } from "fs";
import { logger } from "./logger";
import { Adb } from "@devicefarmer/adbkit";
import prettyBytes from "pretty-bytes";
import { download } from "electron-dl";
import { buildScrcpyArgs } from "./scrcpyArgs";
import {
  beginIntentionalRestart,
  clearSessionOverrides,
  endIntentionalRestart,
  forceRecordForArgs,
  onProcessExitMaybeClearSession,
  type DeviceSessionOverrides,
} from "./sessionOverrides";

// Constants for timeout values
const PROCESS_CHECK_INTERVAL = 2000;
const REPAIR_STRATEGY_TIMEOUT = 10000;
const GRACEFUL_SHUTDOWN_WAIT = 800;
const FORCE_KILL_WAIT = 500;
const CLEANUP_TIMEOUT = 500;
const FORCE_KILL_DELAY = 300;
const SETTINGS_SAVE_DEBOUNCE = 500; // Debounce delay for settings save

// Device polling configuration
const DEVICE_POLL_INTERVAL = 10000; // 10 seconds (configurable)

// Log retention configuration
const LOG_RETENTION_DAYS = 7; // Keep logs for 7 days (configurable)

// Test mode flag - only enable in non-production environments
const TEST_MODE = process.env.NODE_ENV === "test" && !app.isPackaged;

// Debounced async settings save function
let settingsSaveTimeout: NodeJS.Timeout | null = null;
async function saveSettingsToFile(): Promise<void> {
  if (settingsSaveTimeout) {
    clearTimeout(settingsSaveTimeout);
  }
  
  return new Promise((resolve) => {
    settingsSaveTimeout = setTimeout(async () => {
      try {
        const settingsPath = path.join(app.getPath("userData"), "settings.json");
        const { writeFile } = await import("fs/promises");
        await writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf8");
        logger.debug(`Settings saved to: ${settingsPath}`);
        resolve();
      } catch (error) {
        logger.error("Failed to save settings:", error);
        resolve(); // Resolve anyway to prevent hanging
      }
    }, SETTINGS_SAVE_DEBOUNCE);
  });
}

// Result type for consistent error handling
type Result<T> = { success: true; data: T } | { success: false; error: string };

// Active intervals for cleanup
const activeIntervals = new Set<NodeJS.Timeout>();

// Helper function to clear all active intervals
function clearAllIntervals(): void {
  activeIntervals.forEach(clearInterval);
  activeIntervals.clear();
}

// Helper function to register interval for tracking
function registerInterval(fn: () => void, timeout: number): NodeJS.Timeout {
  const interval = setInterval(fn, timeout);
  activeIntervals.add(interval);
  return interval;
}

// Security: Sanitize device path to prevent command injection
function sanitizeDevicePath(devicePath: string): string {
  // Remove dangerous characters that could be used for command injection
  const dangerousChars = /[;&| `$<>{}()\[\]\\]/g;
  return devicePath.replace(dangerousChars, "").trim();
}

// Security: Validate save path to prevent path traversal
function validateSavePath(savePath: string, allowedBasePath: string): string | null {
  const normalizedPath = path.normalize(savePath);
  const resolvedPath = path.resolve(allowedBasePath, normalizedPath);

  // Ensure the resolved path is within the allowed directory
  if (!resolvedPath.startsWith(path.resolve(allowedBasePath))) {
    logger.warn(`Path traversal attempt blocked: ${savePath}`);
    return null;
  }

  return resolvedPath;
}

// Security: Validate device ID format
function isValidDeviceId(deviceId: string): boolean {
  const deviceIdPattern = /^([a-zA-Z0-9._-]+):?(\d+)?$/;
  return deviceIdPattern.test(deviceId);
}

// Start ADB server and wait for it to be ready
function startAdbServer(): Promise<void> {
  if (TEST_MODE) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const adbPath = getAdbPath();
    const tryStart = () => {
      exec(`"${adbPath}" start-server`, { encoding: "utf8", timeout: 10000 }, (error, _stdout, _stderr) => {
        if (error) {
          logger.warn("ADB start failed:", error.message);
          // Retry once more
          setTimeout(() => {
            exec(`"${adbPath}" start-server`, { encoding: "utf8", timeout: 10000 }, (retryError, _retryStdout, _retryStderr) => {
              if (retryError) {
                logger.warn("ADB retry start failed:", retryError.message);
                // Even if retry fails, resolve to continue - tracker will handle ADB not ready
                resolve();
              } else {
                logger.info("ADB server started (retry)");
                resolve();
              }
            });
          }, 1000);
        } else {
          logger.debug("ADB server started");
          resolve();
        }
      });
    };
    tryStart();
  });
}

// Helper function to get default recording path
function getDefaultRecordPath(deviceId: string): string {
  const downloadsPath = app.getPath("downloads");
  const fileName = `recording_${deviceId.replace(/[:.]/g, "_")}.mp4`;
  return path.join(downloadsPath, fileName);
}

// Helper function to resolve recording path (handle directory vs file path)
function resolveRecordPath(
  customPath: string | undefined,
  deviceId: string
): string {
  if (!customPath || customPath.trim() === "") {
    return getDefaultRecordPath(deviceId);
  }

  // Check if path is a directory (ends with path separator or is a directory)
  const customTrimmedPath = customPath.trim();

  // Check if path has file extension
  if (customTrimmedPath.match(/\.(mp4|mkv|webm|avi)$/i)) {
    return customTrimmedPath;
  }

  // Check if path is a directory (doesn't have extension or ends with backslash)
  try {
    if (existsSync(customTrimmedPath) && lstatSync(customTrimmedPath).isDirectory()) {
      const fileName = `recording_${deviceId.replace(/[:.]/g, "_")}.mp4`;
      return path.join(customTrimmedPath, fileName);
    }
  } catch (e) {
    // Path doesn't exist, will be created by scrcpy
  }

  // If no extension, append .mp4
  if (!customTrimmedPath.match(/\.[a-zA-Z0-9]+$/)) {
    return customTrimmedPath + ".mp4";
  }

  return customTrimmedPath;
}

// Get list of available video encoders from device
interface EncoderInfo {
  name: string;
  type: "video" | "audio";
  codec: string;
  isHardware: boolean;
  isRecommended: boolean;
}

function getEncodersFromDevice(
  deviceId: string,
  codec: string
): Promise<{ success: boolean; encoders?: EncoderInfo[]; error?: string }> {
  return new Promise((resolve) => {
    // Use scrcpy --list-encoders to get available encoders for the specified codec
    const scrcpyPath = SCRCPY_PATH;
    const args = [
      `--video-codec=${codec}`,
      "--list-encoders",
      `--serial=${deviceId}`
    ];
    const cmd = `"${scrcpyPath}" ${args.join(" ")}`;

    logger.debug(`Fetching encoders for device ${deviceId} with codec ${codec}`);

    exec(cmd,
      { encoding: "utf8", timeout: 20000 },
      (error, stdout, stderr) => {
        if (error) {
          logger.warn(`Failed to get encoders: ${error.message}`);
          resolve({ success: false, error: error.message });
          return;
        }

        const encoders: EncoderInfo[] = [];
        const lines = stdout.split("\n").filter((line) => line.trim());

        logger.debug(`scrcpy output lines: ${lines.length}`);

        // Parse scrcpy output format:
        // --video-codec=h264 --video-encoder=c2.qti.avc.encoder (hw) [vendor]
        // --audio-codec=opus --audio-encoder=c2.android.opus.encoder (sw)
        const encoderRegex = /--(video|audio)-codec=(\w+)\s+--(video|audio)-encoder=([^\s]+)\s+\((hw|sw)\)/i;

        for (const line of lines) {
          const match = line.match(encoderRegex);
          if (match) {
            const type = match[1].toLowerCase() as "video" | "audio";
            const codecType = match[2].toLowerCase();
            const name = match[4];
            const isHardware = match[5].toLowerCase() === "hw";

            // Recommend all hardware encoders
            const isRecommended = isHardware;

            encoders.push({ name, type, codec: codecType, isHardware, isRecommended });
          }
        }

        logger.debug(`Parsed ${encoders.length} encoders from output`);

        // Remove duplicates
        const seen = new Set<string>();
        const uniqueEncoders = encoders.filter((e) => {
          const key = `${e.name}-${e.type}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Sort: video first, then recommended, then hardware
        uniqueEncoders.sort((a, b) => {
          if (a.type === "video" && b.type !== "video") return -1;
          if (a.type !== "video" && b.type === "video") return 1;
          if (a.isRecommended && !b.isRecommended) return -1;
          if (!a.isRecommended && b.isRecommended) return 1;
          if (a.isHardware && !b.isHardware) return -1;
          if (!a.isHardware && b.isHardware) return 1;
          return a.name.localeCompare(b.name);
        });

        resolve({ success: true, encoders: uniqueEncoders });
      }
    );
  });
}

// Platform-specific paths
function getPlatformFolder(): string {
  switch (process.platform) {
    case "win32":
      return "win";
    case "darwin":
      return "mac";
    case "linux":
      return "linux";
    default:
      return "win";
  }
}

function getScrcpyExecutable(): string {
  return process.platform === "win32" ? "scrcpy.exe" : "scrcpy";
}

function getAdbExecutable(): string {
  return process.platform === "win32" ? "adb.exe" : "adb";
}

// Paths
const PLATFORM_FOLDER = getPlatformFolder();
const SCRCPY_PATH = app.isPackaged
  ? path.join(process.resourcesPath, "app", PLATFORM_FOLDER, getScrcpyExecutable())
  : path.join(process.cwd(), "app", PLATFORM_FOLDER, getScrcpyExecutable());
const ADB_PATH = app.isPackaged
  ? path.join(process.resourcesPath, "app", PLATFORM_FOLDER, getAdbExecutable())
  : path.join(process.cwd(), "app", PLATFORM_FOLDER, getAdbExecutable());

logger.info("Application paths configured", {
  scrcpyPath: SCRCPY_PATH,
  adbPath: ADB_PATH,
  testMode: TEST_MODE,
  isPackaged: app.isPackaged,
  cwd: process.cwd(),
});

// Types
interface DisplaySettings {
  maxSize: number;
  maxSizeMode: 'preset' | 'custom'; // Track whether user selected preset or custom
  customMaxSize: number;
  videoBitrate: number;
  frameRate: number;
  buffer: number; // Buffer size in milliseconds for smoother video playback (default: 50)
  alwaysOnTop: boolean;
  fullscreen: boolean;
  stayAwake: boolean;
  enableVideo: boolean;
  enableAudio: boolean;
  record: boolean;
  recordAudio: boolean;
  recordPath: string;
  recordTimeLimit: number; // 0 = unlimited
  camera: boolean;
  cameraId: string;
  cameraSize: string;
  cameraFps: number;
  windowBorderless: boolean;
  disableScreensaver: boolean;
}

interface EncodingSettings {
  videoCodec: string;
  videoEncoder: string; // Hardware encoder name (e.g., "c2.qti.avc.encoder")
  audioCodec: string;
  audioEncoder?: string;
  bitrateMode: string;
  ignoreVideoEncoderConstraints?: boolean; // scrcpy v4.1+: skip encoder capability checks
}

interface ServerSettings {
  tunnelMode: string;
  cleanup: boolean;
  scrcpyPath?: string;
  adbPath?: string;
}

// Device history entry for saved WiFi connections
interface DeviceHistory {
  id: string; // Device ID (e.g., "192.168.5.5:5555")
  name: string; // Device name (e.g., "PJD110")
  ip: string; // IP address (e.g., "192.168.5.5")
  port: number; // Port (default 5555)
  lastConnected: number; // Timestamp
  autoConnect: boolean; // Whether to auto-connect on startup
  isConnected: boolean; // Whether device is currently connected (persisted state)
}

interface Settings {
  display: DisplaySettings;
  encoding: EncodingSettings;
  server: ServerSettings;
  logLevel: string;
  deviceHistory: DeviceHistory[];
  pendingInstallerPath: string | null; // Pending installer to delete on next startup
}

interface DeviceInfo {
  id: string;
  name: string;
  type: "usb" | "wifi";
  status: string;
}

// State
let mainWindow: BrowserWindow | null = null;
const deviceProcesses = new Map<string, { pid: number; proc: any }>();
const cameraProcesses = new Map<string, { pid: number; proc: any }>();
const connectedDevices = new Set<string>();
const connectedDevicesInfo = new Map<string, { name: string }>();
// Track devices that have been notified to frontend to prevent duplicate notifications
const notifiedDevices = new Set<string>();
/** Per-device session overrides (record/audio/camera) survive audio/camera restarts. */
const deviceSessionOverrides = new Map<string, DeviceSessionOverrides>();
/** While set, process-exit handlers must not clear deviceSessionOverrides (intentional restart). */
const preserveSessionOnExit = new Set<string>();
let isQuittingForUpdate = false;
let isCleaningUp = false;  // Prevent double cleanup
let adbClient: any = null;
let deviceTracker: any = null;

// Unified process termination — only place that may call platform taskkill/pkill.
async function terminateProcess(pid: number, proc?: ChildProcess): Promise<boolean> {
  if (!pid) return false;

  // Prefer graceful quit via scrcpy stdin when available
  if (proc) {
    const procAny = proc as {
      stdin?: { write: (data: string) => void; destroyed: boolean };
      kill?: (signal?: string) => boolean;
    };
    if (procAny.stdin && !procAny.stdin.destroyed) {
      try {
        procAny.stdin.write("q\n");
        await new Promise((resolve) => setTimeout(resolve, GRACEFUL_SHUTDOWN_WAIT));
        if (!isProcessRunning(pid)) {
          logger.debug(`Process ${pid} exited after stdin quit`);
          return true;
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.debug(`stdin quit failed for PID ${pid}: ${errorMessage}`);
      }
    }
    try {
      procAny.kill?.("SIGINT");
      await new Promise((resolve) => setTimeout(resolve, FORCE_KILL_WAIT));
      if (!isProcessRunning(pid)) {
        return true;
      }
    } catch {
      // continue to platform kill
    }
  }

  try {
    if (process.platform === "win32") {
      // Try graceful termination first without /F (force)
      try {
        await new Promise<void>((resolve, reject) => {
          exec(`taskkill /PID ${pid} /T`, { encoding: "utf8" }, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        logger.debug(`Graceful termination sent to PID ${pid}`);
        await new Promise((resolve) => setTimeout(resolve, FORCE_KILL_WAIT));
        if (!isProcessRunning(pid)) {
          return true;
        }
      } catch {
        // Fall back to force kill
      }
      try {
        await new Promise<void>((resolve) => {
          exec(`taskkill /PID ${pid} /F /T`, { encoding: "utf8" }, () => resolve());
        });
        logger.debug(`Force killed PID ${pid}`);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.debug(`Force taskkill failed for ${pid}: ${errorMessage}`);
      }
    } else {
      // macOS/Linux: SIGTERM then SIGKILL
      try {
        process.kill(pid, "SIGTERM");
        await new Promise((resolve) => setTimeout(resolve, GRACEFUL_SHUTDOWN_WAIT));
        if (isProcessRunning(pid)) {
          process.kill(pid, "SIGKILL");
        }
        logger.debug(`Signals sent to PID ${pid}`);
      } catch {
        exec(`pkill -9 -P ${pid}`, () => {});
        logger.debug(`pkill fallback used for PID ${pid}`);
      }
    }
    return true;
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.warn(`Failed to terminate process ${pid}`, errorMessage);
    return false;
  }
}

/**
 * Stop a tracked scrcpy/camera process entry via terminateProcess only.
 * forRestart: detach exit listeners and delete map entry before kill so close/interval
 * handlers cannot race-clear session overrides during intentional restart.
 */
async function stopTrackedProcess(
  map: Map<string, { pid: number; proc: any }>,
  deviceId: string,
  options: { forRestart?: boolean } = {}
): Promise<void> {
  const entry = map.get(deviceId);
  if (!entry) return;

  if (options.forRestart && entry.proc) {
    try {
      entry.proc.removeAllListeners?.("close");
      entry.proc.removeAllListeners?.("error");
    } catch {
      // ignore
    }
  }

  // Remove from map first so process-monitor intervals bail without notifyScrcpyExit
  map.delete(deviceId);

  if (!TEST_MODE && entry.pid) {
    await terminateProcess(entry.pid, entry.proc);
  }
}

// Check if a process is still running
function isProcessRunning(pid: number): boolean {
  if (!pid) return false;
  
  try {
    if (process.platform === "win32") {
      const result = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV`, { encoding: "utf8" });
      return result.includes(String(pid));
    } else {
      // macOS/Linux: use kill -0 to check if process exists (doesn't actually send signal)
      try {
        process.kill(pid, 0);
        return true;
      } catch {
        return false;
      }
    }
  } catch {
    return false;
  }
}

// Clean up all device-related subprocesses
function cleanupAllProcesses(): Promise<void> {
  return new Promise((resolve) => {
    if (TEST_MODE) {
      logger.info("Test mode: skipping process cleanup");
      return resolve();
    }

    if (isCleaningUp) {
      logger.info("Cleanup already in progress, skipping");
      return resolve();
    }

    isCleaningUp = true;
    logger.info("Cleaning up all processes before update...");

    // Clear all tracked intervals first
    clearAllIntervals();

    // 1. Clean up all scrcpy processes using unified function
    deviceProcesses.forEach((procData, deviceId) => {
      terminateProcess(procData.pid, procData.proc)
        .then(() => logger.info(`Killed scrcpy process for ${deviceId} (PID: ${procData.pid})`))
        .catch((e: unknown) => {
          const errorMessage = e instanceof Error ? e.message : String(e);
          logger.warn(`Failed to kill scrcpy for ${deviceId}`, errorMessage);
        });
    });

    // 2. Clean up all camera processes using unified function
    cameraProcesses.forEach((procData, deviceId) => {
      terminateProcess(procData.pid, procData.proc)
        .then(() => logger.info(`Killed camera process for ${deviceId} (PID: ${procData.pid})`))
        .catch((e: unknown) => {
          const errorMessage = e instanceof Error ? e.message : String(e);
          logger.warn(`Failed to kill camera for ${deviceId}`, errorMessage);
        });
    });

    // 3. Clean up ADB server processes
    try {
      if (process.platform === "win32") {
        exec(`taskkill /F /IM adb.exe`, () => {});
      } else {
        exec(`pkill -9 adb`, () => {});
      }
      logger.info("Attempted to kill ADB server processes");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      logger.warn("Failed to kill ADB processes", errorMessage);
    }

    // Stop device tracker
    if (deviceTracker) {
      try {
        deviceTracker.end();
        deviceTracker = null;
        logger.info("Device tracker stopped");
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.warn("Failed to stop device tracker:", errorMessage);
      }
    }

    // 4. Clear all storage
    deviceProcesses.clear();
    cameraProcesses.clear();
    connectedDevices.clear();
    connectedDevicesInfo.clear();

    logger.info("All processes cleaned up");

    // Wait to ensure processes are fully terminated
    setTimeout(() => {
      isCleaningUp = false;
      resolve();
    }, CLEANUP_TIMEOUT);
  });
}

// Cleanup old installer file from previous update
// Uses retry with exponential backoff because Windows locks the file immediately after installation
function cleanupOldInstaller(): void {
  const pendingPath = settings.pendingInstallerPath;
  if (!pendingPath || !existsSync(pendingPath)) {
    // No pending installer or file doesn't exist
    settings.pendingInstallerPath = null;
    return;
  }

  logger.info(`Found pending installer: ${pendingPath}`);

  // Retry deletion with exponential backoff
  let attempts = 0;
  const maxAttempts = 10;
  const baseDelay = 1000; // 1 second base delay

  const tryDelete = () => {
    attempts++;
    try {
      unlinkSync(pendingPath);
      logger.info(`Deleted pending installer: ${pendingPath}`);
      settings.pendingInstallerPath = null;
    } catch (e: unknown) {
      if (attempts < maxAttempts) {
        const delay = baseDelay * Math.pow(1.5, attempts - 1);
        logger.debug(`Installer locked, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts})`);
        setTimeout(tryDelete, delay);
      } else {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.warn(`Failed to delete pending installer after ${maxAttempts} attempts: ${pendingPath}`, errorMessage);
      }
    }
  };

  tryDelete();
}

/**
 * Notify frontend about device connection status change
 * @param deviceId - Device ID
 * @param deviceName - Device display name
 * @param deviceType - Device type: "usb" or "wifi"
 */
function notifyDeviceConnected(
  deviceId: string,
  deviceName: string,
  deviceType: "usb" | "wifi"
): void {
  if (mainWindow) {
    mainWindow.webContents.send("device-change", {
      type: "add",
      device: {
        id: deviceId,
        name: deviceName,
        type: deviceType,
        status: deviceType === "wifi" ? "connected" : "device",
      },
    });
  }
}

// Initialize device tracker for real-time device monitoring
async function initDeviceTracker(): Promise<void> {
  try {
    if (TEST_MODE) {
      logger.info("Test mode: skipping device tracker initialization");
      return;
    }

    const adbPath = getAdbPath();
    adbClient = Adb.createClient({ bin: adbPath });
    const tracker = await adbClient.trackDevices();
    deviceTracker = tracker;

    deviceTracker.on("add", (device: any) => {
      logger.info(`Device connected: ${device.id} (${device.type})`);
      if (mainWindow) {
        // Format device data with proper status for frontend
        const isWifi = device.id.includes(":");
        const deviceName = connectedDevicesInfo.get(device.id)?.name || device.id;
        mainWindow.webContents.send("device-change", {
          type: "add",
          device: {
            id: device.id,
            name: deviceName,
            type: device.type || (isWifi ? "wifi" : "usb"),
            status: isWifi ? "connected" : "device",
          },
        });
      }
    });

    deviceTracker.on("remove", (device: any) => {
      logger.info(`Device disconnected: ${device.id} (${device.type})`);
      // Update connectedDevices and persistent state
      connectedDevices.delete(device.id);
      connectedDevicesInfo.delete(device.id);
      // Remove from notifiedDevices to allow re-notification on reconnect
      notifiedDevices.delete(device.id);
      // Update persisted connection state (async, don't await to avoid blocking)
      updateDeviceConnectionState(device.id, false).catch((e: unknown) => {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.warn(`Failed to update connection state for ${device.id}:`, errorMessage);
      });
      if (mainWindow) {
        // Format device data with proper status for frontend
        const isWifi = device.id.includes(":");
        mainWindow.webContents.send("device-change", {
          type: "remove",
          device: {
            id: device.id,
            name: device.id,
            type: device.type || (isWifi ? "wifi" : "usb"),
            status: "offline",
          },
        });
      }
    });

    deviceTracker.on("error", (err: any) => {
      logger.error("Device tracker error:", err);
      // Attempt to restart tracker after error
      setTimeout(() => {
        logger.info("Attempting to restart device tracker...");
        initDeviceTracker();
      }, 2000);
    });

    logger.info("Device tracker initialized");

    // Sync connected devices after tracker is ready
    syncConnectedDevicesAfterTrackerReady();
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.warn("Failed to init device tracker:", errorMessage);
    // Retry after delay
    setTimeout(() => {
      logger.info("Retrying device tracker initialization...");
      initDeviceTracker();
    }, 2000);
  }
}

/**
 * Sync connected devices after tracker is ready
 * This ensures all currently connected devices are notified to frontend
 */
function syncConnectedDevicesAfterTrackerReady(): void {
  if (!mainWindow) {
    return;
  }

  // Get all devices from ADB to sync current state
  exec(
    `"${getAdbPath()}" devices -l`,
    { encoding: "utf8" },
    (error, stdout) => {
      if (error || !stdout) {
        logger.warn("Failed to get device list for sync:", error?.message);
        return;
      }

      const lines = stdout.split("\n").filter((line) => line.trim());
      let syncedCount = 0;

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const deviceId = parts[0];
          const status = parts[1];

          // Only sync devices that are actually connected and NOT already notified
          // This ensures we only notify frontend when there's an actual state change
          if (
            (status === "device" || status === "authorized") &&
            !notifiedDevices.has(deviceId)
          ) {
            const isWifi = deviceId.includes(":");
            const deviceType = isWifi ? "wifi" : "usb";
            const deviceName = connectedDevicesInfo.get(deviceId)?.name || deviceId;

            notifyDeviceConnected(deviceId, deviceName, deviceType);
            notifiedDevices.add(deviceId);
            syncedCount++;
          }
        }
      }

      logger.info(`Synced ${syncedCount} connected devices after tracker ready`);
    }
  );
}

// Stop device tracker
function stopDeviceTracker(): void {
  try {
    if (deviceTracker) {
      deviceTracker.end();
      deviceTracker = null;
      logger.info("Device tracker stopped");
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.warn("Failed to stop device tracker:", errorMessage);
  }
}

// Default settings
// Note: buffer field added to interface but may not exist in saved settings
// Use type assertion to allow older settings to work
const settings: Settings = {
  display: {
    maxSize: 1920,
    maxSizeMode: 'preset',
    customMaxSize: 1920,
    videoBitrate: 8,
    frameRate: 60,
    buffer: 0, // Buffer size in ms (0 = disabled for real-time mirroring)
    alwaysOnTop: false,
    fullscreen: false,
    stayAwake: false,
    enableVideo: true,
    enableAudio: true,
    record: false,
    recordAudio: false,
    recordPath: "",
    recordTimeLimit: 0, // 0 = unlimited
    camera: false,
    cameraId: "",
    cameraSize: "1920x1080",
    cameraFps: 30,
    windowBorderless: false,
    disableScreensaver: false,
  },
  encoding: {
    videoCodec: "h264",
    videoEncoder: "", // Empty means use default (will auto-select if needed)
    audioCodec: "opus",
    bitrateMode: "vbr",
    ignoreVideoEncoderConstraints: false,
  },
  server: {
    tunnelMode: "reverse",
    cleanup: true,
    scrcpyPath: app.isPackaged
      ? path.join(
          process.resourcesPath,
          "app",
          PLATFORM_FOLDER,
          getScrcpyExecutable()
        )
      : path.join(process.cwd(), "app", PLATFORM_FOLDER, getScrcpyExecutable()),
    adbPath: app.isPackaged
      ? path.join(process.resourcesPath, "app", PLATFORM_FOLDER, getAdbExecutable())
      : path.join(process.cwd(), "app", PLATFORM_FOLDER, getAdbExecutable()),
  },
  logLevel: "info",
  deviceHistory: [],
  pendingInstallerPath: null, // Track pending installer for deletion on next startup
};

// Load settings from file
function loadSettings(): void {
  const settingsPath = path.join(app.getPath("userData"), "settings.json");
  if (existsSync(settingsPath)) {
    try {
      const saved = JSON.parse(
        readFileSync(settingsPath, "utf8")
      ) as Partial<Settings>;
      if (saved.display) {
        settings.display = { ...settings.display, ...saved.display };
      }
      if (saved.encoding) {
        settings.encoding = { ...settings.encoding, ...saved.encoding };
      }
      if (saved.server) {
        settings.server = { ...settings.server, ...saved.server };
      }
      if (saved.logLevel) {
        settings.logLevel = saved.logLevel;
        logger.setLevel(saved.logLevel);
      }
      if (saved.deviceHistory && Array.isArray(saved.deviceHistory)) {
        settings.deviceHistory = saved.deviceHistory;
        // Restore connected devices from persisted state
        connectedDevices.clear();
        for (const device of settings.deviceHistory) {
          if (device.isConnected) {
            connectedDevices.add(device.id);
            connectedDevicesInfo.set(device.id, { name: device.name });
          }
        }
        logger.info(`Restored ${connectedDevices.size} connected devices from history`);
      }
      // Load pending installer path for cleanup
      if (saved.pendingInstallerPath !== undefined) {
        settings.pendingInstallerPath = saved.pendingInstallerPath;
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Failed to load settings:", errorMessage);
    }
  }
}

// Parse device list from adb output
function parseDeviceList(output: string): DeviceInfo[] {
  const devices: DeviceInfo[] = [];
  const lines = output.trim().split("\n");

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      const id = parts[0];
      const status = parts[1];

      if (status === "device" || status === "unauthorized") {
        const type = id.includes(":") ? "wifi" : "usb";
        // Try to get device name from connectedDevicesInfo first, then from model field
        const deviceInfo = connectedDevicesInfo.get(id);
        const modelMatch = line.match(/model:(\S+)/);
        const name = deviceInfo?.name || modelMatch?.[1] || parts[2] || "Unknown Device";

        devices.push({
          id,
          name,
          type,
          // Only show as "connected" if ADB reports "device" AND device is in connectedDevices
          // This prevents stale "connected" status when device actually disconnected
          status: connectedDevices.has(id) && status === "device" ? "connected" : status,
        });
      }
    }
  }

  return devices;
}

// Get scrcpy version
function getScrcpyVersion(): Promise<{
  success: boolean;
  version?: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    if (TEST_MODE) {
      resolve({ success: true, version: "2.4.0-test" });
      return;
    }
    exec(
      `"${getScrcpyPath()}" --version`,
      { encoding: "utf8" },
      (error, stdout) => {
        if (error) {
          resolve({ success: false, error: error.message });
          return;
        }
        // Try multiple patterns to match different scrcpy version output formats
        let match = stdout.match(/scrcpy v(\S+)/);
        if (!match) match = stdout.match(/scrcpy\s+(\S+)/);
        if (!match) match = stdout.match(/version[:\s]+(\S+)/i);
        if (!match) match = stdout.match(/(\d+\.\d+\.\d+)/);
        resolve({ success: true, version: match ? match[1] : "unknown" });
      }
    );
  });
}

// Get ADB version
function getAdbVersion(): Promise<{
  success: boolean;
  version?: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    if (TEST_MODE) {
      resolve({ success: true, version: "1.0.41-test" });
      return;
    }
    exec(`"${getAdbPath()}" version`, { encoding: "utf8" }, (error, stdout) => {
      if (error) {
        resolve({ success: false, error: error.message });
        return;
      }
      const match = stdout.match(/Android Debug Bridge version (\S+)/);
      resolve({ success: true, version: match ? match[1] : "unknown" });
    });
  });
}

function createWindow(): void {
  // Get icon path
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "icons", "icon.ico")
    : path.join(process.cwd(), "icons", "icon.ico");

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    frame: false,
    show: false,
    backgroundColor: "#0F0F14",
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.cjs"),
    },
  });

  // Load the app - use dev server URL in development, file in production
  if (process.env.NODE_ENV === "development" || !app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();

    // Restore device states from persisted history first (prevent status flicker)
    // This ensures devices show their last known state immediately
    for (const device of settings.deviceHistory) {
      if (device.isConnected && mainWindow) {
        const isWifi = device.id.includes(":");
        // WiFi devices should have status "connected", USB devices use "device"
        const status = isWifi ? "connected" : "device";
        mainWindow.webContents.send("device-change", {
          type: "add",
          device: {
            id: device.id,
            name: device.name,
            type: isWifi ? "wifi" : "usb",
            status,
          },
        });
        // Track notified devices to prevent duplicate notifications
        notifiedDevices.add(device.id);
        // Ensure connectedDevices set is populated
        connectedDevices.add(device.id);
        connectedDevicesInfo.set(device.id, { name: device.name });
      }
    }

    // Start ADB server and wait for it to be ready before initializing tracker
    // This ensures tracker has valid ADB connection from the start
    logger.info("Starting ADB server and scheduling auto-connect...");
    startAdbServer().then(() => {
      logger.info("ADB server ready, initializing tracker...");
      // ADB is ready, now initialize tracker
      setImmediate(() => {
        initDeviceTracker();
      });

      // Auto-connect to saved devices after tracker is ready
      setTimeout(() => {
        logger.info("Calling autoConnectSavedDevices...");
        autoConnectSavedDevices();
      }, 500);
    });
  });

  // Intercept window close to show confirmation dialog
  mainWindow.on("close", (e) => {
    // Prevent default close behavior
    e.preventDefault();

    // Ask renderer to show close confirmation dialog
    mainWindow?.webContents.send("show-close-confirm");
  });

  // Listen for close confirmation result from renderer
  ipcMain.on("close-confirm-result", async (_, result: { minimizeToTray: boolean }) => {
    if (result.minimizeToTray) {
      // Minimize to tray - just hide the window
      mainWindow?.hide();
    } else {
      // Quit - use same logic as tray quit
      isCleaningUp = true;
      await cleanupAllProcesses();
      if (mainWindow) {
        mainWindow.destroy();
        mainWindow = null;
      }
      if (tray) {
        tray.destroy();
        tray = null;
      }
      app.exit(0);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Listen for quit animation request from renderer
  mainWindow.webContents.on("render-process-gone", (_, details) => {
    logger.warn("Render process gone:", details);
  });
}

// IPC Handlers

// Quit app handler
ipcMain.handle("quit-app", async (): Promise<void> => {
  logger.info("User requested quit via IPC");

  // Notify renderer to show termination animation first
  if (mainWindow) {
    mainWindow.webContents.send("quit-animation");
  }

  // Give renderer time to show animation
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Start cleanup - cleanupAllProcesses will set isCleaningUp internally
  await cleanupAllProcesses();

  if (mainWindow) {
    mainWindow.destroy();
    mainWindow = null;
  }
  if (tray) {
    tray.destroy();
    tray = null;
  }

  app.exit(0);
});

// Get devices
ipcMain.handle(
  "adb-devices",
  async (): Promise<{
    success: boolean;
    devices?: DeviceInfo[];
    error?: string;
  }> => {
    if (TEST_MODE) {
      return {
        success: true,
        devices: [
          {
            id: "emulator-5554",
            name: "Android Emulator",
            type: "usb",
            status: connectedDevices.has("emulator-5554")
              ? "connected"
              : "disconnected",
          },
          {
            id: "192.168.1.100:5555",
            name: "Xiaomi 13 Pro",
            type: "wifi",
            status: connectedDevices.has("192.168.1.100:5555")
              ? "connected"
              : "disconnected",
          },
        ],
      };
    }

    // Only log device list polling when user has set log level to info or debug
    if (logger.getLevel() === "info" || logger.getLevel() === "debug") {
      logger.info("Fetching device list...");
    }
    return new Promise((resolve) => {
      exec(
        `"${getAdbPath()}" devices -l`,
        { encoding: "utf8" },
        (error, stdout, stderr) => {
          if (error) {
            logger.error("Failed to get devices", { error, stderr });
            resolve({ success: false, error: error.message });
            return;
          }

          if (logger.getLevel() === "debug") {
            logger.debug("ADB devices output", { stdout });
          }
          const devices = parseDeviceList(stdout);
          if (logger.getLevel() === "info" || logger.getLevel() === "debug") {
            logger.info(`Found ${devices.length} device(s)`, { devices });
          }
          resolve({ success: true, devices });
        }
      );
    });
  }
);

// Connect WIFI device handler
ipcMain.handle(
  "connect-wifi",
  async (
    _,
    deviceId: string
  ): Promise<{ success: boolean; error?: string }> => {
    return connectWifiDevice(deviceId);
  }
);

// Enable TCP/IP mode on USB device
ipcMain.handle(
  "enable-tcpip",
  async (
    _,
    deviceId: string
  ): Promise<{ success: boolean; ip?: string; error?: string }> => {
    if (TEST_MODE) {
      return { success: true, ip: "192.168.1.100" };
    }

    logger.info(`Enabling TCP/IP mode for device: ${deviceId}`);
    return new Promise((resolve) => {
      // First, get device IP address while still in USB mode
      exec(
        `"${getAdbPath()}" -s ${deviceId} shell ip route`,
        { encoding: "utf8" },
        (error2, stdout2, stderr2) => {
          let ip = "";
          if (!error2 && stdout2) {
            const match = stdout2.match(/src\s+(\d+\.\d+\.\d+\.\d+)/);
            if (match) {
              ip = match[1];
              logger.info(`Got IP address for ${deviceId}: ${ip}`);
            }
          }

          // Then enable TCP/IP mode on port 5555
          exec(
            `"${getAdbPath()}" -s ${deviceId} tcpip 5555`,
            { encoding: "utf8" },
            (error, stdout, stderr) => {
              if (error) {
                logger.error(`Failed to enable TCP/IP for ${deviceId}`, {
                  error,
                  stderr,
                });
                resolve({ success: false, error: error.message });
                return;
              }

              logger.debug(`TCP/IP enabled for ${deviceId}`, { stdout });

              if (ip) {
                resolve({ success: true, ip });
              } else {
                logger.warn(
                  `TCP/IP enabled but failed to get IP for ${deviceId}`,
                  {
                    error2,
                    stderr2,
                  }
                );
                resolve({
                  success: true,
                  error:
                    "TCP/IP 模式已启用，但无法获取 IP 地址。请手动输入设备 IP。",
                });
              }
            }
          );
        }
      );
    });
  }
);

// Connect WIFI device helper
async function connectWifiDevice(
  deviceId: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (TEST_MODE) {
      connectedDevices.add(deviceId);
      connectedDevicesInfo.set(deviceId, { name: "Test Device" });
      resolve({ success: true });
      return;
    }

    logger.info(`Connecting to WiFi device: ${deviceId}`);
    exec(
      `"${getAdbPath()}" connect ${deviceId}`,
      { encoding: "utf8" },
      (error, stdout, stderr) => {
        if (error) {
          logger.error(`Failed to connect to ${deviceId}`, { error, stderr });
          resolve({ success: false, error: error.message });
          return;
        }

        logger.debug(`ADB connect output for ${deviceId}`, { stdout });

        if (
          stdout.includes("connected") ||
          stdout.includes("already connected")
        ) {
          connectedDevices.add(deviceId);

          // Get device name after successful connection
          exec(
            `"${getAdbPath()}" -s ${deviceId} shell getprop ro.product.model`,
            { encoding: "utf8" },
            (err, modelOutput) => {
              const deviceName = err ? deviceId : modelOutput.trim() || deviceId;
              connectedDevicesInfo.set(deviceId, { name: deviceName });
              logger.info(`Successfully connected to ${deviceId}, name: ${deviceName}`);

              // Notify frontend about successful connection
              notifyDeviceConnected(deviceId, deviceName, "wifi");
            }
          );

          resolve({ success: true });
        } else {
          logger.warn(`Connection failed for ${deviceId}`, { stdout });
          // Return user-friendly error message
          let error = "连接失败，请检查设备 IP 和网络连接";
          if (stdout.includes("refused")) {
            error = "连接被拒绝，请确保设备已启用 WiFi 模式";
          } else if (stdout.includes("timeout")) {
            error = "连接超时，请检查设备 IP 是否正确";
          } else if (stdout.includes("no route to host")) {
            error = "无法找到设备，请检查网络连接";
          }
          resolve({ success: false, error });
        }
      }
    );
  });
}

// Connect device and start scrcpy
ipcMain.handle(
  "connect-device",
  async (
    _,
    deviceId: string
  ): Promise<{ success: boolean; deviceId?: string; error?: string }> => {
    const isWifi = deviceId.includes(":");

    logger.info(
      `Connecting to device: ${deviceId} (${isWifi ? "WiFi" : "USB"})`
    );

    // Fresh connect: drop any stale session record/audio/camera overrides
    clearSessionOverrides(deviceSessionOverrides, deviceId);

    // If WIFI device, connect first
    if (isWifi) {
      const connResult = await connectWifiDevice(deviceId);
      if (!connResult.success) {
        return connResult;
      }
    }

    // Build scrcpy args via shared pure builder (no --record-audio; camera needs video-source)
    const { display, encoding, server } = settings;
    const args = buildScrcpyArgs({
      deviceId,
      display,
      encoding,
      server,
      resolvedRecordPath: display.record
        ? resolveRecordPath(display.recordPath, deviceId)
        : undefined,
    });

    logger.info(`Starting scrcpy with args:`, { args });

    // Test mode - just log
    if (TEST_MODE) {
      logger.debug("Starting scrcpy with args:", { args });
      connectedDevices.add(deviceId);
      return { success: true, deviceId };
    }

    // Verify scrcpy path exists
    const currentScrcpyPath = getScrcpyPath();
    const currentAdbPath = getAdbPath();

    logger.debug(`[SCRCPY DEBUG] Path: ${currentScrcpyPath}`);
    logger.debug(`[SCRCPY DEBUG] ADB Path: ${currentAdbPath}`);
    logger.debug(`[SCRCPY DEBUG] Args: ${args.join(" ")}`);

    if (!existsSync(currentScrcpyPath)) {
      logger.error(`Scrcpy not found at: ${currentScrcpyPath}`);
      return {
        success: false,
        error: `Scrcpy not found at: ${currentScrcpyPath}`,
      };
    }

    logger.info(`Executing: ${currentScrcpyPath} ${args.join(" ")}`);

    // Spawn scrcpy process
    const proc = spawn(currentScrcpyPath, args, {
      env: { ...process.env, ADB: currentAdbPath },
      detached: false,
      stdio: "pipe",
    });

    // Track the pid for monitoring
    const scrcpyPid = proc.pid;
    if (!scrcpyPid) {
      logger.error(`Failed to get PID for scrcpy process`);
      return { success: false, error: "Failed to start scrcpy process" };
    }

    deviceProcesses.set(deviceId, { pid: scrcpyPid, proc: proc });
    connectedDevices.add(deviceId);
    logger.info(
      `Scrcpy started successfully for ${deviceId} (PID: ${scrcpyPid})`
    );

    // Notify renderer that scrcpy has started
    if (mainWindow) {
      mainWindow.webContents.send("scrcpy-started", deviceId);
    }

    // Helper function to notify renderer about scrcpy exit
    const notifyScrcpyExit = () => {
      clearInterval(checkInterval);
      deviceProcesses.delete(deviceId);
      connectedDevices.delete(deviceId);
      // Intentional restart preserves session; natural close clears it
      onProcessExitMaybeClearSession(
        preserveSessionOnExit,
        deviceSessionOverrides,
        deviceId
      );
      if (mainWindow) {
        mainWindow.webContents.send("scrcpy-exit", deviceId);
      }
    };

    // Capture scrcpy output for debugging
    proc.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      logger.debug(`[SCRCPY STDOUT ${deviceId}]: ${msg}`);
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      logger.debug(`[SCRCPY STDERR ${deviceId}]: ${msg}`);
    });

    // Monitor scrcpy process status
    proc.on("error", (err: any) => {
      logger.error(`[SCRCPY ERROR ${deviceId}]:`, err);
      notifyScrcpyExit();
    });

    proc.on("close", (code: any) => {
      logger.info(`[SCRCPY CLOSE ${deviceId}]: exit code ${code}`);
      notifyScrcpyExit();
    });

    // Check if scrcpy is still running periodically (cross-platform isProcessRunning)
    const checkInterval = registerInterval(() => {
      const procInfo = deviceProcesses.get(deviceId);
      if (!procInfo) {
        clearInterval(checkInterval);
        activeIntervals.delete(checkInterval);
        return;
      }

      try {
        if (!isProcessRunning(procInfo.pid)) {
          clearInterval(checkInterval);
          activeIntervals.delete(checkInterval);
          notifyScrcpyExit();
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.warn(`Error checking process status for ${deviceId}:`, errorMessage);
        clearInterval(checkInterval);
        activeIntervals.delete(checkInterval);
        notifyScrcpyExit();
      }
    }, PROCESS_CHECK_INTERVAL);

    // Save WiFi device to history and update connection state
    if (isWifi) {
      const [ip, portStr] = deviceId.split(":");
      const port = parseInt(portStr) || 5555;
      // Check if already in history
      const existingDevice = settings.deviceHistory.find(
        (d) => d.id === deviceId
      );
      if (existingDevice) {
        // Update last connected time and connection state
        existingDevice.lastConnected = Date.now();
        existingDevice.isConnected = true;
      } else {
        // Add to history with autoConnect=true and isConnected=true
        addDeviceToHistory(deviceId, "Unknown Device", ip, port, true, true);
      }
      // Update persistent connection state
      updateDeviceConnectionState(deviceId, true);
    }

    return { success: true, deviceId };
  }
);

// File manager - list device files
ipcMain.handle(
  "list-device-files",
  async (_, deviceId: string, devicePath: string): Promise<{
    success: boolean;
    files?: Array<{ name: string; path: string; type: "file" | "directory"; size: string; modified: number }>;
    currentPath?: string;
    error?: string;
  }> => {
    if (TEST_MODE) {
      return {
        success: true,
        files: [
          { name: "Download", path: "/sdcard/Download", type: "directory", size: "-", modified: Date.now() },
          { name: "Pictures", path: "/sdcard/Pictures", type: "directory", size: "-", modified: Date.now() },
          { name: "DCIM", path: "/sdcard/DCIM", type: "directory", size: "-", modified: Date.now() },
          { name: "test.txt", path: "/sdcard/test.txt", type: "file", size: "1.0 KB", modified: Date.now() },
        ],
        currentPath: devicePath,
      };
    }

    try {
      logger.info(`Listing files for device ${deviceId} at path: ${devicePath}`);

      // Create ADB client
      const adbPath = getAdbPath();
      const client = Adb.createClient({ bin: adbPath });

      // Get device
      const device = client.getDevice(deviceId);

      // Resolve symlink first (e.g., /sdcard -> /storage/self/primary)
      let targetPath = devicePath;
      try {
        const resolveOutput = await device.shell(`readlink -f "${devicePath}"`);
        const resolvedBuffer = await Adb.util.readAll(resolveOutput);
        const resolved = resolvedBuffer.toString().trim();
        if (resolved && resolved !== devicePath) {
          targetPath = resolved;
          logger.info(`Resolved path: ${devicePath} -> ${targetPath}`);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.warn(`Failed to resolve symlink for ${devicePath}: ${errorMessage}`);
      }

      // Use adbkit's readdir which properly handles all file types including special characters
      const entries = await device.readdir(targetPath);
      logger.debug(`Found ${entries.length} entries in ${targetPath}`);

      const files = await Promise.all(
        entries.map(async (entry: any) => {
          const fullPath = path.posix.join(targetPath, entry.name);
          let size = "-";

          // Debug log for entry type
          logger.debug(`Entry: ${entry.name}, isFile: ${entry.isFile?.()}, isDirectory: ${entry.isDirectory?.()}`);

          // Get file size for files
          if (entry.isFile()) {
            try {
              const statOutput = await device.shell(`stat -c %s "${fullPath}"`);
              const statBuffer = await Adb.util.readAll(statOutput);
              const sizeStr = statBuffer.toString().trim();
              if (sizeStr && !isNaN(Number(sizeStr))) {
                size = prettyBytes(Number(sizeStr));
                logger.debug(`File size for ${entry.name}: ${size}`);
              }
            } catch (err: unknown) {
              const errorMessage = err instanceof Error ? err.message : String(err);
              logger.warn(`Failed to get size for ${fullPath}: ${errorMessage}`);
            }
          }

          return {
            name: entry.name,
            path: fullPath,
            type: entry.isFile() ? "file" : "directory" as const,
            size,
            modified: entry.mtimeMs || Date.now(),
          };
        })
      );

      logger.debug(`Listed ${files.length} files`);
      return { success: true, files, currentPath: targetPath };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to list files for ${deviceId}`, { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }
);

// File manager - download file from device
ipcMain.handle(
  "download-device-file",
  async (_, deviceId: string, devicePath: string, savePath: string): Promise<{ success: boolean; error?: string }> => {
    if (TEST_MODE) {
      return { success: true };
    }

    // Validate device ID
    if (!isValidDeviceId(deviceId)) {
      return { success: false, error: "Invalid device ID format" };
    }

    // Sanitize device path to prevent command injection
    const sanitizedDevicePath = sanitizeDevicePath(devicePath);
    if (sanitizedDevicePath !== devicePath) {
      logger.warn(`Device path sanitized: ${devicePath} -> ${sanitizedDevicePath}`);
    }

    const adbPath = getAdbPath();

    return new Promise((resolve) => {
      // Validate save path to prevent path traversal
      const downloadsPath = app.getPath("downloads");
      let targetDir = savePath;

      try {
        if (existsSync(savePath) && lstatSync(savePath).isFile()) {
          targetDir = path.dirname(savePath);
        }
      } catch (e: unknown) {
        // Path doesn't exist, might be a new file path
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.debug(`Error checking savePath existence: ${errorMessage}`);
      }

      // Validate the final path is within allowed directory
      const validatedPath = validateSavePath(targetDir, downloadsPath);
      if (!validatedPath) {
        return resolve({ success: false, error: "Invalid save path: path traversal detected" });
      }

      // Use spawn with explicit args to avoid shell encoding issues
      const { spawn } = require("child_process");
      const args = ["-s", deviceId, "pull", sanitizedDevicePath, validatedPath];
      const child = spawn(adbPath, args);

      let stderr = "";

      child.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      child.on("close", (code: number) => {
        if (code !== 0) {
          logger.error(`Failed to download file from ${deviceId}`, { stderr, code });
          resolve({ success: false, error: stderr || "Download failed" });
          return;
        }

        logger.info(`Downloaded file from ${deviceId}: ${devicePath} -> ${validatedPath}`);
        resolve({ success: true });
      });

      child.on("error", (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to download file from ${deviceId}`, { error: errorMessage });
        resolve({ success: false, error: errorMessage });
      });
    });
  }
);

// File manager - upload file to device
ipcMain.handle(
  "upload-file-to-device",
  async (_, deviceId: string, filePath: string, devicePath: string): Promise<{ success: boolean; error?: string }> => {
    if (TEST_MODE) {
      return { success: true };
    }

    // Validate device ID
    if (!isValidDeviceId(deviceId)) {
      return { success: false, error: "Invalid device ID format" };
    }

    // Sanitize device path to prevent command injection
    const sanitizedDevicePath = sanitizeDevicePath(devicePath);
    if (sanitizedDevicePath !== devicePath) {
      logger.warn(`Device path sanitized: ${devicePath} -> ${sanitizedDevicePath}`);
    }

    const adbPath = getAdbPath();

    return new Promise((resolve) => {
      // Use spawn with explicit args to avoid shell encoding issues
      const { spawn } = require("child_process");
      const args = ["-s", deviceId, "push", filePath, sanitizedDevicePath];
      const child = spawn(adbPath, args);

      let stderr = "";

      child.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      child.on("close", (code: number) => {
        if (code !== 0) {
          logger.error(`Failed to upload file to ${deviceId}`, { stderr, code });
          resolve({ success: false, error: stderr || "Upload failed" });
          return;
        }

        logger.info(`Uploaded file to ${deviceId}: ${filePath} -> ${sanitizedDevicePath}`);
        resolve({ success: true });
      });

      child.on("error", (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to upload file to ${deviceId}`, { error: errorMessage });
        resolve({ success: false, error: errorMessage });
      });
    });
  }
);

// File manager - delete file on device
ipcMain.handle(
  "delete-device-file",
  async (_, deviceId: string, devicePath: string): Promise<{ success: boolean; error?: string }> => {
    if (TEST_MODE) {
      return { success: true };
    }

    // Validate device ID
    if (!isValidDeviceId(deviceId)) {
      return { success: false, error: "Invalid device ID format" };
    }

    // Sanitize device path to prevent command injection
    const sanitizedPath = sanitizeDevicePath(devicePath);
    if (sanitizedPath !== devicePath) {
      logger.warn(`Path sanitized: ${devicePath} -> ${sanitizedPath}`);
    }

    const adbPath = getAdbPath();

    return new Promise((resolve) => {
      // Use spawn with explicit args to avoid shell injection
      const { spawn } = require("child_process");
      const args = ["-s", deviceId, "shell", "rm", "-rf", "--", sanitizedPath];
      const child = spawn(adbPath, args);

      let stderr = "";

      child.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      child.on("close", (code: number) => {
        if (code !== 0) {
          logger.error(`Failed to delete file on ${deviceId}`, { stderr, code });
          resolve({ success: false, error: stderr || "Delete failed" });
          return;
        }
        logger.info(`Deleted file on ${deviceId}: ${sanitizedPath}`);
        resolve({ success: true });
      });

      child.on("error", (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to delete file on ${deviceId}`, { error: errorMessage });
        resolve({ success: false, error: errorMessage });
      });
    });
  }
);

// File manager - create folder on device
ipcMain.handle(
  "create-device-folder",
  async (_, deviceId: string, devicePath: string): Promise<{ success: boolean; error?: string }> => {
    if (TEST_MODE) {
      return { success: true };
    }

    // Validate device ID
    if (!isValidDeviceId(deviceId)) {
      return { success: false, error: "Invalid device ID format" };
    }

    // Sanitize device path to prevent command injection
    const sanitizedPath = sanitizeDevicePath(devicePath);
    if (sanitizedPath !== devicePath) {
      logger.warn(`Path sanitized: ${devicePath} -> ${sanitizedPath}`);
    }

    const adbPath = getAdbPath();

    return new Promise((resolve) => {
      // Use spawn with explicit args to avoid shell injection
      const { spawn } = require("child_process");
      const args = ["-s", deviceId, "shell", "mkdir", "-p", "--", sanitizedPath];
      const child = spawn(adbPath, args);

      let stderr = "";

      child.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      child.on("close", (code: number) => {
        if (code !== 0) {
          logger.error(`Failed to create folder on ${deviceId}`, { stderr, code });
          resolve({ success: false, error: stderr || "Create folder failed" });
          return;
        }
        logger.info(`Created folder on ${deviceId}: ${sanitizedPath}`);
        resolve({ success: true });
      });

      child.on("error", (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to create folder on ${deviceId}`, { error: errorMessage });
        resolve({ success: false, error: errorMessage });
      });
    });
  }
);

// File manager - install APK on device
ipcMain.handle(
  "install-apk",
  async (_, deviceId: string, apkPath: string): Promise<{
    success: boolean;
    packageName?: string;
    error?: string;
  }> => {
    if (TEST_MODE) {
      return { success: true, packageName: "com.test.app" };
    }

    const adbPath = getAdbPath();

    logger.info(`Installing APK on ${deviceId}: ${apkPath}`);

    return new Promise((resolve) => {
      exec(
        `"${adbPath}" -s ${deviceId} install -r "${apkPath}"`,
        { encoding: "utf8" },
        (error, stdout, stderr) => {
          if (error) {
            logger.error(`Failed to install APK on ${deviceId}`, { error, stderr });
            resolve({ success: false, error: stderr || error.message });
            return;
          }

          // Check if installation was successful
          const output = stdout || stderr;
          if (output.includes("Success")) {
            logger.info(`Successfully installed APK on ${deviceId}`);
            // Try to extract package name from APK file name
            const fileName = apkPath.split("/").pop() || "";
            const packageName = fileName.replace(".apk", "");
            resolve({ success: true, packageName });
          } else if (output.includes("INSTALL_FAILED")) {
            logger.error(`APK installation failed on ${deviceId}: ${output}`);
            resolve({ success: false, error: output.trim() });
          } else {
            logger.warn(`Unknown installation result on ${deviceId}: ${output}`);
            resolve({ success: false, error: output.trim() });
          }
        }
      );
    });
  }
);

// Disconnect device - only stop scrcpy, don't disconnect ADB
ipcMain.handle(
  "disconnect-device",
  async (_, deviceId: string): Promise<{ success: boolean }> => {
    logger.info(`Stopping scrcpy for device: ${deviceId}`);

    await stopTrackedProcess(deviceProcesses, deviceId);
    connectedDevices.delete(deviceId);
    clearSessionOverrides(deviceSessionOverrides, deviceId);

    // 通知渲染进程更新状态
    if (mainWindow) {
      mainWindow.webContents.send("scrcpy-exit", deviceId);
    }

    // Note: We do NOT call ADB disconnect here
    // The ADB connection should remain for future reconnections
    // Only the screen mirroring (scrcpy) is stopped

    logger.info(`Scrcpy stopped for ${deviceId}, ADB connection preserved`);
    return { success: true };
  }
);

// Save settings - supports single type or multiple settings at once
ipcMain.handle(
  "save-settings",
  async (
    _,
    type: string | { display?: object; encoding?: object; server?: object },
    newSettings?: object
  ): Promise<{ success: boolean }> => {
    // Handle batch save (object parameter)
    if (typeof type === "object" && !newSettings) {
      if (type.display) {
        settings.display = { ...settings.display, ...(type.display as Partial<DisplaySettings>) };
      }
      if (type.encoding) {
        settings.encoding = { ...settings.encoding, ...(type.encoding as Partial<EncodingSettings>) };
      }
      if (type.server) {
        settings.server = { ...settings.server, ...(type.server as Partial<ServerSettings>) };
      }
    } else {
      // Handle single type save (legacy mode)
      const settingsType = type as string;
      if (settingsType === "display") {
        settings.display = {
          ...settings.display,
          ...(newSettings as Partial<DisplaySettings>),
        };
      } else if (settingsType === "encoding") {
        settings.encoding = {
          ...settings.encoding,
          ...(newSettings as Partial<EncodingSettings>),
        };
      } else if (settingsType === "server") {
        settings.server = {
          ...settings.server,
          ...(newSettings as Partial<ServerSettings>),
        };
      } else if (settingsType === "deviceHistory") {
        settings.deviceHistory = newSettings as DeviceHistory[];
      }
    }

    // Save to userData directory (works in both dev and packaged mode)
    await saveSettingsToFile();

    logger.info(`Settings saved`);
    return { success: true };
  }
);

// Device history management functions
async function addDeviceToHistory(
  deviceId: string,
  name: string,
  ip: string,
  port: number = 5555,
  autoConnect: boolean = true,
  isConnected: boolean = false
): Promise<void> {
  // Remove existing entry with same device ID
  settings.deviceHistory = settings.deviceHistory.filter(
    (d) => d.id !== deviceId
  );

  // Add new entry at the beginning
  settings.deviceHistory.unshift({
    id: deviceId,
    name,
    ip,
    port,
    lastConnected: Date.now(),
    autoConnect,
    isConnected,
  });

  // Keep only last 20 devices
  if (settings.deviceHistory.length > 20) {
    settings.deviceHistory = settings.deviceHistory.slice(0, 20);
  }

  // Save to file
  await saveSettingsToFile();
}

async function removeDeviceFromHistory(deviceId: string): Promise<void> {
  settings.deviceHistory = settings.deviceHistory.filter(
    (d) => d.id !== deviceId
  );

  // Save to file
  await saveSettingsToFile();
}

async function updateDeviceAutoConnect(deviceId: string, autoConnect: boolean): Promise<void> {
  const device = settings.deviceHistory.find((d) => d.id === deviceId);
  if (device) {
    device.autoConnect = autoConnect;

    // Save to file
    await saveSettingsToFile();
  }
}

async function updateDeviceConnectionState(deviceId: string, isConnected: boolean): Promise<void> {
  const device = settings.deviceHistory.find((d) => d.id === deviceId);
  if (device) {
    device.isConnected = isConnected;
    if (isConnected) {
      device.lastConnected = Date.now();
    }
    // Save to file
    await saveSettingsToFile();
  }
}

// Load settings
ipcMain.handle("load-settings", async (): Promise<Settings> => {
  return settings;
});

// Device history IPC handlers (kept for backward compatibility, data saved when connecting)
ipcMain.handle("get-device-history", async (): Promise<DeviceHistory[]> => {
  return settings.deviceHistory;
});

ipcMain.handle(
  "remove-device-history",
  async (_, deviceId: string): Promise<{ success: boolean }> => {
    removeDeviceFromHistory(deviceId);
    return { success: true };
  }
);

ipcMain.handle(
  "update-device-auto-connect",
  async (
    _,
    deviceId: string,
    autoConnect: boolean
  ): Promise<{ success: boolean }> => {
    updateDeviceAutoConnect(deviceId, autoConnect);
    return { success: true };
  }
);

ipcMain.handle("clear-device-history", async () => {
  settings.deviceHistory = [];
  saveSettingsToFile();
  return { success: true };
});

// Log level control
ipcMain.handle("get-log-level", async () => {
  return { level: logger.getLevel() };
});

ipcMain.handle(
  "set-log-level",
  async (_, level: string): Promise<{ success: boolean; level?: string; error?: string }> => {
    try {
      logger.setLevel(level as any);
      saveSettingsToFile();
      return { success: true, level };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }
);

// Auto-connect to saved devices on startup
async function autoConnectSavedDevices(): Promise<void> {
  logger.info("autoConnectSavedDevices called, checking devices...");

  // Log all devices in history for debugging
  logger.info(`deviceHistory has ${settings.deviceHistory.length} devices`);
  for (const d of settings.deviceHistory) {
    logger.info(`  - ${d.id}: autoConnect=${d.autoConnect}, isConnected=${d.isConnected}`);
  }

  // Connect to devices that were previously connected (isConnected=true)
  // This ensures devices saved before autoConnect flag was added still auto-connect
  const previouslyConnectedDevices = settings.deviceHistory.filter(
    (d) => d.isConnected
  );

  logger.info(`Found ${previouslyConnectedDevices.length} devices with isConnected=true`);

  if (previouslyConnectedDevices.length === 0) {
    logger.info("No previously connected devices, skipping...");
    return;
  }

  for (const device of previouslyConnectedDevices) {
    if (mainWindow) {
      logger.info(`Auto-connecting to saved device: ${device.id}`);
      const result = await connectWifiDevice(device.id);
      if (result.success) {
        // Already notified in connectWifiDevice
        logger.info(`Auto-connected to ${device.id}`);
      } else {
        logger.warn(`Failed to auto-connect to ${device.id}: ${result.error}`);
      }
    }
  }
}

// Quick action handlers

/**
 * Restart mirroring for a device with optional session overrides.
 * Does NOT mutate persistent auto-record (settings.display.record).
 *
 * Order (required):
 * 1. beginIntentionalRestart — merge patch + preserve flag BEFORE kill
 * 2. stopTrackedProcess({ forRestart: true }) — detach handlers, no session wipe
 * 3. spawn + register exit handlers that use onProcessExitMaybeClearSession
 * 4. endIntentionalRestart
 */
async function restartScrcpySession(
  deviceId: string,
  overrides: {
    forceRecord?: boolean;
    enableAudio?: boolean;
    forceCamera?: boolean;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  // 1) Merge session BEFORE any kill (process close must not wipe the Map first)
  const session = beginIntentionalRestart(
    preserveSessionOnExit,
    deviceSessionOverrides,
    deviceId,
    overrides
  );
  const forceRecord = forceRecordForArgs(session);

  try {
    // 2) Kill old process without clearing session overrides
    await stopTrackedProcess(deviceProcesses, deviceId, { forRestart: true });

    const isWifi = deviceId.includes(":");
    if (isWifi) {
      const connResult = await connectWifiDevice(deviceId);
      if (!connResult.success) {
        return { success: false, error: connResult.error };
      }
    }

    const { display, encoding, server } = settings;
    const willRecord =
      forceRecord === true || (forceRecord !== false && display.record);
    const recordPath = willRecord
      ? resolveRecordPath(display.recordPath, deviceId)
      : undefined;

    const args = buildScrcpyArgs({
      deviceId,
      display,
      encoding,
      server,
      resolvedRecordPath: recordPath,
      forceRecord,
      enableAudio: session.enableAudio,
      forceCamera: session.forceCamera,
    });

    logger.info(`Restart scrcpy session args: ${args.join(" ")}`, {
      session,
    });

    if (TEST_MODE) {
      connectedDevices.add(deviceId);
      return { success: true };
    }

    const currentScrcpyPath = getScrcpyPath();
    const currentAdbPath = getAdbPath();
    if (!existsSync(currentScrcpyPath)) {
      return {
        success: false,
        error: `Scrcpy not found at: ${currentScrcpyPath}`,
      };
    }

    const newProc = spawn(currentScrcpyPath, args, {
      env: { ...process.env, ADB: currentAdbPath },
      detached: false,
      stdio: "pipe",
    });

    const scrcpyPid = newProc.pid;
    if (!scrcpyPid) {
      return { success: false, error: "Failed to start scrcpy process" };
    }

    deviceProcesses.set(deviceId, { pid: scrcpyPid, proc: newProc });
    connectedDevices.add(deviceId);

    newProc.stdout?.on("data", (data: Buffer) => {
      logger.debug(`[SCRCPY STDOUT ${deviceId}]: ${data.toString().trim()}`);
    });
    newProc.stderr?.on("data", (data: Buffer) => {
      logger.debug(`[SCRCPY STDERR ${deviceId}]: ${data.toString().trim()}`);
    });

    if (mainWindow) {
      mainWindow.webContents.send("scrcpy-started", deviceId);
    }

    const notifyScrcpyExit = (code: unknown) => {
      logger.info(`Scrcpy exited for ${deviceId} with code: ${code}`);
      deviceProcesses.delete(deviceId);
      connectedDevices.delete(deviceId);
      onProcessExitMaybeClearSession(
        preserveSessionOnExit,
        deviceSessionOverrides,
        deviceId
      );
      if (mainWindow) {
        mainWindow.webContents.send("scrcpy-exit", deviceId);
      }
    };

    newProc.on("error", (err: unknown) => {
      logger.error(`Scrcpy error for ${deviceId}:`, err);
      notifyScrcpyExit(1);
    });
    newProc.on("close", (code: unknown) => {
      notifyScrcpyExit(code);
    });

    return { success: true };
  } finally {
    // 4) Future natural exits may clear session again
    endIntentionalRestart(preserveSessionOnExit, deviceId);
  }
}

// Start session recording (does not change global auto-record preference)
ipcMain.handle(
  "start-recording",
  async (
    _,
    deviceId: string
  ): Promise<{ success: boolean; error?: string }> => {
    logger.info(`Starting session recording for device: ${deviceId}`);
    const recordPath = resolveRecordPath(settings.display.recordPath, deviceId);
    logger.info(`Session recording path: ${recordPath}`);
    return restartScrcpySession(deviceId, { forceRecord: true });
  }
);

// Helper function to repair corrupted MP4 recording files
async function repairRecordingFile(filePath: string): Promise<boolean> {
  if (!existsSync(filePath)) {
    logger.warn(`Repair failed: file not found: ${filePath}`);
    return false;
  }

  const fixedPath = filePath.replace(/\.mp4$/i, "_fixed.mp4");

  return new Promise((resolve) => {
    logger.info(`Starting FFmpeg repair for: ${filePath}`);

    // Try multiple repair strategies
    const repairStrategies = [
      // Strategy 1: Re-mux with empty moov (for files with missing moov)
      [
        "-i",
        filePath,
        "-c",
        "copy",
        "-movflags",
        "+faststart+empty_moov+default_base_moov",
        "-y",
        fixedPath,
      ],
      // Strategy 2: Re-encode if copy fails (more robust but slower)
      [
        "-i",
        filePath,
        "-c",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "23",
        "-movflags",
        "+faststart",
        "-y",
        fixedPath,
      ],
    ];

    let currentStrategy = 0;

    const tryNextStrategy = () => {
      if (currentStrategy >= repairStrategies.length) {
        logger.warn(`All repair strategies failed for: ${filePath}`);
        // Clean up partial fixed file if it exists
        if (existsSync(fixedPath)) {
          try {
            unlinkSync(fixedPath);
          } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            logger.warn(`Failed to cleanup partial fixed file ${fixedPath}: ${errorMessage}`);
          }
        }
        resolve(false);
        return;
      }

      const args = repairStrategies[currentStrategy];
      logger.info(
        `Trying repair strategy ${currentStrategy + 1}: ffmpeg ${args.join(
          " "
        )}`
      );

      const repairProc = spawn("ffmpeg", args, {
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });

      const timeout = setTimeout(() => {
        repairProc.kill();
        currentStrategy++;
        tryNextStrategy();
      }, REPAIR_STRATEGY_TIMEOUT); // 10 second timeout per strategy

      let stderrData = "";

      repairProc.stderr?.on("data", (data: Buffer) => {
        stderrData += data.toString();
      });

      repairProc.on("close", (code: number) => {
        clearTimeout(timeout);

        if (code === 0 && existsSync(fixedPath)) {
          const origSize = statSync(filePath).size;
          const fixedSize = statSync(fixedPath).size;
          logger.info(
            `Repair strategy ${
              currentStrategy + 1
            } succeeded: ${origSize} -> ${fixedSize} bytes`
          );

          // Replace original with fixed file
          try {
            unlinkSync(filePath);
            renameSync(fixedPath, filePath);
            logger.info(`Successfully repaired: ${filePath}`);
            resolve(true);
          } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            logger.warn(`Failed to replace file: ${errorMessage}`);
            // Keep the fixed file with different name
            try {
              renameSync(
                fixedPath,
                filePath.replace(/\.mp4$/i, "_repaired.mp4")
              );
            } catch (e2: unknown) {
              const errorMessage2 = e2 instanceof Error ? e2.message : String(e2);
              logger.warn(`Failed to rename repaired file: ${errorMessage2}`);
            }
            resolve(false);
          }
        } else {
          logger.warn(
            `Repair strategy ${currentStrategy + 1} failed with code ${code}`
          );
          currentStrategy++;
          tryNextStrategy();
        }
      });

      repairProc.on("error", (err: unknown) => {
        clearTimeout(timeout);
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.warn(
          `Repair strategy ${currentStrategy + 1} error: ${errorMessage}`
        );
        currentStrategy++;
        tryNextStrategy();
      });
    };

    tryNextStrategy();
  });
}

// Stop session recording — does not clear global auto-record preference
ipcMain.handle(
  "stop-recording",
  async (
    _,
    deviceId: string
  ): Promise<{ success: boolean; error?: string }> => {
    logger.info(`Stopping session recording for device: ${deviceId}`);
    const recordPath = resolveRecordPath(settings.display.recordPath, deviceId);

    await stopTrackedProcess(deviceProcesses, deviceId);
    connectedDevices.delete(deviceId);

    // Best-effort repair of tiny/corrupt files (optional; needs system ffmpeg)
    if (!TEST_MODE && existsSync(recordPath)) {
      try {
        const fileSize = statSync(recordPath).size;
        logger.info(`Recording file: ${fileSize} bytes`);
        if (fileSize < 5000) {
          await repairRecordingFile(recordPath);
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.debug(`Recording file check failed: ${errorMessage}`);
      }
    }

    // Resume mirror without session record; keep display.record (auto-record) unchanged
    return restartScrcpySession(deviceId, { forceRecord: false });
  }
);

// Toggle audio for current session (does not persist enableAudio preference)
ipcMain.handle(
  "toggle-audio",
  async (
    _,
    deviceId: string,
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    logger.info(`Toggling audio for device ${deviceId} to: ${enabled}`);
    // Session-only audio; do not write settings.display.enableAudio
    return restartScrcpySession(deviceId, { enableAudio: enabled });
  }
);

// Toggle camera source on the main mirror session (session override; persists camera pref for next connect if needed)
ipcMain.handle(
  "toggle-camera",
  async (
    _,
    deviceId: string,
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    logger.info(`Toggling camera for device ${deviceId} to: ${enabled}`);
    // Persist preference for future connects (display setting), restart with forceCamera
    settings.display.camera = enabled;
    return restartScrcpySession(deviceId, { forceCamera: enabled });
  }
);

// Start camera independently (without mirroring)
ipcMain.handle(
  "start-camera",
  async (
    _,
    deviceId: string
  ): Promise<{ success: boolean; error?: string }> => {
    logger.info(`Starting camera for device: ${deviceId}`);

    const isWifi = deviceId.includes(":");

    // If WIFI device, connect first
    if (isWifi) {
      const connResult = await connectWifiDevice(deviceId);
      if (!connResult.success) {
        return connResult;
      }
    }

    const { display, encoding, server } = settings;

    const args = buildScrcpyArgs({
      deviceId,
      display,
      encoding,
      server,
      cameraOnly: true,
    });

    const currentScrcpyPath = getScrcpyPath();
    const currentAdbPath = getAdbPath();

    if (!existsSync(currentScrcpyPath)) {
      return {
        success: false,
        error: `Scrcpy not found at: ${currentScrcpyPath}`,
      };
    }

    logger.info(`Starting camera with args: ${args.join(" ")}`);

    if (TEST_MODE) {
      return { success: true };
    }

    const newProc = spawn(currentScrcpyPath, args, {
      env: { ...process.env, ADB: currentAdbPath },
      detached: false,
      stdio: "pipe",
    });

    const scrcpyPid = newProc.pid;
    if (!scrcpyPid) {
      logger.error(`Failed to get PID for camera scrcpy process`);
      return { success: false, error: "Failed to start scrcpy process" };
    }

    // Track camera process separately
    cameraProcesses.set(deviceId, { pid: scrcpyPid, proc: newProc });

    const notifyCameraExit = () => {
      cameraProcesses.delete(deviceId);
      if (mainWindow) {
        mainWindow.webContents.send("camera-exit", deviceId);
      }
    };

    newProc.on("error", notifyCameraExit);
    newProc.on("close", notifyCameraExit);

    logger.info(
      `Camera started successfully for ${deviceId} (PID: ${scrcpyPid})`
    );
    return { success: true };
  }
);

// Stop camera
ipcMain.handle(
  "stop-camera",
  async (_, deviceId: string): Promise<{ success: boolean }> => {
    logger.info(`Stopping camera for device: ${deviceId}`);
    await stopTrackedProcess(cameraProcesses, deviceId);

    if (mainWindow) {
      mainWindow.webContents.send("camera-exit", deviceId);
    }

    return { success: true };
  }
);

ipcMain.handle("get-version", getScrcpyVersion);
ipcMain.handle("get-adb-version", getAdbVersion);
ipcMain.handle("get-electron-version", async () => {
  return { version: process.versions.electron };
});
ipcMain.handle("get-chrome-version", async () => {
  return { version: process.versions.chrome };
});

// Get available video encoders for a device
ipcMain.handle(
  "get-encoders",
  async (_, deviceId: string, codec: string): Promise<{ success: boolean; encoders?: EncoderInfo[]; error?: string }> => {
    return getEncodersFromDevice(deviceId, codec);
  }
);

// Window controls
ipcMain.handle("window-minimize", () => mainWindow?.minimize());
ipcMain.handle("window-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle("window-close", () => mainWindow?.close());

// Open folder
ipcMain.handle("open-folder", async (_, folderPath: string): Promise<void> => {
  if (existsSync(folderPath)) {
    await shell.openPath(folderPath);
  }
});

// Open logs folder
ipcMain.handle("open-logs-folder", async (): Promise<void> => {
  const logDir = path.join(app.isPackaged ? app.getPath("userData") : process.cwd(), "logs");
  if (existsSync(logDir)) {
    await shell.openPath(logDir);
  } else {
    // Create the folder if it doesn't exist
    mkdirSync(logDir, { recursive: true });
    await shell.openPath(logDir);
  }
});

// Get log statistics
ipcMain.handle("get-log-stats", async (): Promise<{ count: number; size: string }> => {
  const logDir = path.join(app.isPackaged ? app.getPath("userData") : process.cwd(), "logs");

  if (!existsSync(logDir)) {
    return { count: 0, size: "0 KB" };
  }

  try {
    const files = readdirSync(logDir).filter((f) => f.endsWith(".log"));
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(logDir, file);
      const stats = statSync(filePath);
      totalSize += stats.size;
    }

    // Format size
    let sizeStr: string;
    if (totalSize < 1024) {
      sizeStr = `${totalSize} B`;
    } else if (totalSize < 1024 * 1024) {
      sizeStr = `${(totalSize / 1024).toFixed(1)} KB`;
    } else {
      sizeStr = `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
    }

    return { count: files.length, size: sizeStr };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to get log stats:", errorMessage);
    return { count: 0, size: "0 KB" };
  }
});

// Clear old logs (older than 7 days)
ipcMain.handle("clear-logs", async (): Promise<{ success: boolean; count: number; error?: string }> => {
  const logDir = path.join(app.isPackaged ? app.getPath("userData") : process.cwd(), "logs");

  if (!existsSync(logDir)) {
    return { success: true, count: 0 };
  }

  try {
    const files = readdirSync(logDir).filter((f) => f.endsWith(".log"));
    const now = Date.now();
    const sevenDaysAgo = now - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(logDir, file);
      const stats = statSync(filePath);

      // Delete files older than 7 days
      if (stats.mtimeMs < sevenDaysAgo) {
        unlinkSync(filePath);
        deletedCount++;
      }
    }

    logger.info(`Cleared ${deletedCount} old log files`);
    return { success: true, count: deletedCount };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to clear logs:", errorMessage);
    return { success: false, count: 0, error: errorMessage };
  }
});

// Open external URL
ipcMain.handle("open-external", async (_, url: string): Promise<void> => {
  await shell.openExternal(url);
});

// Select folder dialog
ipcMain.handle(
  "select-folder",
  async (
    _,
    defaultPath: string
  ): Promise<{ success: boolean; path?: string }> => {
    if (!mainWindow) {
      return { success: false };
    }

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      defaultPath: defaultPath || undefined,
      properties: ["openDirectory", "createDirectory"],
      title: "Select Recording Folder",
    });

    if (canceled) {
      return { success: false };
    }

    return { success: true, path: filePaths[0] };
  }
);

// Select file dialog
ipcMain.handle(
  "select-file",
  async (
    _,
    options: {
      defaultPath?: string;
      title?: string;
      filters?: { name: string; extensions: string[] }[];
    }
  ): Promise<{ success: boolean; path?: string }> => {
    if (!mainWindow) {
      return { success: false };
    }

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      defaultPath: options?.defaultPath || undefined,
      properties: ["openFile"],
      title: options?.title || "Select File",
      filters: options?.filters,
    });

    if (canceled) {
      return { success: false };
    }

    return { success: true, path: filePaths[0] };
  }
);

// Get current scrcpy path
ipcMain.handle("get-scrcpy-path", async () => {
  return settings.server.scrcpyPath || SCRCPY_PATH;
});



// Get current adb path
ipcMain.handle("get-adb-path", async () => {
  return settings.server.adbPath || ADB_PATH;
});

// Update scrcpy path
ipcMain.handle(
  "set-scrcpy-path",
  async (_, path: string): Promise<{ success: boolean }> => {
    settings.server.scrcpyPath = path;
    saveSettingsToFile();
    return { success: true };
  }
);

// Update adb path
ipcMain.handle(
  "set-adb-path",
  async (_, path: string): Promise<{ success: boolean }> => {
    settings.server.adbPath = path;
    saveSettingsToFile();
    return { success: true };
  }
);

// Get current scrcpy path (use custom path if set, otherwise default)
function getScrcpyPath(): string {
  return (
    settings.server.scrcpyPath ||
    (app.isPackaged
      ? path.join(
          process.resourcesPath,
          "app",
          PLATFORM_FOLDER,
          getScrcpyExecutable()
        )
      : path.join(process.cwd(), "app", PLATFORM_FOLDER, getScrcpyExecutable()))
  );
}

// Get current adb path (use custom path if set, otherwise default)
function getAdbPath(): string {
  // Check multiple ways to detect dev mode
  const isDev = process.env.ELECTRON_IS_DEV === "1" || process.env.NODE_ENV === "development" || !app.isPackaged;
  const adbPath = (
    isDev
      ? path.join(process.cwd(), "app", PLATFORM_FOLDER, getAdbExecutable())
      : (settings.server.adbPath || path.join(process.resourcesPath, "app", PLATFORM_FOLDER, getAdbExecutable()))
  );
  return adbPath;
}

// App lifecycle
let tray: Tray | null = null;

// Tray translations - loaded from renderer via IPC
let trayTranslations: Record<string, { showWindow: string; quit: string; tooltip: string }> = {};

// Set tray translations from renderer
ipcMain.on("set-tray-translations", (_event, translations) => {
  trayTranslations = translations;
  logger.info("Tray translations received from renderer, keys:", Object.keys(translations));
  
  // After receiving translations, trigger tray update
  // Try to get current language from settings
  const settingsPath = path.join(app.getPath("userData"), "settings.json");
  
  let lang = "en-US";
  if (existsSync(settingsPath)) {
    try {
      const data = JSON.parse(readFileSync(settingsPath, "utf-8"));
      if (data.language && translations[data.language]) {
        lang = data.language;
      }
    } catch (e: unknown) {
      // Use default
      const errorMessage = e instanceof Error ? e.message : String(e);
      logger.warn("Failed to read language from settings file:", errorMessage);
    }
  }
  
  // Also try to get from localStorage via renderer (delayed)
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript('localStorage.getItem("language") || "en-US"')
      .then((resultLang: string) => {
        if (resultLang && translations[resultLang]) {
          lang = resultLang;
        }
        updateTray(lang);
      })
      .catch((e: unknown) => {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.warn("Failed to get language from localStorage:", errorMessage);
        updateTray(lang);
      });
  } else {
    updateTray(lang);
  }
});

// Update tray menu with current language
function updateTray(lang: string): void {
  if (!tray) return;
  
  const translations = trayTranslations[lang] || trayTranslations["en-US"];
  
  if (!translations) {
    logger.warn("No translations found for lang:", lang);
    return;
  }
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: translations.showWindow,
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: translations.quit,
      click: async () => {
        // Show window and let user confirm before quitting
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          // Ask renderer to show close confirmation dialog
          mainWindow.webContents.send("show-close-confirm");
        }
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(translations.tooltip);
}

// Initialize system tray
function initTray(): void {
  // Create tray icon
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "icons", "icon.png")
    : path.join(process.cwd(), "icons", "icon.png");

  let trayIcon: NativeImage;

  if (existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    // Fallback to empty image
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));

  // Initialize with default English values
  const defaultTranslations = {
    showWindow: "Show Window",
    quit: "Quit",
    tooltip: "iScrcpy - Android Screen Mirroring",
  };

  const contextMenu = Menu.buildFromTemplate([
    {
      label: defaultTranslations.showWindow,
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: defaultTranslations.quit,
      click: async () => {
        // Show window and let user confirm before quitting
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          // Ask renderer to show close confirmation dialog
          mainWindow.webContents.send("show-close-confirm");
        }
      },
    },
  ]);

  tray.setToolTip(defaultTranslations.tooltip);
  tray.setContextMenu(contextMenu);

  // Double click to show window
  tray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  logger.info("System tray initialized");
}

// Update tray when language changes - use the translations we already received
ipcMain.on("language-changed", (_event, lang: string) => {
  // Just trigger update, the translations should already be in trayTranslations
  logger.info("language-changed received", { lang, hasTranslations: !!trayTranslations[lang] });
  if (trayTranslations[lang]) {
    updateTray(lang);
  } else if (trayTranslations["en-US"]) {
    updateTray("en-US");
  }
});

// Request translations from renderer and update tray - deprecated, no longer needed
ipcMain.handle("get-current-lang-and-update-tray", async () => {
  // This handler is deprecated, use set-tray-translations instead
  return "en-US";
});

// Request close confirmation from renderer
ipcMain.handle(
  "request-close-confirm",
  async () => {
    if (!mainWindow) return { confirm: false };

    const { response } = await dialog.showMessageBox(mainWindow, {
      type: "question",
      buttons: ["Minimize to Tray", "Quit"],
      defaultId: 0,
      cancelId: 1,
      title: "iScrcpy",
      message: "How would you like to close iScrcpy?",
      detail: "Minimize to Tray will keep iScrcpy running in the background.\nQuit will completely exit the application.",
    });

    return { confirm: true, minimizeToTray: response === 0 };
  }
);

app.whenReady().then(async () => {
  logger.info("App is ready, loading settings and creating window");

  // Initialize system tray
  if (!TEST_MODE) {
    initTray();
  }

  // Cleanup old installer from previous update
  cleanupOldInstaller();

  // Load settings first before creating window
  loadSettings();
  createWindow();
});

// Clean up all processes before app quits
app.on("will-quit", async (e) => {
  // 如果正在退出中，直接返回
  if (isCleaningUp || isQuittingForUpdate) {
    e.preventDefault();
    return;
  }

  isCleaningUp = true;
  logger.info("App is quitting, cleaning up all processes...");

  try {
    await cleanupAllProcesses();
    logger.info("Cleanup completed, letting app quit");
    // 不调用 app.quit()，让 Electron 自动退出
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Error during cleanup before quit", errorMessage);
    // 即使清理失败也让应用退出
  }
});

app.on("window-all-closed", () => {
  logger.info("All windows closed");
  if (process.platform !== "darwin") {
    logger.info("Quitting application");
    app.quit();
  }
});

app.on("activate", () => {
  logger.info("App activated");
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// GitHub repository for updates
const GITHUB_REPO = "JochenYang/iScrcpy";
const GITHUB_OWNER = "JochenYang";
const GITHUB_PAGES_URL = `https://${GITHUB_OWNER}.github.io/iScrcpy/version.json`;
const GITHUB_RELEASE_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;

// Version info type
interface ReleaseInfo {
  version: string;
  downloadUrl: {
    windows: string;
    mac: string;
    linux: string;
  };
  releaseNotes: string;
  publishedAt: string;
}

// Check for updates
ipcMain.handle(
  "check-for-updates",
  async (): Promise<{
    success: boolean;
    updateAvailable: boolean;
    currentVersion: string;
    latestVersion?: string;
    releaseNotes?: string;
    downloadUrl?: string;
    publishedAt?: string;
    error?: string;
  }> => {
    if (TEST_MODE) {
      return {
        success: true,
        updateAvailable: true,
        currentVersion: app.getVersion(),
        latestVersion: "1.1.0",
        releaseNotes: "Test release notes",
        downloadUrl: "https://github.com/JochenYang/iScrcpy/releases/latest",
        publishedAt: new Date().toISOString(),
      };
    }

    try {
      logger.info("Checking for updates...");

      const response = await net.fetch(GITHUB_PAGES_URL, {
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub Pages returned status ${response.status}`);
      }

      const data = await response.json() as ReleaseInfo;

      const currentVersion = app.getVersion();
      const latestVersion = data.version;

      const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;

      logger.info(`Current version: ${currentVersion}, Latest version: ${latestVersion}, Update available: ${updateAvailable}`);

      if (updateAvailable) {
        const platform = process.platform;
        let downloadUrl: string;

        switch (platform) {
          case "win32":
            downloadUrl = data.downloadUrl.windows;
            break;
          case "darwin":
            downloadUrl = data.downloadUrl.mac;
            break;
          case "linux":
            downloadUrl = data.downloadUrl.linux;
            break;
          default:
            downloadUrl = GITHUB_RELEASE_URL;
        }

        return {
          success: true,
          updateAvailable: true,
          currentVersion,
          latestVersion,
          releaseNotes: data.releaseNotes,
          downloadUrl,
          publishedAt: data.publishedAt,
        };
      }

      return {
        success: true,
        updateAvailable: false,
        currentVersion,
      };
    } catch (error: any) {
      logger.error("Failed to check for updates", { error: error.message });
      return {
        success: false,
        updateAvailable: false,
        currentVersion: app.getVersion(),
        error: error.message,
      };
    }
  }
);

// Download update
ipcMain.handle(
  "download-update",
  async (_, downloadUrl: string): Promise<{
    success: boolean;
    downloadPath?: string;
    error?: string;
  }> => {
    if (TEST_MODE) {
      return {
        success: true,
        // Download to desktop for easy access and manual cleanup by user
        downloadPath: path.join(app.getPath("desktop"), "iScrcpy-Setup-1.1.0.exe"),
      };
    }

    try {
      logger.info(`Downloading update from ${downloadUrl}`);

      // Download to desktop for easy access and manual cleanup by user
      const desktopPath = app.getPath("desktop");
      const fileName = downloadUrl.split("/").pop() || "iScrcpy-Setup.exe";
      const downloadPath = path.join(desktopPath, fileName);

      // Get a valid window for download
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0] || mainWindow;
      if (!win) {
        throw new Error("No window available for download");
      }

      // Use electron-dl for better download handling with progress
      await download(win, downloadUrl, {
        directory: desktopPath,
        filename: fileName,
        onProgress: (progress) => {
          // Send progress to renderer
          const percent = Math.round(progress.percent * 100);
          win.webContents.send("download-progress", percent);
        },
      });

      logger.info(`Update downloaded to ${downloadPath}`);

      return {
        success: true,
        downloadPath,
      };
    } catch (error: any) {
      logger.error("Failed to download update", { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }
);

// Install update - quits and runs the installer
ipcMain.handle(
  "install-update",
  async (_, installerPath: string): Promise<{ success: boolean; error?: string }> => {
    if (TEST_MODE) {
      return { success: true };
    }

    try {
      logger.info(`Installing update from ${installerPath}`);

      if (!existsSync(installerPath)) {
        throw new Error(`Installer not found at ${installerPath}`);
      }

      // Set flag to indicate this is an update quit
      isQuittingForUpdate = true;

      // Clean up all processes before installing
      logger.info("Cleaning up processes before installing update...");
      await cleanupAllProcesses();

      // Schedule installer for deletion on next startup
      settings.pendingInstallerPath = installerPath;

      // Open the installer - user needs to manually install
      await shell.openPath(installerPath);

      // Destroy the main window
      mainWindow?.destroy();
      mainWindow = null;

      // Give IPC messages time to process
      await new Promise(resolve => setTimeout(resolve, 100));

      // Quit the app so the installer can proceed
      logger.info("Quitting app to allow installer to run");
      app.exit(0);

      return { success: true };
    } catch (error: any) {
      logger.error("Failed to install update", { error: error.message });
      isQuittingForUpdate = false;
      return {
        success: false,
        error: error.message,
      };
    }
  }
);

// Get current app version
ipcMain.handle("get-app-version", async () => {
  return { version: app.getVersion() };
});

// Helper function to compare versions
// Returns 1 if a > b, -1 if a < b, 0 if equal
function compareVersions(a: string, b: string): number {
  const parseVersion = (v: string) => {
    return v.split(".").map((part) => {
      const num = parseInt(part, 10);
      return isNaN(num) ? 0 : num;
    });
  };

  const aParts = parseVersion(a);
  const bParts = parseVersion(b);
  const maxLen = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLen; i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }

  return 0;
}
