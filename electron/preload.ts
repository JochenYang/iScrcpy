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

  // Quick actions for device
  startRecording: (deviceId: string) =>
    ipcRenderer.invoke("start-recording", deviceId),
  stopRecording: (deviceId: string) =>
    ipcRenderer.invoke("stop-recording", deviceId),
  toggleAudio: (deviceId: string, enabled: boolean) =>
    ipcRenderer.invoke("toggle-audio", deviceId, enabled),
  toggleCamera: (deviceId: string, enabled: boolean) =>
    ipcRenderer.invoke("toggle-camera", deviceId, enabled),

  // Camera (independent from mirroring)
  startCamera: (deviceId: string) =>
    ipcRenderer.invoke("start-camera", deviceId),
  stopCamera: (deviceId: string) =>
    ipcRenderer.invoke("stop-camera", deviceId),

  // Listen for scrcpy exit events
  onScrcpyExit: (callback: (deviceId: string) => void) => {
    ipcRenderer.on("scrcpy-exit", (_, deviceId) => callback(deviceId))
  },
  removeScrcpyExitListener: () => {
    ipcRenderer.removeAllListeners("scrcpy-exit")
  },

  // Listen for scrcpy started events
  onScrcpyStarted: (callback: (deviceId: string) => void) => {
    ipcRenderer.on("scrcpy-started", (_, deviceId) => callback(deviceId))
  },
  removeScrcpyStartedListener: () => {
    ipcRenderer.removeAllListeners("scrcpy-started")
  },

  // Listen for camera exit events
  onCameraExit: (callback: (deviceId: string) => void) => {
    ipcRenderer.on("camera-exit", (_, deviceId) => callback(deviceId))
  },
  removeCameraExitListener: () => {
    ipcRenderer.removeAllListeners("camera-exit")
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
  selectFolder: (defaultPath: string) =>
    ipcRenderer.invoke("select-folder", defaultPath),
  selectFile: (options: { defaultPath?: string; title?: string; filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke("select-file", options),
  getScrcpyPath: () => ipcRenderer.invoke("get-scrcpy-path"),
  getAdbPath: () => ipcRenderer.invoke("get-adb-path"),
  setScrcpyPath: (path: string) => ipcRenderer.invoke("set-scrcpy-path", path),
  setAdbPath: (path: string) => ipcRenderer.invoke("set-adb-path", path),
});
