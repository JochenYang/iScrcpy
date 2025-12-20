import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "path";
import { spawn, exec, ChildProcess } from "child_process";
import { logger } from "./logger";

// Test mode flag
const TEST_MODE = process.env.TEST === "1";

// Paths
const SCRCPY_PATH = app.isPackaged
  ? join(process.resourcesPath, "app", "scrcpy.exe")
  : join(process.cwd(), "app", "scrcpy.exe");
const ADB_PATH = app.isPackaged
  ? join(process.resourcesPath, "app", "adb.exe")
  : join(process.cwd(), "app", "adb.exe");

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
  videoBitrate: number;
  frameRate: number;
  alwaysOnTop: boolean;
  fullscreen: boolean;
  stayAwake: boolean;
}

interface EncodingSettings {
  videoCodec: string;
  audioCodec: string;
  bitrateMode: string;
}

interface ServerSettings {
  tunnelMode: string;
  cleanup: boolean;
}

interface Settings {
  display: DisplaySettings;
  encoding: EncodingSettings;
  server: ServerSettings;
}

interface DeviceInfo {
  id: string;
  name: string;
  type: "usb" | "wifi";
  status: string;
}

// State
let mainWindow: BrowserWindow | null = null;
const deviceProcesses = new Map<string, ChildProcess>();
const connectedDevices = new Set<string>();

// Default settings
const settings: Settings = {
  display: {
    maxSize: 1080,
    videoBitrate: 8,
    frameRate: 60,
    alwaysOnTop: false,
    fullscreen: false,
    stayAwake: false,
  },
  encoding: {
    videoCodec: "h264",
    audioCodec: "opus",
    bitrateMode: "vbr",
  },
  server: {
    tunnelMode: "reverse",
    cleanup: true,
  },
};

// Load settings from file
function loadSettings(): void {
  const fs = require("fs");
  const settingsPath = join(__dirname, "..", "settings.json");
  if (fs.existsSync(settingsPath)) {
    try {
      const saved = JSON.parse(
        fs.readFileSync(settingsPath, "utf8")
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
      `"${SCRCPY_PATH}" --version`,
      { encoding: "utf8" },
      (error, stdout) => {
        if (error) {
          resolve({ success: false, error: error.message });
          return;
        }
        const match = stdout.match(/scrcpy v(\S+)/);
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
    exec(`"${ADB_PATH}" version`, { encoding: "utf8" }, (error, stdout) => {
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
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    frame: false,
    show: false,
    backgroundColor: "#0F0F14",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "../preload/preload.cjs"),
    },
  });

  // Load the app - use dev server URL in development, file in production
  if (process.env.NODE_ENV === "development" || !app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    // Cleanup all processes
    Array.from(deviceProcesses.entries()).forEach(([, proc]) => {
      if (proc.pid) {
        try {
          process.kill(-proc.pid);
        } catch (e) {
          try {
            proc.kill();
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

    logger.info("Fetching device list...");
    return new Promise((resolve) => {
      // 使用 chcp 65001 设置 UTF-8 编码，避免中文乱码
      exec(
        `chcp 65001 >nul && "${ADB_PATH}" devices -l`,
        { encoding: "utf8" },
        (error, stdout, stderr) => {
          if (error) {
            logger.error("Failed to get devices", { error, stderr });
            resolve({ success: false, error: error.message });
            return;
          }

          logger.debug("ADB devices output", { stdout });
          const devices = parseDeviceList(stdout);
          logger.info(`Found ${devices.length} device(s)`, { devices });
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
      // First, enable TCP/IP mode on port 5555
      exec(
        `chcp 65001 >nul && "${ADB_PATH}" -s ${deviceId} tcpip 5555`,
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

          // Get device IP address
          exec(
            `chcp 65001 >nul && "${ADB_PATH}" -s ${deviceId} shell ip route`,
            { encoding: "utf8" },
            (error2, stdout2, stderr2) => {
              if (error2) {
                logger.warn(
                  `TCP/IP enabled but failed to get IP for ${deviceId}`,
                  { error2, stderr2 }
                );
                resolve({
                  success: true,
                  error:
                    "TCP/IP 模式已启用，但无法获取 IP 地址。请手动输入设备 IP。",
                });
                return;
              }

              logger.debug(`IP route output for ${deviceId}`, { stdout2 });

              // Parse IP address from output
              const match = stdout2.match(/src\s+(\d+\.\d+\.\d+\.\d+)/);
              if (match) {
                const ip = match[1];
                logger.info(`Got IP address for ${deviceId}: ${ip}`);
                resolve({ success: true, ip });
              } else {
                logger.warn(`Could not parse IP from output for ${deviceId}`, {
                  stdout2,
                });
                resolve({
                  success: true,
                  error:
                    "TCP/IP 模式已启用，但无法解析 IP 地址。请手动输入设备 IP。",
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
      `chcp 65001 >nul && "${ADB_PATH}" connect ${deviceId}`,
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
          resolve({ success: false, error: stdout.trim() });
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

    // Build scrcpy args
    const args = ["-s", deviceId];
    const { display, encoding, server } = settings;

    if (display.maxSize) args.push(`--max-size=${display.maxSize}`);
    if (display.videoBitrate)
      args.push(`--video-bitrate=${display.videoBitrate}M`);
    if (display.frameRate) args.push(`--frame-rate=${display.frameRate}`);
    if (display.alwaysOnTop) args.push("--always-on-top");
    if (display.fullscreen) args.push("--fullscreen");
    if (display.stayAwake) args.push("--stay-awake");

    if (encoding.videoCodec) args.push(`--video-codec=${encoding.videoCodec}`);
    if (encoding.audioCodec) args.push(`--audio-codec=${encoding.audioCodec}`);

    if (server.tunnelMode === "forward") args.push("--tunnel-forward");
    if (server.cleanup === false) args.push("--no-cleanup");

    logger.info(`Starting scrcpy with args:`, { args });

    // Test mode - just log
    if (TEST_MODE) {
      console.log("Starting scrcpy with args:", args);
      connectedDevices.add(deviceId);
      return { success: true, deviceId };
    }

    // Spawn scrcpy
    const proc = spawn(SCRCPY_PATH, args, {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });

    proc.unref();
    proc.on("error", (err) => {
      logger.error(`Scrcpy error for ${deviceId}`, err);
      deviceProcesses.delete(deviceId);
      connectedDevices.delete(deviceId);
    });

    proc.on("exit", (code) => {
      logger.info(`Scrcpy exited for ${deviceId}`, { code });
      deviceProcesses.delete(deviceId);
      connectedDevices.delete(deviceId);
    });

    deviceProcesses.set(deviceId, proc);
    connectedDevices.add(deviceId);
    logger.info(`Scrcpy started successfully for ${deviceId}`);
    return { success: true, deviceId };
  }
);

// Disconnect device
ipcMain.handle(
  "disconnect-device",
  async (_, deviceId: string): Promise<{ success: boolean }> => {
    logger.info(`Disconnecting device: ${deviceId}`);

    // Kill scrcpy process
    const proc = deviceProcesses.get(deviceId);
    if (proc && !TEST_MODE) {
      if (proc.pid) {
        try {
          process.kill(-proc.pid);
          logger.debug(`Killed scrcpy process for ${deviceId}`);
        } catch (e) {
          try {
            proc.kill();
            logger.debug(`Killed scrcpy process (fallback) for ${deviceId}`);
          } catch (e2) {
            logger.warn(`Failed to kill scrcpy process for ${deviceId}`, e2);
          }
        }
      }
    }
    deviceProcesses.delete(deviceId);
    connectedDevices.delete(deviceId);

    if (TEST_MODE) {
      return { success: true };
    }

    return new Promise((resolve) => {
      exec(
        `chcp 65001 >nul && "${ADB_PATH}" disconnect ${deviceId}`,
        { encoding: "utf8" },
        (error, stdout, stderr) => {
          if (error) {
            logger.error(`Failed to disconnect ${deviceId}`, { error, stderr });
          } else {
            logger.info(`Disconnected ${deviceId}`, { stdout });
          }
          resolve({ success: !error });
        }
      );
    });
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
    }

    const fs = require("fs");
    const settingsPath = join(__dirname, "..", "settings.json");
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    return { success: true };
  }
);

// Load settings
ipcMain.handle("load-settings", async (): Promise<Settings> => {
  return settings;
});

// Version info
ipcMain.handle("get-version", getScrcpyVersion);
ipcMain.handle("get-adb-version", getAdbVersion);

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
ipcMain.handle("open-folder", async (_, folderPath: string) => {
  const fs = require("fs");
  if (fs.existsSync(folderPath)) {
    shell.openPath(folderPath);
  }
});

// App lifecycle
app.whenReady().then(() => {
  logger.info("App is ready, loading settings and creating window");
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
