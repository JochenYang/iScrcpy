import type { ElectronAPI } from "../types/electron";

// Electron API bridge
export const electronAPI: ElectronAPI = {
  // Device management
  adbDevices: () => window.electronAPI.adbDevices(),
  connectWifi: (deviceId: string) => window.electronAPI.connectWifi(deviceId),
  enableTcpip: (deviceId: string) => window.electronAPI.enableTcpip(deviceId),
  connectDevice: (deviceId: string) =>
    window.electronAPI.connectDevice(deviceId),
  disconnectDevice: (deviceId: string) =>
    window.electronAPI.disconnectDevice(deviceId),

  // File manager
  listDeviceFiles: (deviceId: string, path: string) =>
    window.electronAPI.listDeviceFiles(deviceId, path),
  downloadDeviceFile: (deviceId: string, devicePath: string, savePath: string) =>
    window.electronAPI.downloadDeviceFile(deviceId, devicePath, savePath),
  uploadFileToDevice: (deviceId: string, filePath: string, devicePath: string) =>
    window.electronAPI.uploadFileToDevice(deviceId, filePath, devicePath),
  deleteDeviceFile: (deviceId: string, devicePath: string) =>
    window.electronAPI.deleteDeviceFile(deviceId, devicePath),
  createDeviceFolder: (deviceId: string, devicePath: string) =>
    window.electronAPI.createDeviceFolder(deviceId, devicePath),
  installApk: (deviceId: string, apkPath: string) =>
    window.electronAPI.installApk(deviceId, apkPath),

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

  // Log level
  getLogLevel: () => window.electronAPI.getLogLevel(),
  setLogLevel: (level: string) => window.electronAPI.setLogLevel(level),
  getLogStats: () => window.electronAPI.getLogStats(),
  clearLogs: () => window.electronAPI.clearLogs(),

  // Version info
  getAppVersion: () => window.electronAPI.getAppVersion(),
  getVersion: () => window.electronAPI.getVersion(),
  getAdbVersion: () => window.electronAPI.getAdbVersion(),
  getElectronVersion: () => window.electronAPI.getElectronVersion(),
  getChromeVersion: () => window.electronAPI.getChromeVersion(),

  // Window controls
  windowMinimize: () => window.electronAPI.windowMinimize(),
  windowMaximize: () => window.electronAPI.windowMaximize(),
  windowClose: () => window.electronAPI.windowClose(),

  // Close confirmation
  onShowCloseConfirm: (callback: () => void) =>
    window.electronAPI.onShowCloseConfirm(callback),
  removeCloseConfirmListener: () => window.electronAPI.removeCloseConfirmListener(),
  sendCloseConfirmResult: (result: { minimizeToTray: boolean }) =>
    window.electronAPI.sendCloseConfirmResult(result),

  // File operations
  openFolder: (path: string) => window.electronAPI.openFolder(path),
  openLogsFolder: () => window.electronAPI.openLogsFolder(),
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

  // Update checking
  checkForUpdates: () => window.electronAPI.checkForUpdates(),
  downloadUpdate: (downloadUrl: string) =>
    window.electronAPI.downloadUpdate(downloadUrl),
  installUpdate: (installerPath: string) =>
    window.electronAPI.installUpdate(installerPath),
};
