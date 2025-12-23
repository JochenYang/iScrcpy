import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { electronAPI } from "../utils/electron";
import DeviceCard from "../components/DeviceCard";
import { useDeviceStore } from "../store/deviceStore";

export default function DevicePage() {
  const { t } = useTranslation();
  const {
    devices,
    setDevices,
    mirroringDevices,
    addMirroringDevice,
    removeMirroringDevice,
    addRecordingDevice,
    removeRecordingDevice,
    setAudioEnabled,
  } = useDeviceStore();
  const [refreshing, setRefreshing] = useState(false);
  const [wifiIp, setWifiIp] = useState("");
  const [showWifiInput, setShowWifiInput] = useState(false);

  const loadDevices = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await electronAPI.adbDevices();
      if (result.success && result.devices) {
        setDevices(result.devices);
      }
    } catch (error) {
      console.error("Failed to load devices:", error);
    }
    setRefreshing(false);
  }, [setDevices]);

  const connectDevice = async (deviceId: string) => {
    const result = await electronAPI.connectDevice(deviceId);
    if (result.success) {
      addMirroringDevice(deviceId);
      // Initialize audio state from settings
      const settings = await electronAPI.loadSettings();
      const displaySettings = settings.display as { enableAudio?: boolean } | undefined;
      const audioEnabled = displaySettings?.enableAudio !== false;
      if (audioEnabled) {
        setAudioEnabled(deviceId, true);
      }
      const device = devices.find((d) => d.id === deviceId);
      showToast(
        t("devices.toast.screenMirroringStarted", {
          defaultValue: `${device?.name || deviceId} 投屏已启动`,
        })
      );
      await loadDevices();
    } else {
      showToast(
        t("devices.toast.screenMirroringFailed") +
          `: ${result.error || t("devices.toast.unknownError")}`
      );
    }
  };

  const disconnectDevice = async (deviceId: string) => {
    const result = await electronAPI.disconnectDevice(deviceId);
    if (result.success) {
      removeMirroringDevice(deviceId);
      const device = devices.find((d) => d.id === deviceId);
      showToast(
        t("devices.toast.screenMirroringStopped", {
          defaultValue: `${device?.name || deviceId} 已断开投屏`,
        })
      );
      await loadDevices();
    }
  };

  // Quick action handlers
  const startRecord = async (deviceId: string) => {
    const result = await electronAPI.startRecording(deviceId);
    if (result.success) {
      addRecordingDevice(deviceId);
      showToast(t("devices.toast.recordingStarted"));
    } else {
      showToast(result.error || t("devices.toast.unknownError"));
    }
  };

  const stopRecord = async (deviceId: string) => {
    const result = await electronAPI.stopRecording(deviceId);
    if (result.success) {
      removeRecordingDevice(deviceId);
      showToast(t("devices.toast.recordingStopped"));
    } else {
      showToast(result.error || t("devices.toast.unknownError"));
    }
  };

  const toggleAudio = async (deviceId: string, enabled: boolean) => {
    const result = await electronAPI.toggleAudio(deviceId, enabled);
    if (result.success) {
      setAudioEnabled(deviceId, enabled);
      const status = enabled ? t("devices.toast.audioToggled").replace("{status}", t("devices.audio").toLowerCase()) : t("devices.toast.audioToggled").replace("{status}", "关闭");
      showToast(status);
    } else {
      showToast(result.error || t("devices.toast.unknownError"));
    }
  };

  // Independent camera handlers
  const startCamera = async (deviceId: string) => {
    const result = await electronAPI.startCamera(deviceId);
    if (result.success) {
      showToast(t("devices.toast.cameraStarted"));
    } else {
      showToast(result.error || t("devices.toast.unknownError"));
    }
  };

  const stopCamera = async (deviceId: string) => {
    const result = await electronAPI.stopCamera(deviceId);
    if (result.success) {
      showToast(t("devices.toast.cameraStopped"));
    }
  };

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
      await loadDevices();
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
        setTimeout(async () => {
          const connectResult = await electronAPI.connectWifi(
            `${result.ip}:5555`
          );
          if (connectResult.success) {
            showToast(t("devices.toast.autoConnected", { ip: result.ip }));
            await loadDevices();
          }
        }, 2000);
      } else {
        showToast(result.error || t("devices.toast.wifiModeEnabledManual"));
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
      (d) => !mirroringDevices.has(d.id) && d.status !== "unauthorized"
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

  const showToast = (message: string) => {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  useEffect(() => {
    // Initial load
    loadDevices();

    // Poll for device changes every 3 seconds
    const pollInterval = setInterval(() => {
      loadDevices();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [loadDevices]);

  useEffect(() => {
    const handleScrcpyExit = async (deviceId: string) => {
      console.log(`Scrcpy exited for device: ${deviceId}`);
      removeMirroringDevice(deviceId);
      const device = devices.find((d) => d.id === deviceId);
      showToast(
        t("devices.toast.screenMirroringDisconnected", {
          defaultValue: `${device?.name || deviceId} 投屏已断开`,
        })
      );
      await loadDevices();
    };

    const handleCameraExit = (deviceId: string) => {
      console.log(`Camera exited for device: ${deviceId}`);
      showToast(
        t("devices.toast.cameraStopped", {
          defaultValue: `相机已关闭`,
        })
      );
    };

    const handleScrcpyStarted = (deviceId: string) => {
      console.log(`Scrcpy started for device: ${deviceId}`);
      addMirroringDevice(deviceId);
    };

    if (typeof electronAPI.onScrcpyExit === "function") {
      electronAPI.onScrcpyExit(handleScrcpyExit);
    }

    if (typeof electronAPI.onScrcpyStarted === "function") {
      electronAPI.onScrcpyStarted(handleScrcpyStarted);
    }

    if (typeof electronAPI.onCameraExit === "function") {
      electronAPI.onCameraExit(handleCameraExit);
    }

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
    };
  }, [devices, addMirroringDevice, removeMirroringDevice, t, loadDevices]);

  const usbDevices = devices.filter((d) => d.type === "usb");
  const wifiDevices = devices.filter((d) => d.type === "wifi");

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h1>{t("devices.title")}</h1>
        <div className="header-actions">
          <button
            className="btn btn-outline"
            onClick={loadDevices}
            disabled={refreshing}
          >
            {refreshing ? (
              <span className="spinner" />
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  d="M14 8a6 6 0 11-1.5-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
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
          {usbDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              isConnected={device.status === "device" || device.status === "connected"}
              isMirroring={mirroringDevices.has(device.id)}
              onConnect={connectDevice}
              onDisconnect={disconnectDevice}
              onEnableWifi={enableWifiMode}
              onStartRecord={startRecord}
              onStopRecord={stopRecord}
              onToggleAudio={toggleAudio}
              onStartCamera={startCamera}
              onStopCamera={stopCamera}
            />
          ))}
        </div>
      </div>

      <div className="device-section">
        <h2 className="section-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path
              d="M2 8a6 6 0 0112 0"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="2" />
          </svg>
          {t("devices.wifiDevices")}
        </h2>

        {showWifiInput && (
          <div
            className="wifi-input-container"
            style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}
          >
            <input
              type="text"
              className="wifi-input"
              placeholder={t("devices.inputIpPlaceholder")}
              value={wifiIp}
              onChange={(e) => setWifiIp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && connectWifiDevice()}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #333",
                background: "#1a1a1f",
                color: "#fff",
              }}
            />
            <button
              className="btn btn-primary btn-small"
              onClick={connectWifiDevice}
            >
              {t("devices.connectBtn")}
            </button>
            <button
              className="btn btn-outline btn-small"
              onClick={() => {
                setShowWifiInput(false);
                setWifiIp("");
              }}
            >
              {t("devices.cancel")}
            </button>
          </div>
        )}

        {!showWifiInput && (
          <button
            className="btn btn-outline"
            onClick={() => setShowWifiInput(true)}
            style={{
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
            >
              <path d="M8 2v12M2 8h12" strokeWidth="2" />
            </svg>
            {t("devices.addWifiDevice")}
          </button>
        )}

        <div className="device-list" id="wifi-devices">
          {wifiDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              isConnected={device.status === "device" || device.status === "connected"}
              isMirroring={mirroringDevices.has(device.id)}
              onConnect={connectDevice}
              onDisconnect={disconnectDevice}
              onStartRecord={startRecord}
              onStopRecord={stopRecord}
              onToggleAudio={toggleAudio}
              onStartCamera={startCamera}
              onStopCamera={stopCamera}
            />
          ))}
        </div>
      </div>

      {devices.length === 0 && (
        <div className="empty-state visible">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="currentColor"
            opacity="0.3"
          >
            <rect x="16" y="8" width="32" height="48" rx="4" />
            <rect x="20" y="48" width="24" height="4" />
            <circle cx="32" cy="28" r="6" />
          </svg>
          <p>{t("devices.noDevices")}</p>
          <span>{t("devices.noDevicesDesc")}</span>
        </div>
      )}
    </div>
  );
}
