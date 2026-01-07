/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    // Device management
    adbDevices: () => Promise<{
      success: boolean;
      devices?: Array<{
        id: string;
        name: string;
        type: "usb" | "wifi";
        status: string;
      }>;
      error?: string;
    }>;
    connectWifi: (
      deviceId: string
    ) => Promise<{ success: boolean; error?: string }>;
    enableTcpip: (
      deviceId: string
    ) => Promise<{ success: boolean; ip?: string; error?: string }>;
    connectDevice: (
      deviceId: string
    ) => Promise<{ success: boolean; deviceId?: string; error?: string }>;
    disconnectDevice: (deviceId: string) => Promise<{ success: boolean }>;

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
    getLogLevel: () => Promise<{ level: string }>;
    setLogLevel: (level: string) => Promise<{ success: boolean; level?: string; error?: string }>;
    getLogStats: () => Promise<{ count: number; size: string }>;
    clearLogs: () => Promise<{ success: boolean; count: number; error?: string }>;

    // Quick actions for device
    startRecording: (
      deviceId: string
    ) => Promise<{ success: boolean; error?: string }>;
    stopRecording: (
      deviceId: string
    ) => Promise<{ success: boolean; error?: string }>;
    toggleAudio: (
      deviceId: string,
      enabled: boolean
    ) => Promise<{ success: boolean; error?: string }>;
    toggleCamera: (
      deviceId: string,
      enabled: boolean
    ) => Promise<{ success: boolean; error?: string }>;

    // Camera (independent from mirroring)
    startCamera: (
      deviceId: string
    ) => Promise<{ success: boolean; error?: string }>;
    stopCamera: (deviceId: string) => Promise<{ success: boolean }>;

    // Scrcpy exit events
    onScrcpyExit: (callback: (deviceId: string) => void) => void;
    removeScrcpyExitListener: () => void;
    onScrcpyStarted: (callback: (deviceId: string) => void) => void;
    removeScrcpyStartedListener: () => void;

    // Camera exit events
    onCameraExit: (callback: (deviceId: string) => void) => void;
    removeCameraExitListener: () => void;

    // File manager
    listDeviceFiles: (deviceId: string, path: string) => Promise<{
      success: boolean;
      files?: Array<{
        name: string;
        path: string;
        type: "file" | "directory";
        size: string;
        modified: number;
      }>;
      currentPath?: string;
      error?: string;
    }>;
    downloadDeviceFile: (deviceId: string, devicePath: string, savePath: string) => Promise<{ success: boolean; error?: string }>;
    uploadFileToDevice: (deviceId: string, filePath: string, devicePath: string) => Promise<{ success: boolean; error?: string }>;
    deleteDeviceFile: (deviceId: string, devicePath: string) => Promise<{ success: boolean; error?: string }>;
    createDeviceFolder: (deviceId: string, devicePath: string) => Promise<{ success: boolean; error?: string }>;
    installApk: (deviceId: string, apkPath: string) => Promise<{ success: boolean; packageName?: string; error?: string }>;

    // Settings
    saveSettings: (
      type: string,
      settings: object
    ) => Promise<{ success: boolean }>;
    loadSettings: () => Promise<{
      display?: {
        maxSize: number | "custom";
        videoBitrate: number | "custom";
        frameRate: number;
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
      };
      encoding?: {
        videoCodec: string;
        audioCodec: string;
        bitrateMode: string;
      };
      server?: {
        tunnelMode: string;
        cleanup: boolean;
        scrcpyPath?: string;
        adbPath?: string;
      };
      logLevel?: string;
      deviceHistory?: Array<{
        id: string;
        name: string;
        ip: string;
        port: number;
        lastConnected: number;
        autoConnect: boolean;
      }>;
    }>;

    // Version info
    getAppVersion: () => Promise<{ version: string }>;
    getVersion: () => Promise<{
      success: boolean;
      version?: string;
      error?: string;
    }>;
    getAdbVersion: () => Promise<{
      success: boolean;
      version?: string;
      error?: string;
    }>;
    getElectronVersion: () => Promise<{ version: string }>;
    getChromeVersion: () => Promise<{ version: string }>;

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
    selectFolder: (
      defaultPath: string
    ) => Promise<{ success: boolean; path?: string }>;
    selectFile: (options: {
      defaultPath?: string;
      title?: string;
      filters?: { name: string; extensions: string[] }[];
    }) => Promise<{ success: boolean; path?: string }>;
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

    // Download progress
    onDownloadProgress: (callback: (event: any, progress: number) => void) => void;
    removeDownloadProgressListener: () => void;

    // Language change notification for tray
    notifyLanguageChange: (lang: string) => void;
    setTrayTranslations: (translations: Record<string, { showWindow: string; quit: string; tooltip: string }>) => void;
  };
}
