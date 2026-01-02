import { app, BrowserWindow, ipcMain, shell, dialog, net, Tray, Menu, globalShortcut, nativeImage, type NativeImage } from "electron";
import path from "path";
import { spawn, exec, execSync, ChildProcess } from "child_process";
import { existsSync, lstatSync, readFileSync, writeFileSync, statSync, mkdirSync, unlinkSync, renameSync, readdirSync, createWriteStream } from "fs";
import { logger } from "./logger";
import { Adb } from "@devicefarmer/adbkit";
import prettyBytes from "pretty-bytes";
import { download } from "electron-dl";

// Test mode flag
const TEST_MODE = process.env.TEST === "1";


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
  maxSize: number | "custom";
  videoBitrate: number | "custom";
  frameRate: number | "custom";
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
  audioCodec: string;
  bitrateMode: string;
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
}

interface Settings {
  display: DisplaySettings;
  encoding: EncodingSettings;
  server: ServerSettings;
  logLevel: string;
  deviceHistory: DeviceHistory[];
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

// Default settings
const settings: Settings = {
  display: {
    maxSize: 1920, // 1080p (1920 longest edge for 1080x1920 mobile resolution)
    videoBitrate: 8,
    frameRate: 60,
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
    audioCodec: "opus",
    bitrateMode: "vbr",
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
    } catch (e) {
      console.error("Failed to load settings:", e);
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
        // Try to get device name from model field
        const modelMatch = line.match(/model:(\S+)/);
        const name = modelMatch ? modelMatch[1] : parts[2] || "Unknown Device";

        devices.push({
          id,
          name,
          type,
          status: connectedDevices.has(id) ? "connected" : status,
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
    ? path.join(process.resourcesPath, "build", "icon.ico")
    : path.join(process.cwd(), "build", "icon.ico");

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
    // Auto-connect to saved devices after window is shown
    setTimeout(() => {
      autoConnectSavedDevices();
    }, 1000);
  });

  // Intercept window close to show confirmation dialog
  mainWindow.on("close", (e) => {
    // Prevent default close behavior
    e.preventDefault();

    // Ask renderer to show close confirmation dialog
    mainWindow?.webContents.send("show-close-confirm");
  });

  // Listen for close confirmation result from renderer
  ipcMain.on("close-confirm-result", (_, result: { minimizeToTray: boolean }) => {
    if (result.minimizeToTray) {
      // Minimize to tray - just hide the window
      mainWindow?.hide();
    } else {
      // Quit - allow close
      mainWindow?.destroy();
      app.quit();
    }
  });

  mainWindow.on("closed", () => {
    // Cleanup all processes
    Array.from(deviceProcesses.entries()).forEach(([, proc]) => {
      if (proc.pid) {
        try {
          process.kill(-proc.pid);
        } catch (e) {
          try {
            proc.proc?.kill();
          } catch (e2) {}
        }
      }
    });
    deviceProcesses.clear();
    connectedDevices.clear();
    mainWindow = null;
  });
}

// IPC Handlers

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
          logger.info(`Successfully connected to ${deviceId}`);
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

    // If WIFI device, connect first
    if (isWifi) {
      const connResult = await connectWifiDevice(deviceId);
      if (!connResult.success) {
        return connResult;
      }
    }

    // Build scrcpy args - minimal for testing
    const args = ["-s", deviceId];
    const { display, encoding, server } = settings;

    // Only add numeric values, skip "custom" or invalid values
    if (typeof display.maxSize === "number" && display.maxSize > 0) {
      args.push("--max-size", String(display.maxSize));
    }
    if (typeof display.videoBitrate === "number" && display.videoBitrate > 0) {
      args.push("--video-bit-rate", `${display.videoBitrate}M`);
    }
    if (typeof display.frameRate === "number" && display.frameRate > 0) {
      args.push("--max-fps", String(display.frameRate));
    }
    if (display.alwaysOnTop) args.push("--always-on-top");
    if (display.fullscreen) args.push("--fullscreen");
    if (display.stayAwake) args.push("--stay-awake");
    if (display.windowBorderless) args.push("--window-borderless");
    if (display.disableScreensaver) args.push("--disable-screensaver");

    // Video and audio toggle (disable if set to false)
    if (!display.enableVideo) args.push("--no-video");
    if (!display.enableAudio) args.push("--no-audio");

    // Recording options
    // Note: --record-audio requires scrcpy version 1.17+ with audio support compiled in
    if (display.record) {
      args.push("--record");
      args.push(resolveRecordPath(display.recordPath, deviceId));
    }
    // Time limit for recording (0 = unlimited)
    if (display.recordTimeLimit > 0) {
      args.push("--time-limit", String(display.recordTimeLimit));
    }
    // Skip --record-audio as it's not supported in scrcpy 3.3.4
    // if (display.recordAudio) args.push("--record-audio");

    // Camera options
    if (display.camera) {
      if (display.cameraId) args.push("--camera-id", display.cameraId);
      args.push("--camera-size", display.cameraSize);
      if (display.cameraFps !== 30)
        args.push("--camera-fps", String(display.cameraFps));
    }

    // Only add codec options if explicitly different from default
    // scrcpy supports: h264 (default), h265, av1
    if (
      encoding.videoCodec &&
      encoding.videoCodec !== "h264" &&
      encoding.videoCodec !== "h264 (default)"
    ) {
      // Normalize codec name (scrcpy expects h264, h265 or av1)
      let codec = encoding.videoCodec;
      // Handle various naming conventions
      if (
        codec.toLowerCase().includes("h265") ||
        codec.toLowerCase().includes("hevc")
      ) {
        codec = "h265";
      } else if (codec.toLowerCase().includes("av1")) {
        codec = "av1";
      }
      args.push("--video-codec", codec);
    }
    if (encoding.audioCodec && encoding.audioCodec !== "opus") {
      args.push("--audio-codec", encoding.audioCodec);
    }

    if (server.tunnelMode === "forward") args.push("--tunnel-forward");
    if (server.cleanup === false) args.push("--no-cleanup");

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

    // Check if scrcpy is still running periodically (every 2 seconds)
    const checkInterval = setInterval(() => {
      const procInfo = deviceProcesses.get(deviceId);
      if (!procInfo) {
        clearInterval(checkInterval);
        return;
      }

      try {
        // Check if process is still running using Windows tasklist
        exec(`tasklist /FI "PID eq ${procInfo.pid}" /FO CSV`, (err, stdout) => {
          if (err || !stdout.includes(String(procInfo.pid))) {
            // Process no longer exists, notify exit
            clearInterval(checkInterval);
            notifyScrcpyExit();
          }
        });
      } catch (e) {
        // Error checking, assume process is dead
        clearInterval(checkInterval);
        notifyScrcpyExit();
      }
    }, 2000);

    // Save WiFi device to history
    if (isWifi) {
      const [ip, portStr] = deviceId.split(":");
      const port = parseInt(portStr) || 5555;
      // Check if already in history
      const existingDevice = settings.deviceHistory.find(
        (d) => d.id === deviceId
      );
      if (existingDevice) {
        // Update last connected time
        existingDevice.lastConnected = Date.now();
      } else {
        // Add to history with autoConnect=false by default
        addDeviceToHistory(deviceId, "Unknown Device", ip, port, false);
      }
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
      } catch (err) {
        logger.warn(`Failed to resolve symlink for ${devicePath}: ${err}`);
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
            } catch (err) {
              logger.warn(`Failed to get size for ${fullPath}: ${err}`);
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
    } catch (error: any) {
      logger.error(`Failed to list files for ${deviceId}`, { error: error.message });
      return { success: false, error: error.message };
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

    const adbPath = getAdbPath();
    
    return new Promise((resolve) => {
      exec(
        `"${adbPath}" -s ${deviceId} pull "${devicePath}" "${savePath}"`,
        { encoding: "utf8" },
        (error, stdout, stderr) => {
          if (error) {
            logger.error(`Failed to download file from ${deviceId}`, { error, stderr });
            resolve({ success: false, error: error.message });
            return;
          }
          logger.info(`Downloaded file from ${deviceId}: ${devicePath} -> ${savePath}`);
          resolve({ success: true });
        }
      );
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

    const adbPath = getAdbPath();
    
    return new Promise((resolve) => {
      exec(
        `"${adbPath}" -s ${deviceId} push "${filePath}" "${devicePath}"`,
        { encoding: "utf8" },
        (error, stdout, stderr) => {
          if (error) {
            logger.error(`Failed to upload file to ${deviceId}`, { error, stderr });
            resolve({ success: false, error: error.message });
            return;
          }
          logger.info(`Uploaded file to ${deviceId}: ${filePath} -> ${devicePath}`);
          resolve({ success: true });
        }
      );
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

    const adbPath = getAdbPath();
    
    return new Promise((resolve) => {
      exec(
        `"${adbPath}" -s ${deviceId} shell rm -rf "${devicePath}"`,
        { encoding: "utf8" },
        (error, stdout, stderr) => {
          if (error) {
            logger.error(`Failed to delete file on ${deviceId}`, { error, stderr });
            resolve({ success: false, error: error.message });
            return;
          }
          logger.info(`Deleted file on ${deviceId}: ${devicePath}`);
          resolve({ success: true });
        }
      );
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

    const adbPath = getAdbPath();
    
    return new Promise((resolve) => {
      exec(
        `"${adbPath}" -s ${deviceId} shell mkdir -p "${devicePath}"`,
        { encoding: "utf8" },
        (error, stdout, stderr) => {
          if (error) {
            logger.error(`Failed to create folder on ${deviceId}`, { error, stderr });
            resolve({ success: false, error: error.message });
            return;
          }
          logger.info(`Created folder on ${deviceId}: ${devicePath}`);
          resolve({ success: true });
        }
      );
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

    // Kill scrcpy process - this only stops screen mirroring
    const proc = deviceProcesses.get(deviceId);
    if (proc && !TEST_MODE) {
      if (proc.pid) {
        try {
          // 使用 taskkill 强制终止 scrcpy 进程
          exec(`taskkill /PID ${proc.pid} /F /T`);
          logger.debug(`Killed scrcpy process for ${deviceId}`);
        } catch (e) {
          try {
            proc.proc?.kill();
            logger.debug(`Killed scrcpy process (fallback) for ${deviceId}`);
          } catch (e2) {
            logger.warn(`Failed to kill scrcpy process for ${deviceId}`, e2);
          }
        }
      }
    }
    deviceProcesses.delete(deviceId);
    connectedDevices.delete(deviceId);

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

// Save settings
ipcMain.handle(
  "save-settings",
  async (
    _,
    type: string,
    newSettings: object
  ): Promise<{ success: boolean }> => {
    if (type === "display") {
      settings.display = {
        ...settings.display,
        ...(newSettings as Partial<DisplaySettings>),
      };
    } else if (type === "encoding") {
      settings.encoding = {
        ...settings.encoding,
        ...(newSettings as Partial<EncodingSettings>),
      };
    } else if (type === "server") {
      settings.server = {
        ...settings.server,
        ...(newSettings as Partial<ServerSettings>),
      };
    } else if (type === "deviceHistory") {
      settings.deviceHistory = newSettings as DeviceHistory[];
    }

    // Save to userData directory (works in both dev and packaged mode)
    const settingsPath = path.join(app.getPath("userData"), "settings.json");
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    logger.info(`Settings saved to: ${settingsPath}`);
    return { success: true };
  }
);

// Device history management functions
function addDeviceToHistory(
  deviceId: string,
  name: string,
  ip: string,
  port: number = 5555,
  autoConnect: boolean = false
): void {
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
  });

  // Keep only last 20 devices
  if (settings.deviceHistory.length > 20) {
    settings.deviceHistory = settings.deviceHistory.slice(0, 20);
  }

  // Save to file
  const settingsPath = path.join(app.getPath("userData"), "settings.json");
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

function removeDeviceFromHistory(deviceId: string): void {
  settings.deviceHistory = settings.deviceHistory.filter(
    (d) => d.id !== deviceId
  );

  // Save to file
  const settingsPath = path.join(app.getPath("userData"), "settings.json");
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

function updateDeviceAutoConnect(deviceId: string, autoConnect: boolean): void {
  const device = settings.deviceHistory.find((d) => d.id === deviceId);
  if (device) {
    device.autoConnect = autoConnect;

    // Save to file
    const settingsPath = path.join(app.getPath("userData"), "settings.json");
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
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
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
);

// Auto-connect to saved devices on startup
async function autoConnectSavedDevices(): Promise<void> {
  const autoConnectDevices = settings.deviceHistory.filter(
    (d) => d.autoConnect
  );

  for (const device of autoConnectDevices) {
    if (mainWindow) {
      logger.info(`Auto-connecting to saved device: ${device.id}`);
      await connectWifiDevice(device.id);
    }
  }
}

// Quick action handlers

// Start recording
ipcMain.handle(
  "start-recording",
  async (
    _,
    deviceId: string
  ): Promise<{ success: boolean; error?: string }> => {
    logger.info(`Starting recording for device: ${deviceId}`);

    // Stop current scrcpy process quickly
    const proc = deviceProcesses.get(deviceId);
    if (proc && !TEST_MODE) {
      if (proc.pid) {
        logger.info(`Stopping scrcpy process PID: ${proc.pid}`);
        // Send stdin quit first
        const procAny = proc.proc as {
          stdin?: { write: (data: string) => void; destroyed: boolean };
        };
        if (procAny.stdin && !procAny.stdin.destroyed) {
          try {
            procAny.stdin.write("q\n");
          } catch (e) {}
        }
        // Try taskkill
        try {
          execSync(`taskkill /PID ${proc.pid}`, { encoding: "utf8" });
        } catch (e) {}
        // Quick wait
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Force kill if still running
        try {
          execSync(`tasklist /FI "PID eq ${proc.pid}"`, { encoding: "utf8" });
          exec(`taskkill /PID ${proc.pid} /F /T`);
        } catch (e) {}
      }
    }
    deviceProcesses.delete(deviceId);

    // Update settings to enable recording
    settings.display.record = true;

    // Restart scrcpy with recording
    const isWifi = deviceId.includes(":");
    if (isWifi) {
      logger.info(`Device is WiFi, connecting first...`);
      const connResult = await connectWifiDevice(deviceId);
      if (!connResult.success) {
        logger.error(`Failed to connect to WiFi device: ${connResult.error}`);
        return { success: false, error: connResult.error };
      }
    }

    const args = ["-s", deviceId];
    const { display, encoding, server } = settings;

    if (display.maxSize && typeof display.maxSize === "number")
      args.push("--max-size", String(display.maxSize));
    if (display.videoBitrate && typeof display.videoBitrate === "number")
      args.push("--video-bit-rate", `${display.videoBitrate}M`);
    if (display.frameRate && typeof display.frameRate === "number")
      args.push("--max-fps", String(display.frameRate));
    if (display.alwaysOnTop) args.push("--always-on-top");
    if (display.fullscreen) args.push("--fullscreen");
    if (display.stayAwake) args.push("--stay-awake");
    if (!display.enableVideo) args.push("--no-video");
    if (!display.enableAudio) args.push("--no-audio");

    // Recording options
    args.push("--record");
    const recordPath = resolveRecordPath(display.recordPath, deviceId);
    args.push(recordPath);
    logger.info(`Recording path: ${recordPath}`);
    // Note: --record-audio requires scrcpy 1.17+ with audio support
    if (display.recordAudio) args.push("--record-audio");

    if (encoding.videoCodec && encoding.videoCodec !== "h264") {
      args.push("--video-codec", encoding.videoCodec);
    }
    if (encoding.audioCodec && encoding.audioCodec !== "opus") {
      args.push("--audio-codec", encoding.audioCodec);
    }

    if (server.tunnelMode === "forward") args.push("--tunnel-forward");
    if (server.cleanup === false) args.push("--no-cleanup");

    if (TEST_MODE) {
      connectedDevices.add(deviceId);
      return { success: true };
    }

    const currentScrcpyPath = getScrcpyPath();
    const currentAdbPath = getAdbPath();
    logger.info(
      `Scrcpy path: ${currentScrcpyPath}, ADB path: ${currentAdbPath}`
    );
    logger.info(`Scrcpy args: ${args.join(" ")}`);

    if (!existsSync(currentScrcpyPath)) {
      logger.error(`Scrcpy not found at: ${currentScrcpyPath}`);
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
    logger.info(`Scrcpy process spawned with PID: ${scrcpyPid}`);

    if (!scrcpyPid) {
      logger.error(`Failed to get PID for recording scrcpy process`);
      return { success: false, error: "Failed to start scrcpy process" };
    }

    deviceProcesses.set(deviceId, { pid: scrcpyPid, proc: newProc });
    connectedDevices.add(deviceId);

    // Capture stdout/stderr for debugging
    newProc.stdout?.on("data", (data: Buffer) => {
      logger.debug(`[SCRCPY STDOUT ${deviceId}]: ${data.toString().trim()}`);
    });
    newProc.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      logger.debug(`[SCRCPY STDERR ${deviceId}]: ${msg}`);
      // Log FFmpeg warnings that might indicate recording issues
      if (msg.includes("Warning") || msg.includes("Error")) {
        logger.warn(`[SCRCPY ${deviceId}]: ${msg}`);
      }
      // Check for recording started message
      if (msg.includes("Recording started")) {
        logger.info(`[SCRCPY ${deviceId}] Recording started successfully`);
      }
    });

    // Notify renderer that scrcpy has started (for recording)
    if (mainWindow) {
      mainWindow.webContents.send("scrcpy-started", deviceId);
    }

    const notifyScrcpyExit = (code: any) => {
      logger.info(`Scrcpy exited for ${deviceId} with code: ${code}`);
      deviceProcesses.delete(deviceId);
      connectedDevices.delete(deviceId);
      if (mainWindow) {
        mainWindow.webContents.send("scrcpy-exit", deviceId);
      }
    };

    newProc.on("error", (err: any) => {
      logger.error(`Scrcpy error for ${deviceId}:`, err);
      notifyScrcpyExit(1);
    });
    newProc.on("close", (code: any) => {
      logger.info(`Scrcpy close for ${deviceId}: code ${code}`);
      notifyScrcpyExit(code);
    });

    return { success: true };
  }
);

// Helper function to send CTRL+C to a process group on Windows
// This is more reliable than taskkill for gracefully stopping scrcpy
async function sendCtrlC(pid: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // On Windows, we create a process group and send CTRL+C to it
      // This requires CREATE_NEW_PROCESS_GROUP flag when spawning
      // Since we didn't use that flag, we'll try an alternative approach

      // Try using taskkill with /T (terminate tree) first without /F (force)
      // This tries to gracefully terminate the process
      exec(
        `taskkill /PID ${pid} /T`,
        { encoding: "utf8" },
        (err, stdout, stderr) => {
          if (err) {
            // If graceful termination fails, try force kill
            logger.debug(`Graceful taskkill failed, trying force kill`);
            resolve(false);
          } else {
            logger.debug(`Graceful taskkill sent to PID ${pid}`);
            resolve(true);
          }
        }
      );
    } catch (e) {
      logger.debug(`Failed to send CTRL+C to PID ${pid}: ${e}`);
      resolve(false);
    }
  });
}

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
          } catch (e) {}
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
      }, 10000); // 10 second timeout per strategy

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
          } catch (e) {
            logger.warn(`Failed to replace file: ${e}`);
            // Keep the fixed file with different name
            try {
              renameSync(
                fixedPath,
                filePath.replace(/\.mp4$/i, "_repaired.mp4")
              );
            } catch (e2) {}
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

      repairProc.on("error", (err: Error) => {
        clearTimeout(timeout);
        logger.warn(
          `Repair strategy ${currentStrategy + 1} error: ${err.message}`
        );
        currentStrategy++;
        tryNextStrategy();
      });
    };

    tryNextStrategy();
  });
}

// Stop recording - optimized version with fast file handling
ipcMain.handle(
  "stop-recording",
  async (
    _,
    deviceId: string
  ): Promise<{ success: boolean; error?: string }> => {
    logger.info(`Stopping recording for device: ${deviceId}`);

    // Stop current scrcpy process
    const proc = deviceProcesses.get(deviceId);
    const recordPath = resolveRecordPath(settings.display.recordPath, deviceId);
    let recordingSaved = false;

    if (proc && !TEST_MODE) {
      if (proc.pid) {
        logger.info(`Stopping recording scrcpy process PID: ${proc.pid}`);

        // Try to send quit command via stdin
        const procAny = proc.proc as {
          stdin?: { write: (data: string) => void; destroyed: boolean };
        };
        if (procAny.stdin && !procAny.stdin.destroyed) {
          try {
            procAny.stdin.write("q\n");
            logger.info(`Sent 'q' command to scrcpy stdin`);
          } catch (e) {
            logger.debug(`Failed to write to stdin: ${e}`);
          }
        }

        // Wait briefly for graceful shutdown
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Check if process exited gracefully
        try {
          execSync(`tasklist /FI "PID eq ${proc.pid}"`, { encoding: "utf8" });
          // Process still running, try taskkill
          logger.info(`Process still running, sending taskkill`);
          try {
            execSync(`taskkill /PID ${proc.pid}`, { encoding: "utf8" });
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (e) {
            logger.debug(`Taskkill failed: ${e}`);
          }
        } catch (e) {
          logger.info(`Process exited gracefully`);
          recordingSaved = true;
        }

        // Force kill if still running
        if (!recordingSaved) {
          try {
            execSync(`tasklist /FI "PID eq ${proc.pid}"`, { encoding: "utf8" });
            logger.warn(`Force killing PID: ${proc.pid}`);
            exec(`taskkill /PID ${proc.pid} /F /T`);
            await new Promise((resolve) => setTimeout(resolve, 300));
          } catch (e) {
            recordingSaved = true;
            logger.info(`Process terminated`);
          }
        }

        // Quick file check - only repair if file is clearly corrupted
        if (existsSync(recordPath)) {
          const stats = statSync(recordPath);
          const fileSize = stats.size;
          logger.info(`Recording file: ${fileSize} bytes`);

          // Only repair very small files (<5KB = definitely corrupted)
          if (fileSize < 5000) {
            logger.info(`File too small, attempting repair`);
            await repairRecordingFile(recordPath);
          } else {
            logger.info(`Recording saved successfully`);
          }
        }
      }
    }
    deviceProcesses.delete(deviceId);
    connectedDevices.delete(deviceId);

    // Update settings to disable recording
    settings.display.record = false;

    // Restart scrcpy without recording to continue mirroring
    const isWifi = deviceId.includes(":");
    if (isWifi) {
      await connectWifiDevice(deviceId);
    }

    const args = ["-s", deviceId];
    const { display, encoding, server } = settings;

    if (display.maxSize && typeof display.maxSize === "number")
      args.push("--max-size", String(display.maxSize));
    if (display.videoBitrate && typeof display.videoBitrate === "number")
      args.push("--video-bit-rate", `${display.videoBitrate}M`);
    if (display.frameRate && typeof display.frameRate === "number")
      args.push("--max-fps", String(display.frameRate));
    if (display.alwaysOnTop) args.push("--always-on-top");
    if (display.fullscreen) args.push("--fullscreen");
    if (display.stayAwake) args.push("--stay-awake");
    if (!display.enableVideo) args.push("--no-video");
    if (!display.enableAudio) args.push("--no-audio");

    if (encoding.videoCodec && encoding.videoCodec !== "h264") {
      args.push("--video-codec", encoding.videoCodec);
    }
    if (encoding.audioCodec && encoding.audioCodec !== "opus") {
      args.push("--audio-codec", encoding.audioCodec);
    }

    if (server.tunnelMode === "forward") args.push("--tunnel-forward");
    if (server.cleanup === false) args.push("--no-cleanup");

    if (TEST_MODE) {
      return { success: true };
    }

    const currentScrcpyPath = getScrcpyPath();
    const currentAdbPath = getAdbPath();
    logger.info(`Stop recording - Scrcpy path: ${currentScrcpyPath}`);
    logger.info(`Stop recording - Args: ${args.join(" ")}`);

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
    logger.info(`Stop recording - Scrcpy restarted with PID: ${scrcpyPid}`);

    if (!scrcpyPid) {
      logger.error(`Failed to get PID for restart recording scrcpy process`);
      return { success: false, error: "Failed to start scrcpy process" };
    }

    deviceProcesses.set(deviceId, { pid: scrcpyPid, proc: newProc });
    connectedDevices.add(deviceId);

    // Capture stdout/stderr for debugging
    newProc.stdout?.on("data", (data: Buffer) => {
      logger.debug(`[SCRCPY STDOUT ${deviceId}]: ${data.toString().trim()}`);
    });
    newProc.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      logger.debug(`[SCRCPY STDERR ${deviceId}]: ${msg}`);
      if (msg.includes("Recording complete")) {
        logger.info(`[SCRCPY ${deviceId}] Recording completed successfully`);
      }
    });

    // Notify renderer that scrcpy has restarted
    if (mainWindow) {
      mainWindow.webContents.send("scrcpy-started", deviceId);
    }

    const notifyScrcpyExit = (code: any) => {
      logger.info(`Scrcpy exited for ${deviceId} with code: ${code}`);
      deviceProcesses.delete(deviceId);
      connectedDevices.delete(deviceId);
      if (mainWindow) {
        mainWindow.webContents.send("scrcpy-exit", deviceId);
      }
    };

    newProc.on("error", (err: any) => {
      logger.error(`Scrcpy error for ${deviceId}:`, err);
      notifyScrcpyExit(1);
    });
    newProc.on("close", (code: any) => {
      logger.info(`Scrcpy close for ${deviceId}: code ${code}`);
      notifyScrcpyExit(code);
    });

    return { success: true };
  }
);

// Toggle audio
ipcMain.handle(
  "toggle-audio",
  async (
    _,
    deviceId: string,
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    logger.info(`Toggling audio for device ${deviceId} to: ${enabled}`);

    // For audio toggle, we need to restart scrcpy
    const proc = deviceProcesses.get(deviceId);
    if (proc && !TEST_MODE) {
      if (proc.pid) {
        logger.info(`Killing existing scrcpy process PID: ${proc.pid}`);
        // Method 1: Try Node.js SIGINT first
        try {
          proc.proc?.kill("SIGINT");
          logger.info(`Sent SIGINT to PID ${proc.pid}`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (e) {
          logger.debug(`SIGINT failed, trying taskkill: ${e}`);
          // Method 2: Try graceful taskkill
          try {
            execSync(`taskkill /PID ${proc.pid} /T`, { encoding: "utf8" });
            await new Promise((resolve) => setTimeout(resolve, 1500));
          } catch (e2) {
            // Method 3: Force kill
            try {
              exec(`taskkill /PID ${proc.pid} /F /T`);
            } catch (e3) {
              logger.warn(`Failed to kill scrcpy process: ${e3}`);
            }
          }
        }
      }
    }
    deviceProcesses.delete(deviceId);

    // Update settings
    settings.display.enableAudio = enabled;

    // Restart scrcpy
    const isWifi = deviceId.includes(":");
    if (isWifi) {
      await connectWifiDevice(deviceId);
    }

    const args = ["-s", deviceId];
    const { display, encoding, server } = settings;

    if (display.maxSize && typeof display.maxSize === "number")
      args.push("--max-size", String(display.maxSize));
    if (display.videoBitrate && typeof display.videoBitrate === "number")
      args.push("--video-bit-rate", `${display.videoBitrate}M`);
    if (display.frameRate && typeof display.frameRate === "number")
      args.push("--max-fps", String(display.frameRate));
    if (display.alwaysOnTop) args.push("--always-on-top");
    if (display.fullscreen) args.push("--fullscreen");
    if (display.stayAwake) args.push("--stay-awake");
    if (display.windowBorderless) args.push("--window-borderless");
    if (display.disableScreensaver) args.push("--disable-screensaver");
    if (!display.enableVideo) args.push("--no-video");
    if (!display.enableAudio) args.push("--no-audio");

    if (display.record) {
      args.push("--record");
      args.push(resolveRecordPath(display.recordPath, deviceId));
    }
    if (display.recordTimeLimit > 0) {
      args.push("--time-limit", String(display.recordTimeLimit));
    }
    if (display.recordAudio) args.push("--record-audio");

    if (encoding.videoCodec && encoding.videoCodec !== "h264") {
      args.push("--video-codec", encoding.videoCodec);
    }
    if (encoding.audioCodec && encoding.audioCodec !== "opus") {
      args.push("--audio-codec", encoding.audioCodec);
    }

    if (server.tunnelMode === "forward") args.push("--tunnel-forward");
    if (server.cleanup === false) args.push("--no-cleanup");

    if (TEST_MODE) {
      connectedDevices.add(deviceId);
      return { success: true };
    }

    const currentScrcpyPath = getScrcpyPath();
    const currentAdbPath = getAdbPath();
    logger.info(
      `Audio toggle - Scrcpy path: ${currentScrcpyPath}, ADB path: ${currentAdbPath}`
    );
    logger.info(`Audio toggle - Args: ${args.join(" ")}`);

    if (!existsSync(currentScrcpyPath)) {
      logger.error(`Scrcpy not found at: ${currentScrcpyPath}`);
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
    logger.info(`Audio toggle - Scrcpy process spawned with PID: ${scrcpyPid}`);

    if (!scrcpyPid) {
      logger.error(`Failed to get PID for audio toggle scrcpy process`);
      return { success: false, error: "Failed to start scrcpy process" };
    }

    deviceProcesses.set(deviceId, { pid: scrcpyPid, proc: newProc });
    connectedDevices.add(deviceId);

    // Capture stdout/stderr for debugging
    newProc.stdout?.on("data", (data: Buffer) => {
      logger.debug(`[SCRCPY STDOUT ${deviceId}]: ${data.toString().trim()}`);
    });
    newProc.stderr?.on("data", (data: Buffer) => {
      logger.debug(`[SCRCPY STDERR ${deviceId}]: ${data.toString().trim()}`);
    });

    // Notify renderer that scrcpy has started (for audio toggle)
    if (mainWindow) {
      mainWindow.webContents.send("scrcpy-started", deviceId);
    }

    const notifyScrcpyExit = (code: any) => {
      logger.info(`Scrcpy exited for ${deviceId} with code: ${code}`);
      deviceProcesses.delete(deviceId);
      connectedDevices.delete(deviceId);
      if (mainWindow) {
        mainWindow.webContents.send("scrcpy-exit", deviceId);
      }
    };

    newProc.on("error", (err: any) => {
      logger.error(`Scrcpy error for ${deviceId}:`, err);
      notifyScrcpyExit(1);
    });
    newProc.on("close", (code: any) => {
      logger.info(`Scrcpy close for ${deviceId}: code ${code}`);
      notifyScrcpyExit(code);
    });

    return { success: true };
  }
);

// Toggle camera
ipcMain.handle(
  "toggle-camera",
  async (
    _,
    deviceId: string,
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    logger.info(`Toggling camera for device ${deviceId} to: ${enabled}`);

    // Stop current scrcpy process
    const proc = deviceProcesses.get(deviceId);
    if (proc && !TEST_MODE) {
      if (proc.pid) {
        try {
          exec(`taskkill /PID ${proc.pid} /F /T`);
        } catch (e) {
          try {
            proc.proc?.kill();
          } catch (e2) {}
        }
      }
    }
    deviceProcesses.delete(deviceId);

    // Update settings
    settings.display.camera = enabled;

    // Restart scrcpy
    const isWifi = deviceId.includes(":");
    if (isWifi) {
      await connectWifiDevice(deviceId);
    }

    const args = ["-s", deviceId];
    const { display, encoding, server } = settings;

    if (display.maxSize && typeof display.maxSize === "number")
      args.push("--max-size", String(display.maxSize));
    if (display.videoBitrate && typeof display.videoBitrate === "number")
      args.push("--video-bit-rate", `${display.videoBitrate}M`);
    if (display.frameRate && typeof display.frameRate === "number")
      args.push("--max-fps", String(display.frameRate));
    if (display.alwaysOnTop) args.push("--always-on-top");
    if (display.fullscreen) args.push("--fullscreen");
    if (display.stayAwake) args.push("--stay-awake");
    if (!display.enableVideo) args.push("--no-video");
    if (!display.enableAudio) args.push("--no-audio");

    if (display.record) {
      args.push("--record");
      args.push(resolveRecordPath(display.recordPath, deviceId));
    }
    if (display.recordAudio) args.push("--record-audio");

    // Camera options
    if (display.camera) {
      if (display.cameraId) args.push("--camera-id", display.cameraId);
      args.push("--camera-size", display.cameraSize);
      if (display.cameraFps !== 30)
        args.push("--camera-fps", String(display.cameraFps));
    }

    if (encoding.videoCodec && encoding.videoCodec !== "h264") {
      args.push("--video-codec", encoding.videoCodec);
    }
    if (encoding.audioCodec && encoding.audioCodec !== "opus") {
      args.push("--audio-codec", encoding.audioCodec);
    }

    if (server.tunnelMode === "forward") args.push("--tunnel-forward");
    if (server.cleanup === false) args.push("--no-cleanup");

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
      logger.error(`Failed to get PID for camera toggle scrcpy process`);
      return { success: false, error: "Failed to start scrcpy process" };
    }

    deviceProcesses.set(deviceId, { pid: scrcpyPid, proc: newProc });
    connectedDevices.add(deviceId);

    const notifyScrcpyExit = () => {
      deviceProcesses.delete(deviceId);
      connectedDevices.delete(deviceId);
      if (mainWindow) {
        mainWindow.webContents.send("scrcpy-exit", deviceId);
      }
    };

    newProc.on("error", notifyScrcpyExit);
    newProc.on("close", notifyScrcpyExit);

    return { success: true };
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

    const { display, server } = settings;

    // Build camera args - use video-source=camera
    const args = ["-s", deviceId, "--video-source=camera"];

    // Camera options
    if (display.cameraId) {
      args.push("--camera-id", display.cameraId);
    } else {
      // Auto-select first camera
      args.push("--camera-facing=back");
    }
    args.push("--camera-size", display.cameraSize);
    if (display.cameraFps !== 30) {
      args.push("--camera-fps", String(display.cameraFps));
    }

    if (server.tunnelMode === "forward") args.push("--tunnel-forward");
    if (server.cleanup === false) args.push("--no-cleanup");

    const currentScrcpyPath = getScrcpyPath();
    const currentAdbPath = getAdbPath();

    if (!existsSync(currentScrcpyPath)) {
      return {
        success: false,
        error: `Scrcpy not found at: ${currentScrcpyPath}`,
      };
    }

    logger.info(`Starting camera with args: ${args.join(" ")}`);

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

    const proc = cameraProcesses.get(deviceId);
    if (proc) {
      if (proc.pid) {
        try {
          exec(`taskkill /PID ${proc.pid} /F /T`);
        } catch (e) {
          try {
            proc.proc?.kill();
          } catch (e2) {}
        }
      }
      cameraProcesses.delete(deviceId);
    }

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
  } catch (error) {
    logger.error("Failed to get log stats:", error);
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
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
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
  } catch (error) {
    logger.error("Failed to clear logs:", error);
    return { success: false, count: 0, error: String(error) };
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

// Helper function to save settings to file
function saveSettingsToFile(): void {
  const settingsPath = path.join(app.getPath("userData"), "settings.json");
  writeFileSync(settingsPath, JSON.stringify({
    ...settings,
    logLevel: logger.getLevel()
  }, null, 2));
}

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
  const settingsPath = app.isPackaged
    ? path.join(process.resourcesPath, "settings.json")
    : path.join(process.cwd(), "settings.json");
  
  let lang = "en-US";
  if (existsSync(settingsPath)) {
    try {
      const data = JSON.parse(readFileSync(settingsPath, "utf-8"));
      if (data.language && translations[data.language]) {
        lang = data.language;
      }
    } catch (e) {
      // Use default
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
      .catch(() => updateTray(lang));
  } else {
    updateTray(lang);
  }
});

// Update tray menu with current language
function updateTray(lang: string): void {
  if (!tray) return;
  
  logger.debug("updateTray called", { lang, availableKeys: Object.keys(trayTranslations) });
  
  const translations = trayTranslations[lang] || trayTranslations["en-US"];
  
  if (!translations) {
    logger.warn("No translations found for lang:", lang);
    return;
  }
  
  logger.debug("Using translations:", translations);
  
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
      click: () => {
        if (mainWindow) {
          mainWindow.destroy();
        }
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(translations.tooltip);
  logger.debug("Tray updated for language:", lang);
}

// Initialize system tray
function initTray(): void {
  // Create tray icon
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "build", "icon.png")
    : path.join(process.cwd(), "build", "icon.png");

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
      click: () => {
        if (mainWindow) {
          mainWindow.destroy();
        }
        app.quit();
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

app.whenReady().then(() => {
  logger.info("App is ready, loading settings and creating window");

  // Initialize system tray
  if (!TEST_MODE) {
    initTray();
  }

  loadSettings();
  createWindow();
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
        downloadPath: path.join(app.getPath("downloads"), "iScrcpy-Setup-1.1.0.exe"),
      };
    }

    try {
      logger.info(`Downloading update from ${downloadUrl}`);

      const downloadsPath = app.getPath("downloads");
      const fileName = downloadUrl.split("/").pop() || "iScrcpy-Setup.exe";
      const downloadPath = path.join(downloadsPath, fileName);

      // Get a valid window for download
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0] || mainWindow;
      if (!win) {
        throw new Error("No window available for download");
      }

      // Use electron-dl for better download handling with progress
      await download(win, downloadUrl, {
        directory: downloadsPath,
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

      // Open the installer - user needs to manually install
      await shell.openPath(installerPath);

      // Quit the app so the installer can proceed
      logger.info("Quitting app to allow installer to run");
      app.quit();

      return { success: true };
    } catch (error: any) {
      logger.error("Failed to install update", { error: error.message });
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
