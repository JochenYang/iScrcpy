"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/electron/index.js
var require_electron = __commonJS({
  "node_modules/electron/index.js"(exports2, module2) {
    var fs = require("fs");
    var path = require("path");
    var pathFile = path.join(__dirname, "path.txt");
    function getElectronPath() {
      let executablePath;
      if (fs.existsSync(pathFile)) {
        executablePath = fs.readFileSync(pathFile, "utf-8");
      }
      if (process.env.ELECTRON_OVERRIDE_DIST_PATH) {
        return path.join(process.env.ELECTRON_OVERRIDE_DIST_PATH, executablePath || "electron");
      }
      if (executablePath) {
        return path.join(__dirname, "dist", executablePath);
      } else {
        throw new Error("Electron failed to install correctly, please delete node_modules/electron and try installing again");
      }
    }
    module2.exports = getElectronPath();
  }
});

// electron/main.ts
var import_electron = __toESM(require_electron(), 1);
var import_path = require("path");
var import_child_process = require("child_process");
var TEST_MODE = process.env.TEST === "1";
var SCRCPY_PATH = (0, import_path.join)(__dirname, "..", "app", "scrcpy.exe");
var ADB_PATH = (0, import_path.join)(__dirname, "..", "app", "adb.exe");
var mainWindow = null;
var deviceProcesses = /* @__PURE__ */ new Map();
var connectedDevices = /* @__PURE__ */ new Set();
var settings = {
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
  const fs = require("fs");
  const settingsPath = (0, import_path.join)(__dirname, "..", "settings.json");
  if (fs.existsSync(settingsPath)) {
    try {
      const saved = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
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
    (0, import_child_process.exec)(`"${SCRCPY_PATH}" --version`, { encoding: "utf8" }, (error, stdout) => {
      if (error) {
        resolve({ success: false, error: error.message });
        return;
      }
      const match = stdout.match(/scrcpy v(\S+)/);
      resolve({ success: true, version: match ? match[1] : "unknown" });
    });
  });
}
function getAdbVersion() {
  return new Promise((resolve) => {
    if (TEST_MODE) {
      resolve({ success: true, version: "1.0.41-test" });
      return;
    }
    (0, import_child_process.exec)(`"${ADB_PATH}" version`, { encoding: "utf8" }, (error, stdout) => {
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
  mainWindow = new import_electron.BrowserWindow({
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
      preload: (0, import_path.join)(__dirname, "preload.cjs")
    }
  });
  if (process.env.NODE_ENV === "development" || !import_electron.app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile((0, import_path.join)(__dirname, "../dist/index.html"));
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
import_electron.ipcMain.handle("adb-devices", async () => {
  if (TEST_MODE) {
    return {
      success: true,
      devices: [
        { id: "emulator-5554", name: "Android Emulator", type: "usb", status: connectedDevices.has("emulator-5554") ? "connected" : "disconnected" },
        { id: "192.168.1.100:5555", name: "Xiaomi 13 Pro", type: "wifi", status: connectedDevices.has("192.168.1.100:5555") ? "connected" : "disconnected" }
      ]
    };
  }
  return new Promise((resolve) => {
    (0, import_child_process.exec)(`"${ADB_PATH}" devices -l`, { encoding: "utf8" }, (error, stdout) => {
      if (error) {
        resolve({ success: false, error: error.message });
        return;
      }
      resolve({ success: true, devices: parseDeviceList(stdout) });
    });
  });
});
import_electron.ipcMain.handle("connect-wifi", async (_, deviceId) => {
  return connectWifiDevice(deviceId);
});
async function connectWifiDevice(deviceId) {
  return new Promise((resolve) => {
    if (TEST_MODE) {
      connectedDevices.add(deviceId);
      resolve({ success: true });
      return;
    }
    (0, import_child_process.exec)(`"${ADB_PATH}" connect ${deviceId}`, { encoding: "utf8" }, (error, stdout) => {
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
    });
  });
}
import_electron.ipcMain.handle("connect-device", async (_, deviceId) => {
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
  if (display.videoBitrate) args.push(`--video-bitrate=${display.videoBitrate}M`);
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
  const proc = (0, import_child_process.spawn)(SCRCPY_PATH, args, {
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
});
import_electron.ipcMain.handle("disconnect-device", async (_, deviceId) => {
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
    (0, import_child_process.exec)(`"${ADB_PATH}" disconnect ${deviceId}`, { encoding: "utf8" }, (error) => {
      resolve({ success: !error });
    });
  });
});
import_electron.ipcMain.handle("save-settings", async (_, type, newSettings) => {
  if (type === "display") {
    settings.display = { ...settings.display, ...newSettings };
  } else if (type === "encoding") {
    settings.encoding = { ...settings.encoding, ...newSettings };
  } else if (type === "server") {
    settings.server = { ...settings.server, ...newSettings };
  }
  const fs = require("fs");
  const settingsPath = (0, import_path.join)(__dirname, "..", "settings.json");
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  return { success: true };
});
import_electron.ipcMain.handle("load-settings", async () => {
  return settings;
});
import_electron.ipcMain.handle("get-version", getScrcpyVersion);
import_electron.ipcMain.handle("get-adb-version", getAdbVersion);
import_electron.ipcMain.handle("window-minimize", () => mainWindow?.minimize());
import_electron.ipcMain.handle("window-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
import_electron.ipcMain.handle("window-close", () => mainWindow?.close());
import_electron.ipcMain.handle("open-folder", async (_, folderPath) => {
  const fs = require("fs");
  if (fs.existsSync(folderPath)) {
    import_electron.shell.openPath(folderPath);
  }
});
import_electron.app.whenReady().then(() => {
  loadSettings();
  createWindow();
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") import_electron.app.quit();
});
import_electron.app.on("activate", () => {
  if (import_electron.BrowserWindow.getAllWindows().length === 0) createWindow();
});
