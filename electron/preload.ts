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

  // Listen for scrcpy exit events
  onScrcpyExit: (callback: (deviceId: string) => void) => {
    ipcRenderer.on("scrcpy-exit", (_, deviceId) => callback(deviceId))
  },
  removeScrcpyExitListener: () => {
    ipcRenderer.removeAllListeners("scrcpy-exit")
  },

  // Device history
  getDeviceHistory: () => ipcRenderer.invoke("get-device-history"),
  removeDeviceHistory: (deviceId: string) =>
    ipcRenderer.invoke("remove-device-history", deviceId),
  updateDeviceAutoConnect: (deviceId: string, autoConnect: boolean) =>
    ipcRenderer.invoke("update-device-auto-connect", deviceId, autoConnect),

  // Settings
  saveSettings: (type: string, settings: object) =>
    ipcRenderer.invoke("save-settings", type, settings),
  loadSettings: () => ipcRenderer.invoke("load-settings"),

  // Version info
  getVersion: () => ipcRenderer.invoke("get-version"),
  getAdbVersion: () => ipcRenderer.invoke("get-adb-version"),
  getElectronVersion: () => ipcRenderer.invoke("get-electron-version"),
  getChromeVersion: () => ipcRenderer.invoke("get-chrome-version"),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke("window-minimize"),
  windowMaximize: () => ipcRenderer.invoke("window-maximize"),
  windowClose: () => ipcRenderer.invoke("window-close"),

  // File operations
  openFolder: (path: string) => ipcRenderer.invoke("open-folder", path),
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
});
