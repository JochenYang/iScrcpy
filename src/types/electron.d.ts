// File dialog options
export interface FileDialogOptions {
  defaultPath?: string;
  title?: string;
  filters?: { name: string; extensions: string[] }[];
}

// Device info
export interface DeviceInfo {
  id: string;
  name: string;
  type: "usb" | "wifi";
  status: string;
}

// Display settings
export interface DisplaySettings {
  maxSize: number | "custom";
  videoBitrate: number | "custom";
  frameRate: number | "custom";
  alwaysOnTop: boolean;
  fullscreen: boolean;
  stayAwake: boolean;
  enableVideo: boolean;
  enableAudio: boolean;
  record: boolean;
  recordAudio: boolean;
  recordPath: string;
  recordTimeLimit: number;
  camera: boolean;
  cameraId: string;
  cameraSize: string;
  cameraFps: number;
  windowBorderless: boolean;
  disableScreensaver: boolean;
}

// Encoding settings
export interface EncodingSettings {
  videoCodec: string;
  audioCodec: string;
  bitrateMode: string;
}

// Server settings
export interface ServerSettings {
  tunnelMode: string;
  cleanup: boolean;
  scrcpyPath?: string;
  adbPath?: string;
}

// Full settings
export interface Settings {
  display: DisplaySettings;
  encoding: EncodingSettings;
  server: ServerSettings;
  logLevel: string;
  deviceHistory: DeviceHistory[];
}

// Device history
export interface DeviceHistory {
  id: string;
  name: string;
  ip: string;
  port: number;
  lastConnected: number;
  autoConnect: boolean;
}

// Version info
export interface VersionInfo {
  version: string;
}

// Log level info
export interface LogLevelInfo {
  level: string;
}

// Log statistics
export interface LogStats {
  count: number;
  size: string;
}

// Clear logs result
export interface ClearLogsResult {
  success: boolean;
  count: number;
  error?: string;
}

// File entry for file manager
export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size: string;
  modified: number;
}

// File manager result
export interface FileListResult {
  success: boolean;
  files?: FileEntry[];
  currentPath?: string;
  error?: string;
}

// Electron API interface
export interface ElectronAPI {
  // Device management
  adbDevices: () => Promise<{ success: boolean; devices?: DeviceInfo[]; error?: string }>;
  connectWifi: (deviceId: string) => Promise<{ success: boolean; error?: string }>;
  enableTcpip: (deviceId: string) => Promise<{ success: boolean; ip?: string; error?: string }>;
  connectDevice: (deviceId: string) => Promise<{ success: boolean; deviceId?: string; error?: string }>;
  disconnectDevice: (deviceId: string) => Promise<{ success: boolean }>;

  // File manager
  listDeviceFiles: (deviceId: string, path: string) => Promise<FileListResult>;
  downloadDeviceFile: (deviceId: string, devicePath: string, savePath: string) => Promise<{ success: boolean; error?: string }>;
  uploadFileToDevice: (deviceId: string, filePath: string, devicePath: string) => Promise<{ success: boolean; error?: string }>;
  deleteDeviceFile: (deviceId: string, devicePath: string) => Promise<{ success: boolean; error?: string }>;
  createDeviceFolder: (deviceId: string, devicePath: string) => Promise<{ success: boolean; error?: string }>;
  installApk: (deviceId: string, apkPath: string) => Promise<{ success: boolean; packageName?: string; error?: string }>;

  // Quick actions for device
  startRecording: (deviceId: string) => Promise<{ success: boolean; error?: string }>;
  stopRecording: (deviceId: string) => Promise<{ success: boolean; error?: string }>;
  toggleAudio: (deviceId: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  toggleCamera: (deviceId: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;

  // Camera (independent from mirroring)
  startCamera: (deviceId: string) => Promise<{ success: boolean; error?: string }>;
  stopCamera: (deviceId: string) => Promise<{ success: boolean }>;

  // Scrcpy event listeners
  onScrcpyExit: (callback: (deviceId: string) => void) => void;
  removeScrcpyExitListener: () => void;
  onScrcpyStarted: (callback: (deviceId: string) => void) => void;
  removeScrcpyStartedListener: () => void;

  // Camera exit event listeners
  onCameraExit: (callback: (deviceId: string) => void) => void;
  removeCameraExitListener: () => void;

  // Device change listeners
  onDeviceChange: (callback: (event: any, data: { type: string; device: any }) => void) => void;
  removeDeviceChangeListener: () => void;

  // Device history
  getDeviceHistory: () => Promise<{
    history: Array<{
      id: string;
      name: string;
      ip: string;
      port: number;
      lastConnected: number;
      autoConnect: boolean;
    }>;
  }>;
  removeDeviceHistory: (deviceId: string) => Promise<{ success: boolean }>;
  clearDeviceHistory: () => Promise<{ success: boolean }>;
  updateDeviceAutoConnect: (deviceId: string, autoConnect: boolean) => Promise<{ success: boolean }>;

  // Log level
  getLogLevel: () => Promise<LogLevelInfo>;
  setLogLevel: (level: string) => Promise<{ success: boolean; level?: string; error?: string }>;
  getLogStats: () => Promise<LogStats>;
  clearLogs: () => Promise<ClearLogsResult>;

  // Settings
  saveSettings: (type: string, settings: object) => Promise<{ success: boolean }>;
  loadSettings: () => Promise<{
    display?: DisplaySettings;
    encoding?: EncodingSettings;
    server?: ServerSettings;
    logLevel?: string;
    deviceHistory?: DeviceHistory[];
  }>;

  // Version info
  getAppVersion: () => Promise<VersionInfo>;
  getVersion: () => Promise<{ success: boolean; version?: string; error?: string }>;
  getAdbVersion: () => Promise<{ success: boolean; version?: string; error?: string }>;
  getElectronVersion: () => Promise<VersionInfo>;
  getChromeVersion: () => Promise<VersionInfo>;

  // Window controls
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;

  // Close confirmation
  onShowCloseConfirm: (callback: () => void) => void;
  removeCloseConfirmListener: () => void;
  sendCloseConfirmResult: (result: { minimizeToTray: boolean }) => void;

  // File operations
  openFolder: (path: string) => void;
  openLogsFolder: () => void;
  openExternal: (url: string) => void;
  selectFolder: (defaultPath: string) => Promise<{ success: boolean; path?: string }>;
  selectFile: (options: FileDialogOptions) => Promise<{ success: boolean; path?: string }>;
  getScrcpyPath: () => Promise<string>;
  getAdbPath: () => Promise<string>;
  setScrcpyPath: (path: string) => Promise<{ success: boolean }>;
  setAdbPath: (path: string) => Promise<{ success: boolean }>;

  // Update checking
  checkForUpdates: () => Promise<{
    success: boolean;
    updateAvailable: boolean;
    currentVersion: string;
    latestVersion?: string;
    releaseNotes?: string;
    downloadUrl?: string;
    publishedAt?: string;
    error?: string;
  }>;
  downloadUpdate: (downloadUrl: string) => Promise<{
    success: boolean;
    downloadPath?: string;
    error?: string;
  }>;
  installUpdate: (installerPath: string) => Promise<{ success: boolean; error?: string }>;
  onDownloadProgress: (callback: (event: any, progress: number) => void) => void;
  removeDownloadProgressListener: () => void;

  // Language change notification for tray
  notifyLanguageChange: (lang: string) => void;
  setTrayTranslations: (translations: Record<string, { showWindow: string; quit: string; tooltip: string }>) => void;
}

// Extend Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
