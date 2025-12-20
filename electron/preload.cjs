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

// electron/preload.ts
var import_electron = __toESM(require_electron(), 1);
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Device management
  adbDevices: () => import_electron.ipcRenderer.invoke("adb-devices"),
  connectWifi: (deviceId) => import_electron.ipcRenderer.invoke("connect-wifi", deviceId),
  connectDevice: (deviceId) => import_electron.ipcRenderer.invoke("connect-device", deviceId),
  disconnectDevice: (deviceId) => import_electron.ipcRenderer.invoke("disconnect-device", deviceId),
  // Settings
  saveSettings: (type, settings) => import_electron.ipcRenderer.invoke("save-settings", type, settings),
  loadSettings: () => import_electron.ipcRenderer.invoke("load-settings"),
  // Version info
  getVersion: () => import_electron.ipcRenderer.invoke("get-version"),
  getAdbVersion: () => import_electron.ipcRenderer.invoke("get-adb-version"),
  // Window controls
  windowMinimize: () => import_electron.ipcRenderer.invoke("window-minimize"),
  windowMaximize: () => import_electron.ipcRenderer.invoke("window-maximize"),
  windowClose: () => import_electron.ipcRenderer.invoke("window-close"),
  // File operations
  openFolder: (path) => import_electron.ipcRenderer.invoke("open-folder", path)
});
