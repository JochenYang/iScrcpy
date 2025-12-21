// Electron API bridge
export const electronAPI = {
  // Device management
  adbDevices: () => window.electronAPI.adbDevices(),
  connectWifi: (deviceId: string) => window.electronAPI.connectWifi(deviceId),
  enableTcpip: (deviceId: string) => window.electronAPI.enableTcpip(deviceId),
  connectDevice: (deviceId: string) =>
    window.electronAPI.connectDevice(deviceId),
  disconnectDevice: (deviceId: string) =>
    window.electronAPI.disconnectDevice(deviceId),

  // Scrcpy exit event listeners
  onScrcpyExit: (callback: (deviceId: string) => void) =>
    window.electronAPI.onScrcpyExit(callback),
  removeScrcpyExitListener: () => window.electronAPI.removeScrcpyExitListener(),

  // Settings
  saveSettings: (type: string, settings: object) =>
    window.electronAPI.saveSettings(type, settings),
  loadSettings: () => window.electronAPI.loadSettings(),

  // Version info
  getVersion: () => window.electronAPI.getVersion(),
  getAdbVersion: () => window.electronAPI.getAdbVersion(),

  // Window controls
  windowMinimize: () => window.electronAPI.windowMinimize(),
  windowMaximize: () => window.electronAPI.windowMaximize(),
  windowClose: () => window.electronAPI.windowClose(),

  // File operations
  openFolder: (path: string) => window.electronAPI.openFolder(path),
  openExternal: (url: string) => window.electronAPI.openExternal(url),
};
