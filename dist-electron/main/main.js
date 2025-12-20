import { ipcMain, shell, app, BrowserWindow } from "electron";
import { join } from "path";
import { exec, spawn } from "child_process";
import __cjs_url__ from "node:url";
import __cjs_path__ from "node:path";
import __cjs_mod__ from "node:module";
const __filename = __cjs_url__.fileURLToPath(import.meta.url);
const __dirname = __cjs_path__.dirname(__filename);
const require2 = __cjs_mod__.createRequire(import.meta.url);
const TEST_MODE = process.env.TEST === "1";
const SCRCPY_PATH = join(__dirname, "..", "app", "scrcpy.exe");
const ADB_PATH = join(__dirname, "..", "app", "adb.exe");
let mainWindow = null;
const deviceProcesses = /* @__PURE__ */ new Map();
const connectedDevices = /* @__PURE__ */ new Set();
const settings = {
  display: {
    maxSize: 1080,
    videoBitrate: 8,
    frameRate: 60,
    alwaysOnTop: false,
    fullscreen: false,
    stayAwake: false
  },
  encoding: {
    videoCodec: "h264",
    audioCodec: "opus",
    bitrateMode: "vbr"
  },
  server: {
    tunnelMode: "reverse",
    cleanup: true
  }
};
function loadSettings() {
  const fs = require2("fs");
  const settingsPath = join(__dirname, "..", "settings.json");
  if (fs.existsSync(settingsPath)) {
    try {
      const saved = JSON.parse(
        fs.readFileSync(settingsPath, "utf8")
      );
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
function parseDeviceList(output) {
  const devices = [];
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
        const modelMatch = line.match(/model:(\S+)/);
        const name = modelMatch ? modelMatch[1] : parts[2] || "Unknown Device";
        devices.push({
          id,
          name,
          type,
          status: connectedDevices.has(id) ? "connected" : status
        });
      }
    }
  }
  return devices;
}
function getScrcpyVersion() {
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
function getAdbVersion() {
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
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1e3,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    frame: false,
    show: false,
    backgroundColor: "#0F0F14",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "../preload/preload.cjs")
    }
  });
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
    Array.from(deviceProcesses.entries()).forEach(([, proc]) => {
      if (proc.pid) {
        try {
          process.kill(-proc.pid);
        } catch (e) {
          try {
            proc.kill();
          } catch (e2) {
          }
        }
      }
    });
    deviceProcesses.clear();
    connectedDevices.clear();
    mainWindow = null;
  });
}
ipcMain.handle(
  "adb-devices",
  async () => {
    if (TEST_MODE) {
      return {
        success: true,
        devices: [
          {
            id: "emulator-5554",
            name: "Android Emulator",
            type: "usb",
            status: connectedDevices.has("emulator-5554") ? "connected" : "disconnected"
          },
          {
            id: "192.168.1.100:5555",
            name: "Xiaomi 13 Pro",
            type: "wifi",
            status: connectedDevices.has("192.168.1.100:5555") ? "connected" : "disconnected"
          }
        ]
      };
    }
    return new Promise((resolve) => {
      exec(
        `"${ADB_PATH}" devices -l`,
        { encoding: "utf8" },
        (error, stdout) => {
          if (error) {
            resolve({ success: false, error: error.message });
            return;
          }
          resolve({ success: true, devices: parseDeviceList(stdout) });
        }
      );
    });
  }
);
ipcMain.handle(
  "connect-wifi",
  async (_, deviceId) => {
    return connectWifiDevice(deviceId);
  }
);
async function connectWifiDevice(deviceId) {
  return new Promise((resolve) => {
    if (TEST_MODE) {
      connectedDevices.add(deviceId);
      resolve({ success: true });
      return;
    }
    exec(
      `"${ADB_PATH}" connect ${deviceId}`,
      { encoding: "utf8" },
      (error, stdout) => {
        if (error) {
          resolve({ success: false, error: error.message });
          return;
        }
        if (stdout.includes("connected") || stdout.includes("already connected")) {
          connectedDevices.add(deviceId);
          resolve({ success: true });
        } else {
          resolve({ success: false, error: stdout.trim() });
        }
      }
    );
  });
}
ipcMain.handle(
  "connect-device",
  async (_, deviceId) => {
    const isWifi = deviceId.includes(":");
    if (isWifi) {
      const connResult = await connectWifiDevice(deviceId);
      if (!connResult.success) {
        return connResult;
      }
    }
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
    if (TEST_MODE) {
      console.log("Starting scrcpy with args:", args);
      connectedDevices.add(deviceId);
      return { success: true, deviceId };
    }
    const proc = spawn(SCRCPY_PATH, args, {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    });
    proc.unref();
    proc.on("error", (err) => {
      console.error("scrcpy error:", err);
      deviceProcesses.delete(deviceId);
      connectedDevices.delete(deviceId);
    });
    proc.on("exit", () => {
      deviceProcesses.delete(deviceId);
      connectedDevices.delete(deviceId);
    });
    deviceProcesses.set(deviceId, proc);
    connectedDevices.add(deviceId);
    return { success: true, deviceId };
  }
);
ipcMain.handle(
  "disconnect-device",
  async (_, deviceId) => {
    const proc = deviceProcesses.get(deviceId);
    if (proc && !TEST_MODE) {
      if (proc.pid) {
        try {
          process.kill(-proc.pid);
        } catch (e) {
          try {
            proc.kill();
          } catch (e2) {
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
        `"${ADB_PATH}" disconnect ${deviceId}`,
        { encoding: "utf8" },
        (error) => {
          resolve({ success: !error });
        }
      );
    });
  }
);
ipcMain.handle(
  "save-settings",
  async (_, type, newSettings) => {
    if (type === "display") {
      settings.display = {
        ...settings.display,
        ...newSettings
      };
    } else if (type === "encoding") {
      settings.encoding = {
        ...settings.encoding,
        ...newSettings
      };
    } else if (type === "server") {
      settings.server = {
        ...settings.server,
        ...newSettings
      };
    }
    const fs = require2("fs");
    const settingsPath = join(__dirname, "..", "settings.json");
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true };
  }
);
ipcMain.handle("load-settings", async () => {
  return settings;
});
ipcMain.handle("get-version", getScrcpyVersion);
ipcMain.handle("get-adb-version", getAdbVersion);
ipcMain.handle("window-minimize", () => mainWindow?.minimize());
ipcMain.handle("window-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle("window-close", () => mainWindow?.close());
ipcMain.handle("open-folder", async (_, folderPath) => {
  const fs = require2("fs");
  if (fs.existsSync(folderPath)) {
    shell.openPath(folderPath);
  }
});
app.whenReady().then(() => {
  loadSettings();
  createWindow();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
