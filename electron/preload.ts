import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { ElectronAPI } from "../src/types/electron";

// Type for IPC listener callbacks
type IpcCallback = (event: IpcRendererEvent, ...args: any[]) => void;

// Listener management map - tracks callbacks per event to enable precise removal
// This prevents removeAllListeners from accidentally removing other components' listeners
const listenerMap = new Map<string, Set<IpcCallback>>();

/**
 * Registers a listener and returns an unsubscribe function for precise cleanup
 * @param eventName - The IPC event name to listen for
 * @param callback - The callback function to execute when event fires
 * @returns Unsubscribe function to remove only this specific listener
 */
function createListener(
  eventName: string,
  callback: (...args: any[]) => void
): () => void {
  // Wrap callback to maintain reference for later removal
  const wrappedCallback = (...args: any[]) => callback(...args);

  // Initialize Set for this event if not exists
  if (!listenerMap.has(eventName)) {
    listenerMap.set(eventName, new Set());
  }

  // Store wrapped callback for precise removal
  listenerMap.get(eventName)!.add(wrappedCallback);

  // Register with IPC
  ipcRenderer.on(eventName, wrappedCallback);

  // Return unsubscribe function
  return () => {
    listenerMap.get(eventName)?.delete(wrappedCallback);
    ipcRenderer.removeListener(eventName, wrappedCallback);
  };
}

/**
 * Removes a specific listener by event name
 * @param eventName - The IPC event name
 */
function removeListener(eventName: string): void {
  const callbacks = listenerMap.get(eventName);
  if (callbacks) {
    callbacks.forEach((callback) => {
      ipcRenderer.removeListener(eventName, callback);
    });
    callbacks.clear();
  }
}

// File dialog options type (for local use)
type FileDialogOptions = {
  defaultPath?: string;
  title?: string;
  filters?: { name: string; extensions: string[] }[];
};

// Tray translations - this will be updated by renderer
const trayTranslations: Record<string, { showWindow: string; quit: string; tooltip: string }> = {
  "en-US": {
    showWindow: "Show Window",
    quit: "Quit",
    tooltip: "iScrcpy - Android Screen Mirroring",
  }
};

// Expose tray translations as a global that renderer can update
contextBridge.exposeInMainWorld("trayUtils", {
  setTranslations: (translations: typeof trayTranslations) => {
    Object.assign(trayTranslations, translations);
    ipcRenderer.send("set-tray-translations", trayTranslations);
  },
  getTranslations: () => trayTranslations,
  getCurrent: (lang: string) => trayTranslations[lang] || trayTranslations["en-US"],
});

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
  stopCamera: (deviceId: string) => ipcRenderer.invoke("stop-camera", deviceId),

  // Listen for scrcpy exit events
  onScrcpyExit: (callback: (deviceId: string) => void) => {
    return createListener("scrcpy-exit", (_, deviceId) => callback(deviceId));
  },
  removeScrcpyExitListener: () => {
    removeListener("scrcpy-exit");
  },

  // Listen for scrcpy started events
  onScrcpyStarted: (callback: (deviceId: string) => void) => {
    return createListener("scrcpy-started", (_, deviceId) => callback(deviceId));
  },
  removeScrcpyStartedListener: () => {
    removeListener("scrcpy-started");
  },

  // Listen for camera exit events
  onCameraExit: (callback: (deviceId: string) => void) => {
    return createListener("camera-exit", (_, deviceId) => callback(deviceId));
  },
  removeCameraExitListener: () => {
    removeListener("camera-exit");
  },

  // Listen for device change events
  onDeviceChange: (callback: (event: any, data: { type: string; device: any }) => void) => {
    return createListener("device-change", (data) => callback(null, data));
  },
  removeDeviceChangeListener: () => {
    removeListener("device-change");
  },

  // Device history
  getDeviceHistory: () => ipcRenderer.invoke("get-device-history"),
  removeDeviceHistory: (deviceId: string) =>
    ipcRenderer.invoke("remove-device-history", deviceId),
  clearDeviceHistory: () => ipcRenderer.invoke("clear-device-history"),
  updateDeviceAutoConnect: (deviceId: string, autoConnect: boolean) =>
    ipcRenderer.invoke("update-device-auto-connect", deviceId, autoConnect),

  // Log level
  getLogLevel: () => ipcRenderer.invoke("get-log-level"),
  setLogLevel: (level: string) => ipcRenderer.invoke("set-log-level", level),
  getLogStats: () => ipcRenderer.invoke("get-log-stats"),
  clearLogs: () => ipcRenderer.invoke("clear-logs"),

  // Settings
  saveSettings: (type: string, settings: object) =>
    ipcRenderer.invoke("save-settings", type, settings),
  loadSettings: () => ipcRenderer.invoke("load-settings"),

  // Version info
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getVersion: () => ipcRenderer.invoke("get-version"),
  getAdbVersion: () => ipcRenderer.invoke("get-adb-version"),
  getElectronVersion: () => ipcRenderer.invoke("get-electron-version"),
  getChromeVersion: () => ipcRenderer.invoke("get-chrome-version"),

  // Encoder management
  getEncoders: (deviceId: string, codec: string) => ipcRenderer.invoke("get-encoders", deviceId, codec),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke("window-minimize"),
  windowMaximize: () => ipcRenderer.invoke("window-maximize"),
  windowClose: () => ipcRenderer.invoke("window-close"),

  // Close confirmation
  onShowCloseConfirm: (callback: () => void) => {
    return createListener("show-close-confirm", () => callback());
  },
  removeCloseConfirmListener: () => {
    removeListener("show-close-confirm");
  },
  sendCloseConfirmResult: (result: { minimizeToTray: boolean }) => {
    ipcRenderer.send("close-confirm-result", result);
  },
  quitApp: () => ipcRenderer.invoke("quit-app"),

  // Quit animation
  onQuitAnimation: (callback: () => void) => {
    return createListener("quit-animation", () => callback());
  },
  removeQuitAnimationListener: () => {
    removeListener("quit-animation");
  },

  // File operations
  openFolder: (path: string) => ipcRenderer.invoke("open-folder", path),
  openLogsFolder: () => ipcRenderer.invoke("open-logs-folder"),
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  selectFolder: (defaultPath: string) =>
    ipcRenderer.invoke("select-folder", defaultPath),
  selectFile: (options: FileDialogOptions) =>
    ipcRenderer.invoke("select-file", options),
  getScrcpyPath: () => ipcRenderer.invoke("get-scrcpy-path"),
  getAdbPath: () => ipcRenderer.invoke("get-adb-path"),
  setScrcpyPath: (path: string) => ipcRenderer.invoke("set-scrcpy-path", path),
  setAdbPath: (path: string) => ipcRenderer.invoke("set-adb-path", path),

  // File manager
  listDeviceFiles: (deviceId: string, path: string) =>
    ipcRenderer.invoke("list-device-files", deviceId, path),
  downloadDeviceFile: (deviceId: string, devicePath: string, savePath: string) =>
    ipcRenderer.invoke("download-device-file", deviceId, devicePath, savePath),
  uploadFileToDevice: (deviceId: string, filePath: string, devicePath: string) =>
    ipcRenderer.invoke("upload-file-to-device", deviceId, filePath, devicePath),
  deleteDeviceFile: (deviceId: string, devicePath: string) =>
    ipcRenderer.invoke("delete-device-file", deviceId, devicePath),
  createDeviceFolder: (deviceId: string, devicePath: string) =>
    ipcRenderer.invoke("create-device-folder", deviceId, devicePath),
  installApk: (deviceId: string, apkPath: string) =>
    ipcRenderer.invoke("install-apk", deviceId, apkPath),

  // Update checking
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: (downloadUrl: string) =>
    ipcRenderer.invoke("download-update", downloadUrl),
  installUpdate: (installerPath: string) =>
    ipcRenderer.invoke("install-update", installerPath),

  // Download progress
  onDownloadProgress: (callback: (event: Electron.IpcRendererEvent, progress: number) => void) => {
    return createListener("download-progress", callback);
  },
  removeDownloadProgressListener: () => {
    removeListener("download-progress");
  },

  // Language change notification for tray
  notifyLanguageChange: (lang: string) => {
    ipcRenderer.send("language-changed", lang);
  },
  setTrayTranslations: (translations: Record<string, { showWindow: string; quit: string; tooltip: string }>) => {
    ipcRenderer.send("set-tray-translations", translations);
  },
  // Provide translations when main process requests
  getTrayTranslations: () => {
    // This will be called from main process via invoke
    // We need to use ipcRenderer.invoke to handle the request
    return ipcRenderer.invoke("get-tray-translations-from-renderer");
  },
});
