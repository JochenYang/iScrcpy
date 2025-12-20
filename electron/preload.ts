import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Device management
  adbDevices: () => ipcRenderer.invoke("adb-devices"),
  connectWifi: (deviceId: string) =>
    ipcRenderer.invoke("connect-wifi", deviceId),
  enableTcpip: (deviceId: string) =>
    ipcRenderer.invoke("enable-tcpip", deviceId),
  connectDevice: (deviceId: string) =>
    ipcRenderer.invoke("connect-device", deviceId),
  disconnectDevice: (deviceId: string) =>
    ipcRenderer.invoke("disconnect-device", deviceId),

  // Settings
  saveSettings: (type: string, settings: object) =>
    ipcRenderer.invoke("save-settings", type, settings),
  loadSettings: () => ipcRenderer.invoke("load-settings"),

  // Version info
  getVersion: () => ipcRenderer.invoke("get-version"),
  getAdbVersion: () => ipcRenderer.invoke("get-adb-version"),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke("window-minimize"),
  windowMaximize: () => ipcRenderer.invoke("window-maximize"),
  windowClose: () => ipcRenderer.invoke("window-close"),

  // File operations
  openFolder: (path: string) => ipcRenderer.invoke("open-folder", path),
});
