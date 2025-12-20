"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Device management
  adbDevices: () => electron.ipcRenderer.invoke("adb-devices"),
  connectWifi: (deviceId) => electron.ipcRenderer.invoke("connect-wifi", deviceId),
  connectDevice: (deviceId) => electron.ipcRenderer.invoke("connect-device", deviceId),
  disconnectDevice: (deviceId) => electron.ipcRenderer.invoke("disconnect-device", deviceId),
  // Settings
  saveSettings: (type, settings) => electron.ipcRenderer.invoke("save-settings", type, settings),
  loadSettings: () => electron.ipcRenderer.invoke("load-settings"),
  // Version info
  getVersion: () => electron.ipcRenderer.invoke("get-version"),
  getAdbVersion: () => electron.ipcRenderer.invoke("get-adb-version"),
  // Window controls
  windowMinimize: () => electron.ipcRenderer.invoke("window-minimize"),
  windowMaximize: () => electron.ipcRenderer.invoke("window-maximize"),
  windowClose: () => electron.ipcRenderer.invoke("window-close"),
  // File operations
  openFolder: (path) => electron.ipcRenderer.invoke("open-folder", path)
});
