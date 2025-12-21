/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    // Device management
    adbDevices: () => Promise<{ success: boolean; devices?: Array<{ id: string; name: string; type: 'usb' | 'wifi'; status: string }>; error?: string }>
    connectWifi: (deviceId: string) => Promise<{ success: boolean; error?: string }>
    connectDevice: (deviceId: string) => Promise<{ success: boolean; deviceId?: string; error?: string }>
    disconnectDevice: (deviceId: string) => Promise<{ success: boolean }>

    // Settings
    saveSettings: (type: string, settings: object) => Promise<{ success: boolean }>
    loadSettings: () => Promise<{ display?: object; encoding?: object; server?: object }>

    // Version info
    getVersion: () => Promise<{ success: boolean; version?: string; error?: string }>
    getAdbVersion: () => Promise<{ success: boolean; version?: string; error?: string }>

    // Window controls
    windowMinimize: () => void
    windowMaximize: () => void
    windowClose: () => void

    // File operations
    openFolder: (path: string) => void
    openExternal: (url: string) => void
  }
}
