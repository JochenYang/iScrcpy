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

  // Quick actions for device
  startRecording: (deviceId: string) =>
    window.electronAPI.startRecording(deviceId),
  stopRecording: (deviceId: string) =>
    window.electronAPI.stopRecording(deviceId),
  toggleAudio: (deviceId: string, enabled: boolean) =>
    window.electronAPI.toggleAudio(deviceId, enabled),
  toggleCamera: (deviceId: string, enabled: boolean) =>
    window.electronAPI.toggleCamera(deviceId, enabled),

  // Camera (independent from mirroring)
  startCamera: (deviceId: string) => window.electronAPI.startCamera(deviceId),
  stopCamera: (deviceId: string) => window.electronAPI.stopCamera(deviceId),

  // Scrcpy exit event listeners
  onScrcpyExit: (callback: (deviceId: string) => void) =>
    window.electronAPI.onScrcpyExit(callback),
  removeScrcpyExitListener: () => window.electronAPI.removeScrcpyExitListener(),
  onScrcpyStarted: (callback: (deviceId: string) => void) =>
    window.electronAPI.onScrcpyStarted(callback),
  removeScrcpyStartedListener: () =>
    window.electronAPI.removeScrcpyStartedListener(),

  // Camera exit event listeners
  onCameraExit: (callback: (deviceId: string) => void) =>
    window.electronAPI.onCameraExit(callback),
  removeCameraExitListener: () => window.electronAPI.removeCameraExitListener(),

  // Settings
  saveSettings: (type: string, settings: object) =>
    window.electronAPI.saveSettings(type, settings),
  loadSettings: () => window.electronAPI.loadSettings(),

  // Version info
  getAppVersion: () => window.electronAPI.getAppVersion(),
  getVersion: () => window.electronAPI.getVersion(),
  getAdbVersion: () => window.electronAPI.getAdbVersion(),

  // Window controls
  windowMinimize: () => window.electronAPI.windowMinimize(),
  windowMaximize: () => window.electronAPI.windowMaximize(),
  windowClose: () => window.electronAPI.windowClose(),

  // File operations
  openFolder: (path: string) => window.electronAPI.openFolder(path),
  openExternal: (url: string) => window.electronAPI.openExternal(url),
  selectFolder: (defaultPath: string) =>
    window.electronAPI.selectFolder(defaultPath),
  selectFile: (options: {
    defaultPath?: string;
    title?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => window.electronAPI.selectFile(options),
  getScrcpyPath: () => window.electronAPI.getScrcpyPath(),
  getAdbPath: () => window.electronAPI.getAdbPath(),
  setScrcpyPath: (path: string) => window.electronAPI.setScrcpyPath(path),
  setAdbPath: (path: string) => window.electronAPI.setAdbPath(path),
};
