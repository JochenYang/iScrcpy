import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  // Device management
  adbDevices: () => ipcRenderer.invoke("adb-devices"),
  connectWifi: (deviceId) => ipcRenderer.invoke("connect-wifi", deviceId),
  connectDevice: (deviceId) => ipcRenderer.invoke("connect-device", deviceId),
  disconnectDevice: (deviceId) => ipcRenderer.invoke("disconnect-device", deviceId),
  // Settings
  saveSettings: (type, settings) => ipcRenderer.invoke("save-settings", type, settings),
  loadSettings: () => ipcRenderer.invoke("load-settings"),
  // Version info
  getVersion: () => ipcRenderer.invoke("get-version"),
  getAdbVersion: () => ipcRenderer.invoke("get-adb-version"),
  // Window controls
  windowMinimize: () => ipcRenderer.invoke("window-minimize"),
  windowMaximize: () => ipcRenderer.invoke("window-maximize"),
  windowClose: () => ipcRenderer.invoke("window-close"),
  // File operations
  openFolder: (path) => ipcRenderer.invoke("open-folder", path)
});
