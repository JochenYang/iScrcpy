import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { electronAPI } from "../utils/electron";
import { showToast } from "../utils/toast";
import DeviceCard from "../components/DeviceCard";
import FileManager from "../components/FileManager";
import { useDeviceStore } from "../store/deviceStore";
import { DeviceInfo } from "../types/electron";
import i18n from "../i18n";

export default function DevicePage() {
  const { t } = useTranslation();
  const {
    devices,
    knownDevices,
    mirroringDevices,
    addMirroringDevice,
    removeMirroringDevice,
    addRecordingDevice,
    removeRecordingDevice,
    setAudioEnabled,
    addCameraDevice,
    removeCameraDevice,
  } = useDeviceStore();
  const [refreshing, setRefreshing] = useState(false);
  const [wifiIp, setWifiIp] = useState("");
  const [showWifiInput, setShowWifiInput] = useState(false);
  const [fileManagerDevice, setFileManagerDevice] = useState<{id: string; name: string} | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Use ref to track knownDevices to avoid infinite loop
  const knownDevicesRef = useRef(knownDevices);
  knownDevicesRef.current = knownDevices;

  // Concurrency control: prevent multiple simultaneous loadDevices calls
  const isLoadingDevicesRef = useRef(false);

  type LoadDevicesOptions = {
    silent?: boolean;
    forceRefresh?: boolean;
  };

  const loadDevices = useCallback(async (options: LoadDevicesOptions = {}) => {
    // Bail out if already loading to prevent race conditions
    if (isLoadingDevicesRef.current) {
      return;
    }
    isLoadingDevicesRef.current = true;

    const silent = options.silent ?? false;
    const forceRefresh = options.forceRefresh ?? false;
    if (!silent) {
      setRefreshing(true);
    }

    let retryCount = 0;
    const maxRetries = 3;
    /** Outcome of this loadDevices call — only bulk-offline on definitive failure/empty after retries. */
    let loadSucceededWithList = false;
    let definitiveEmptyOrFailure = false;

    while (retryCount < maxRetries) {
      try {
        const result = await electronAPI.adbDevices();
        if (result.success && result.devices) {
          const currentDevices = result.devices as DeviceInfo[];

          // Successful non-empty list: apply merge and stop. Never re-poll to "confirm offline".
          if (currentDevices.length > 0) {
            const now = Date.now();
            const known = knownDevicesRef.current;
            const removed = useDeviceStore.getState().removedDevices;

            const currentDeviceMap = new Map(currentDevices.map(d => [d.id, d]));

            const mergedDevices = currentDevices.map(device => {
              const existing = known.find(d => d.id === device.id);
              if (existing) {
                return {
                  ...device,
                  lastSeen: now,
                  name: device.name !== "Unknown Device" ? device.name : existing.name,
                };
              }
              return { ...device, lastSeen: now };
            });

            const updatedKnown = known.map(knownDevice => {
              const current = currentDeviceMap.get(knownDevice.id);
              if (current) {
                return {
                  ...knownDevice,
                  name: current.name !== "Unknown Device" ? current.name : knownDevice.name,
                  status: current.status,
                  lastSeen: now,
                };
              }
              // Not in ADB list: keep last status (tracker remove event owns offline)
              return knownDevice;
            });

            for (const device of currentDevices) {
              const isInUpdatedKnown = updatedKnown.find(d => d.id === device.id);
              const wasRemoved = removed.some(d => d.id === device.id);
              const isUsbDevice = device.status === "device" && !device.id.includes(":");

              if (!isInUpdatedKnown && (!wasRemoved || isUsbDevice)) {
                updatedKnown.push({
                  ...device,
                  lastSeen: now,
                  name: device.name !== "Unknown Device" ? device.name : device.id,
                });
              }
            }

            useDeviceStore.setState({ devices: mergedDevices, knownDevices: updatedKnown });
            loadSucceededWithList = true;

            if (forceRefresh) {
              const wifiDevicesNeedingReconnect = updatedKnown.filter(d => {
                if (d.type !== "wifi") return false;
                if (currentDevices.some(curr => curr.id === d.id)) return false;
                const wasConnected = d.status === "connected" || d.status === "connecting";
                if (!wasConnected) return false;
                const disconnectDuration = now - (d.lastSeen || 0);
                return disconnectDuration > 10000;
              });

              for (const device of wifiDevicesNeedingReconnect) {
                setTimeout(() => {
                  electronAPI.connectWifi(device.id);
                }, 2000);
              }
            }

            break;
          }

          // success + empty list: retry then mark empty only if still empty after retries
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount - 1)));
            continue;
          }
          definitiveEmptyOrFailure = true;
        } else {
          // ADB command failed
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount - 1)));
            continue;
          }
          definitiveEmptyOrFailure = true;
        }
      } catch (error) {
        console.error("Failed to load devices:", error);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount - 1)));
          continue;
        }
        definitiveEmptyOrFailure = true;
      }
    }

    // Bulk offline only when this attempt never got a non-empty success (no second unconditional poll)
    if (!loadSucceededWithList && definitiveEmptyOrFailure) {
      console.warn("ADB empty/failed after retries, marking known devices offline");
      const known = useDeviceStore.getState().knownDevices;
      const now = Date.now();
      const updatedKnown = known.map(knownDevice => ({
        ...knownDevice,
        status: "offline",
        lastSeen: now,
      }));
      useDeviceStore.setState({
        devices: [],
        knownDevices: updatedKnown,
      });
    }

    setRefreshing(false);
    isLoadingDevicesRef.current = false;
  }, []);

  const connectDevice = useCallback(async (deviceId: string, _options?: { record?: boolean; recordAudio?: boolean; camera?: boolean }) => {
    const device = devices.find((d) => d.id === deviceId);
    const result = await electronAPI.connectDevice(deviceId);
    if (result.success) {
      addMirroringDevice(deviceId);
      
      // Remove from removedDevices and add to knownDevices when connecting
      const { removedDevices, knownDevices } = useDeviceStore.getState();
      if (removedDevices.some(d => d.id === deviceId) && device) {
        useDeviceStore.setState({
          removedDevices: removedDevices.filter(d => d.id !== deviceId),
          knownDevices: [...knownDevices, { ...device, lastSeen: Date.now() }]
        });
      }
      
      // Initialize audio state from settings
      const settings = await electronAPI.loadSettings();
      const displaySettings = settings.display as { enableAudio?: boolean } | undefined;
      const audioEnabled = displaySettings?.enableAudio !== false;
      if (audioEnabled) {
        setAudioEnabled(deviceId, true);
      }
      
      showToast(
        t("devices.toast.screenMirroringStarted", {
          deviceName: device?.name || deviceId,
        })
      );
      await loadDevices({ silent: true });
    } else {
      showToast(
        t("devices.toast.screenMirroringFailed") +
          `: ${result.error || t("devices.toast.unknownError")}`
      );
    }
  }, [devices, addMirroringDevice, setAudioEnabled, t, loadDevices]);

  const disconnectDevice = useCallback(async (deviceId: string) => {
    const result = await electronAPI.disconnectDevice(deviceId);
    if (result.success) {
      removeMirroringDevice(deviceId);
      const device = devices.find((d) => d.id === deviceId);
      showToast(
        t("devices.toast.screenMirroringStopped", {
          deviceName: device?.name || deviceId,
        })
      );
      await loadDevices({ silent: true });
    }
  }, [devices, removeMirroringDevice, t, loadDevices]);

  const handleRemoveDevice = useCallback((deviceId: string) => {
    // Remove from knownDevices and add to removedDevices
    const { knownDevices } = useDeviceStore.getState();
    const device = knownDevices.find(d => d.id === deviceId);
    
    if (device) {
      useDeviceStore.setState({
        knownDevices: knownDevices.filter(d => d.id !== deviceId),
        removedDevices: [...useDeviceStore.getState().removedDevices, device]
      });
        showToast(t("devices.toast.deviceRemoved"));
    }
  }, [t]);

  // Quick action handlers
  const startRecord = useCallback(async (deviceId: string) => {
    const result = await electronAPI.startRecording(deviceId);
    if (result.success) {
      addRecordingDevice(deviceId);
      showToast(t("devices.toast.recordingStarted"));
    } else {
      showToast(result.error || t("devices.toast.unknownError"));
    }
  }, [addRecordingDevice, t]);

  const stopRecord = useCallback(async (deviceId: string) => {
    const result = await electronAPI.stopRecording(deviceId);
    if (result.success) {
      removeRecordingDevice(deviceId);
      showToast(t("devices.toast.recordingStopped"));
    } else {
      showToast(result.error || t("devices.toast.unknownError"));
    }
  }, [removeRecordingDevice, t]);

  const toggleAudio = useCallback(async (deviceId: string, enabled: boolean) => {
    const result = await electronAPI.toggleAudio(deviceId, enabled);
    if (result.success) {
      setAudioEnabled(deviceId, enabled);
      const status = enabled ? t("devices.toast.audioToggled").replace("{status}", t("devices.audio").toLowerCase()) : t("devices.toast.audioToggled").replace("{status}", "关闭");
      showToast(status);
    } else {
      showToast(result.error || t("devices.toast.unknownError"));
    }
  }, [setAudioEnabled, t]);

  // Independent camera handlers
  const startCamera = useCallback(async (deviceId: string) => {
    const result = await electronAPI.startCamera(deviceId);
    if (result.success) {
      addCameraDevice(deviceId);
      showToast(t("devices.toast.cameraStarted"));
    } else {
      showToast(result.error || t("devices.toast.unknownError"));
    }
  }, [t, addCameraDevice]);

  const stopCamera = useCallback(async (deviceId: string) => {
    const result = await electronAPI.stopCamera(deviceId);
    if (result.success) {
      removeCameraDevice(deviceId);
      showToast(t("devices.toast.cameraStopped"));
    }
  }, [t, removeCameraDevice]);

  const openFileManager = useCallback((deviceId: string, deviceName: string) => {
    setFileManagerDevice({ id: deviceId, name: deviceName });
  }, []);

  const closeFileManager = useCallback(() => {
    setFileManagerDevice(null);
  }, []);

  const connectWifiDevice = async () => {
    if (!wifiIp.trim()) {
      showToast(t("devices.toast.enterIpAddress"));
      return;
    }

    const deviceAddress = wifiIp.includes(":") ? wifiIp : `${wifiIp}:5555`;

    const result = await electronAPI.connectWifi(deviceAddress);
    if (result.success) {
      showToast(t("devices.toast.wifiConnected", { address: deviceAddress }));
      setWifiIp("");
      setShowWifiInput(false);
      
      // Remove from removedDevices and add to knownDevices when manually connecting
      const { removedDevices, knownDevices } = useDeviceStore.getState();
      if (removedDevices.some(d => d.id === deviceAddress)) {
        useDeviceStore.setState({
          removedDevices: removedDevices.filter(d => d.id !== deviceAddress),
          knownDevices: [...knownDevices, { id: deviceAddress, name: deviceAddress, type: "wifi", status: "connecting", lastSeen: Date.now() }]
        });
      }
      
      await loadDevices({ silent: true });
    } else {
      showToast(
        t("devices.toast.wifiConnectFailed") +
          `: ${result.error || t("devices.toast.unknownError")}`
      );
    }
  };

  const enableWifiMode = async (deviceId: string) => {
    showToast(t("devices.toast.enablingWifiMode", { deviceId }));
    const result = await electronAPI.enableTcpip(deviceId);

    if (result.success) {
      if (result.ip) {
        showToast(t("devices.toast.wifiModeEnabled", { ip: result.ip }));
        const wifiAddress = `${result.ip}:5555`;
        setTimeout(async () => {
          const connectResult = await electronAPI.connectWifi(wifiAddress);
          if (connectResult.success) {
            showToast(t("devices.toast.autoConnected", { ip: result.ip }));
            
            // Remove from removedDevices and add to knownDevices when enabling WiFi mode
            const { removedDevices, knownDevices } = useDeviceStore.getState();
            if (removedDevices.some(d => d.id === wifiAddress)) {
              useDeviceStore.setState({
                removedDevices: removedDevices.filter(d => d.id !== wifiAddress),
                knownDevices: [...knownDevices, { id: wifiAddress, name: result.ip || wifiAddress, type: "wifi" as const, status: "connecting", lastSeen: Date.now() }]
              });
            }
            
            await loadDevices({ silent: true });
          }
        }, 2000);
      } else {
        // 获取不到 IP 时显示错误提示并刷新设备列表
        showToast(result.error || t("devices.toast.wifiModeEnabledManual"));
        await loadDevices({ silent: true });
      }
    } else {
      showToast(
        t("devices.toast.wifiModeEnableFailed") +
          `: ${result.error || t("devices.toast.unknownError")}`
      );
    }
  };

  const connectAll = async () => {
    const disconnected = devices.filter(
      (d) => !mirroringDevices.includes(d.id) && d.status !== "unauthorized"
    );
    if (disconnected.length === 0) {
      showToast(t("devices.toast.noDevicesToConnect"));
      return;
    }
    for (const device of disconnected) {
      await connectDevice(device.id);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  useEffect(() => {
    // Initial load - show loading state immediately
    setIsInitializing(true);
    // Don't call loadDevices here, deviceTracker will add devices via device-change event
    // Just set initializing to false after a short delay to allow device-change to be handled
    setTimeout(() => {
      setIsInitializing(false);
    }, 1000);
    // Silent polling every 10 seconds to update device status (reduced from 5s to save CPU)
    const pollInterval = setInterval(() => {
      loadDevices({ silent: true, forceRefresh: true });
    }, 10000);
    return () => clearInterval(pollInterval);
  }, [loadDevices]);

  // Use ref to track devices without causing re-renders
  const devicesRef = useRef(devices);
  devicesRef.current = devices;

  // Use ref for store actions to avoid re-binding
  const removeMirroringDeviceRef = useRef(removeMirroringDevice);
  removeMirroringDeviceRef.current = removeMirroringDevice;

  useEffect(() => {
    // Define handlers - these reference refs instead of dependencies
    const handleScrcpyExit = async (deviceId: string) => {
      console.log(`Scrcpy exited for device: ${deviceId}`);

      // Check if this device was already removed from mirroringDevices
      // If so, it was handled by disconnectDevice and we should skip the toast
      const currentMirroringDevices = useDeviceStore.getState().mirroringDevices;
      if (!currentMirroringDevices.includes(deviceId)) {
        console.log(`Device ${deviceId} already removed from mirroringDevices, skipping toast`);
        return;
      }

      removeMirroringDeviceRef.current(deviceId);
      const device = devicesRef.current.find((d) => d.id === deviceId);
      // Use i18n.t directly to get the current language translation
      // This fixes the issue where language changes aren't reflected in toast messages
      showToast(
        i18n.t("devices.toast.screenMirroringDisconnected", {
          deviceName: device?.name || deviceId,
        })
      );
      await loadDevices({ silent: true });
    };

    const handleCameraExit = (deviceId: string) => {
      console.log(`Camera exited for device: ${deviceId}`);
      useDeviceStore.getState().removeCameraDevice(deviceId);
      showToast(i18n.t("devices.toast.cameraStopped"));
    };

    const handleScrcpyStarted = (deviceId: string) => {
      console.log(`Scrcpy started for device: ${deviceId}`);
      addMirroringDevice(deviceId);
    };

    const handleDeviceChange = (_event: any, data: { type: string; device: any }) => {
      console.log(`Device change: ${data.type}`, data.device);
      if (data.type === "remove") {
        // Device disconnected - immediately update status to offline
        // No need to wait for ADB, device tracker already confirmed disconnection
        const { knownDevices, devices } = useDeviceStore.getState();
        const deviceId = data.device.id;

        // Update knownDevices
        const updatedKnown = knownDevices.map(d =>
          d.id === deviceId ? { ...d, status: "offline", lastSeen: Date.now() } : d
        );

        // Update devices
        const updatedDevices = devices.map(d =>
          d.id === deviceId ? { ...d, status: "offline", lastSeen: Date.now() } : d
        );

        useDeviceStore.setState({ knownDevices: updatedKnown, devices: updatedDevices });
        console.log(`Device ${deviceId} marked as offline`);
      } else if (data.type === "add") {
        // Device connected - update both devices list and knownDevices
        // This ensures consistency between the two state sources
        const { devices, knownDevices } = useDeviceStore.getState();
        const device = data.device;

        // Check if device exists in devices
        const existingInDevices = devices.find(d => d.id === device.id);
        // Check if device exists in knownDevices
        const existingInKnown = knownDevices.find(d => d.id === device.id);

        let updatedDevices = devices;
        let updatedKnown = knownDevices;

        // Add to devices if not exists
        if (!existingInDevices) {
          updatedDevices = [...devices, { ...device, lastSeen: Date.now() }];
        }

        // Add to knownDevices if not exists (for frontend refresh consistency)
        if (!existingInKnown) {
          updatedKnown = [...knownDevices, { ...device, lastSeen: Date.now() }];
        } else {
          // Update existing known device status to connected
          updatedKnown = knownDevices.map(d =>
            d.id === device.id ? { ...d, status: "connected", lastSeen: Date.now() } : d
          );
        }

        useDeviceStore.setState({ devices: updatedDevices, knownDevices: updatedKnown });
      }
    };

    // Bind all event listeners once on mount
    if (typeof electronAPI.onScrcpyExit === "function") {
      electronAPI.onScrcpyExit(handleScrcpyExit);
    }
    if (typeof electronAPI.onScrcpyStarted === "function") {
      electronAPI.onScrcpyStarted(handleScrcpyStarted);
    }
    if (typeof electronAPI.onCameraExit === "function") {
      electronAPI.onCameraExit(handleCameraExit);
    }
    if (typeof electronAPI.onDeviceChange === "function") {
      electronAPI.onDeviceChange(handleDeviceChange);
    }

    // Cleanup on unmount only
    return () => {
      if (typeof electronAPI.removeScrcpyExitListener === "function") {
        electronAPI.removeScrcpyExitListener();
      }
      if (typeof electronAPI.removeScrcpyStartedListener === "function") {
        electronAPI.removeScrcpyStartedListener();
      }
      if (typeof electronAPI.removeCameraExitListener === "function") {
        electronAPI.removeCameraExitListener();
      }
      if (typeof electronAPI.removeDeviceChangeListener === "function") {
        electronAPI.removeDeviceChangeListener();
      }
    };
  }, []); // Empty dependency array - bind once on mount

  // Refresh device status when page becomes visible (e.g., after switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Immediately refresh device status when page becomes visible
        loadDevices({ silent: true, forceRefresh: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loadDevices]);

  // Merge knownDevices and devices to get complete device list with latest status
  // Use useMemo to avoid recalculating on every render
  const { allDevices, usbDevices, wifiDevices } = useMemo(() => {
    const deviceStatusMap = new Map(devices.map(d => [d.id, d.status]));

    // Build all devices list: use knownDevices (includes offline devices) but update status from devices
    const allDevicesMap = new Map();

    // First add all known devices
    for (const device of knownDevices) {
      const currentStatus = deviceStatusMap.get(device.id);
      let finalStatus: string;
      if (currentStatus !== undefined) {
        // Device is currently detected by ADB, use real-time status
        finalStatus = currentStatus;
      } else if (device.type === "wifi") {
        // WiFi device not detected: use cached status (may be temporarily offline in ADB)
        finalStatus = device.status || "offline";
      } else {
        // USB device not detected: mark as offline
        finalStatus = "offline";
      }
      allDevicesMap.set(device.id, {
        ...device,
        status: finalStatus,
        lastSeen: Date.now(),
      });
    }
    
    // Then add devices that are not in knownDevices yet
    for (const device of devices) {
      if (!allDevicesMap.has(device.id)) {
        allDevicesMap.set(device.id, device);
      }
    }
    
    const allDevicesList = Array.from(allDevicesMap.values());
    
    return {
      allDevices: allDevicesList,
      usbDevices: allDevicesList.filter((d) => d.type === "usb"),
      wifiDevices: allDevicesList.filter((d) => d.type === "wifi"),
    };
  }, [devices, knownDevices]);

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h1>{t("devices.title")}</h1>
        <div className="header-actions">
          <button
            className="btn btn-outline"
            onClick={() => loadDevices({ silent: false, forceRefresh: true })}
            disabled={refreshing}
          >
            {refreshing ? (
              <span className="spinner" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14 8a6 6 0 11-1.5-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M14 2v3h-3" />
              </svg>
            )}
            {t("devices.refresh")}
          </button>
          <button className="btn btn-outline" onClick={connectAll}>
            {t("devices.connectAll")}
          </button>
        </div>
      </div>

      <div className="device-section">
        <h2 className="section-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="4" width="4" height="8" rx="1" />
            <rect x="10" y="4" width="4" height="8" rx="1" />
          </svg>
          {t("devices.usbDevices")}
        </h2>
        <div className="device-list" id="usb-devices">
          {usbDevices.map((device) => {
            // device.status is already updated with latest ADB status
            return (
              <DeviceCard
                key={device.id}
                device={device}
                isConnected={device.status === "device" || device.status === "connected"}
                isMirroring={mirroringDevices.includes(device.id)}
                onConnect={connectDevice}
                onDisconnect={disconnectDevice}
                onEnableWifi={enableWifiMode}
                onStartRecord={startRecord}
                onStopRecord={stopRecord}
                onToggleAudio={toggleAudio}
                onStartCamera={startCamera}
                onStopCamera={stopCamera}
                onOpenFileManager={openFileManager}
                onRemove={handleRemoveDevice}
              />
            );
          })}
        </div>
      </div>

      <div className="device-section">
        <h2 className="section-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 8a6 6 0 0112 0" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="2" />
          </svg>
          {t("devices.wifiDevices")}
        </h2>

        {showWifiInput && (
          <div className="wifi-input-container" style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              className="wifi-input"
              placeholder={t("devices.inputIpPlaceholder")}
              value={wifiIp}
              onChange={(e) => setWifiIp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && connectWifiDevice()}
              style={{ flex: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid #333", background: "#1a1a1f", color: "#fff" }}
            />
            <button className="btn btn-primary btn-small" onClick={connectWifiDevice}>
              {t("devices.connectBtn")}
            </button>
            <button className="btn btn-outline btn-small" onClick={() => { setShowWifiInput(false); setWifiIp(""); }}>
              {t("devices.cancel")}
            </button>
          </div>
        )}

        {!showWifiInput && (
          <button className="btn btn-outline" onClick={() => setShowWifiInput(true)} style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
              <path d="M8 2v12M2 8h12" strokeWidth="2" />
            </svg>
            {t("devices.addWifiDevice")}
          </button>
        )}

        <div className="device-list" id="wifi-devices">
          {wifiDevices.map((device) => {
            // device.status is already updated with latest ADB status
            return (
              <DeviceCard
                key={device.id}
                device={device}
                isConnected={device.status === "device" || device.status === "connected"}
                isMirroring={mirroringDevices.includes(device.id)}
                onConnect={connectDevice}
                onDisconnect={disconnectDevice}
                onStartRecord={startRecord}
                onStopRecord={stopRecord}
                onToggleAudio={toggleAudio}
                onStartCamera={startCamera}
                onStopCamera={stopCamera}
                onOpenFileManager={openFileManager}
                onRemove={handleRemoveDevice}
              />
            );
          })}
        </div>
      </div>

      {allDevices.length === 0 && (
        <div className="empty-state visible">
          {isInitializing ? (
            <>
              <div className="spinner" style={{ width: 48, height: 48, marginBottom: 16 }} />
              <p>{t("devices.detectingDevices")}</p>
            </>
          ) : (
            <>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="currentColor" opacity="0.3">
                <rect x="16" y="8" width="32" height="48" rx="4" />
                <rect x="20" y="48" width="24" height="4" />
                <circle cx="32" cy="28" r="6" />
              </svg>
              <p>{t("devices.noDevices")}</p>
              <span>{t("devices.noDevicesDesc")}</span>
            </>
          )}
        </div>
      )}

      {fileManagerDevice && (
        <FileManager
          deviceId={fileManagerDevice.id}
          deviceName={fileManagerDevice.name}
          onClose={closeFileManager}
        />
      )}
    </div>
  );
}
