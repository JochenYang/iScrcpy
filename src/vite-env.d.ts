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

    // Log level
    getLogLevel: () => Promise<{ level: string }>;
    setLogLevel: (level: string) => Promise<{ success: boolean; level?: string; error?: string }>;

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

    // Settings
    saveSettings: (
      type: string,
      settings: object
    ) => Promise<{ success: boolean }>;
    loadSettings: () => Promise<{
      display?: object;
      encoding?: object;
      server?: object;
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

    // Window controls
    windowMinimize: () => void;
    windowMaximize: () => void;
    windowClose: () => void;

    // File operations
    openFolder: (path: string) => void;
    openLogsFolder: () => void;
    openExternal: (url: string) => void;

    // Scrcpy exit events
    onScrcpyExit: (callback: (deviceId: string) => void) => void;
    removeScrcpyExitListener: () => void;
    onScrcpyStarted: (callback: (deviceId: string) => void) => void;
    removeScrcpyStartedListener: () => void;

    // Camera exit events
    onCameraExit: (callback: (deviceId: string) => void) => void;
    removeCameraExitListener: () => void;

    // File operations
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
  };
}
