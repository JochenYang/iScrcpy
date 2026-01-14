import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Smartphone,
  Radio,
  Volume2,
  VolumeX,
  Camera,
  Disc,
  Folder,
  Package,
  Trash2,
} from "lucide-react";
import { useDeviceStore } from "../store/deviceStore";
import { electronAPI } from "../utils/electron";
import { showToast, showSuccess, showError } from "../utils/toast";

interface DeviceCardProps {
  device: {
    id: string;
    name: string;
    type: "usb" | "wifi";
    status: string;
  };
  isConnected: boolean; // ADB connected
  isMirroring: boolean; // Currently mirroring
  onConnect: (deviceId: string, options?: RecordOptions) => void;
  onDisconnect: (deviceId: string) => void;
  onEnableWifi?: (deviceId: string) => void;
  onStartRecord?: (deviceId: string) => void;
  onStopRecord?: (deviceId: string) => void;
  onToggleAudio?: (deviceId: string, enabled: boolean) => void;
  onStartCamera?: (deviceId: string) => void;
  onStopCamera?: (deviceId: string) => void;
  onOpenFileManager?: (deviceId: string, deviceName: string) => void;
  onRemove?: (deviceId: string) => void;
}

interface RecordOptions {
  record?: boolean;
  recordAudio?: boolean;
  camera?: boolean;
}

function arePropsEqual(
  prevProps: DeviceCardProps,
  nextProps: DeviceCardProps
): boolean {
  // Only re-render when device props or connection status actually changes
  if (prevProps.device.id !== nextProps.device.id) return false;
  if (prevProps.device.name !== nextProps.device.name) return false;
  if (prevProps.device.type !== nextProps.device.type) return false;
  if (prevProps.device.status !== nextProps.device.status) return false;
  if (prevProps.isConnected !== nextProps.isConnected) return false;
  if (prevProps.isMirroring !== nextProps.isMirroring) return false;

  // Reference type check (callback functions)
  if (prevProps.onConnect !== nextProps.onConnect) return false;
  if (prevProps.onDisconnect !== nextProps.onDisconnect) return false;
  if (prevProps.onEnableWifi !== nextProps.onEnableWifi) return false;
  if (prevProps.onStartRecord !== nextProps.onStartRecord) return false;
  if (prevProps.onStopRecord !== nextProps.onStopRecord) return false;
  if (prevProps.onToggleAudio !== nextProps.onToggleAudio) return false;
  if (prevProps.onStartCamera !== nextProps.onStartCamera) return false;
  if (prevProps.onStopCamera !== nextProps.onStopCamera) return false;
  if (prevProps.onOpenFileManager !== nextProps.onOpenFileManager) return false;
  if (prevProps.onRemove !== nextProps.onRemove) return false;

  return true;
}

export default React.memo(function DeviceCard({
  device,
  isConnected,
  isMirroring,
  onConnect,
  onDisconnect,
  onEnableWifi,
  onStartRecord,
  onStopRecord,
  onToggleAudio,
  onStartCamera,
  onStopCamera,
  onOpenFileManager,
  onRemove,
}: DeviceCardProps) {
  const { t } = useTranslation();
  const { recordingDevices, isAudioEnabled } = useDeviceStore();
  const isRecording = recordingDevices.includes(device.id);
  const audioEnabled = isAudioEnabled(device.id);

  const [isCameraActive, setIsCameraActive] = useState(false);

  // Status logic:
  // - Mirroring: "Mirroring" (regardless of ADB connection)
  // - ADB connected + not mirroring: "Connected" (green)
  // - ADB disconnected: "Disconnected" (gray)
  const statusText = isMirroring
    ? t("devices.connecting")
    : isConnected
    ? t("devices.connected")
    : t("devices.disconnected", { defaultValue: "离线" });

  const handleRecordToggle = () => {
    if (isRecording) {
      if (onStopRecord) {
        onStopRecord(device.id);
      }
    } else {
      if (onStartRecord) {
        onStartRecord(device.id);
      }
    }
  };

  const handleAudioToggle = () => {
    const newValue = !audioEnabled;
    if (onToggleAudio) {
      onToggleAudio(device.id, newValue);
    }
  };

  const handleCameraToggle = () => {
    if (isCameraActive) {
      setIsCameraActive(false);
      if (onStopCamera) {
        onStopCamera(device.id);
      }
    } else {
      setIsCameraActive(true);
      if (onStartCamera) {
        onStartCamera(device.id);
      }
    }
  };

  const handleInstallApk = async () => {
    try {
      const result = await electronAPI.selectFile({
        title: t("devices.installApk.title"),
        filters: [{ name: "APK", extensions: ["apk"] }],
      });

      if (result.success && result.path) {
        const installResult = await electronAPI.installApk(
          device.id,
          result.path
        );

        if (installResult.success) {
          showSuccess(t("devices.installApk.success"));
        } else {
          showError(installResult.error || t("devices.installApk.failed"));
        }
      }
    } catch (err) {
      console.error("Failed to install APK:", err);
      showError(t("devices.installApk.failed"));
    }
  };

  return (
    <div
      className={`device-card ${
        isMirroring ? "mirroring" : isConnected ? "connected" : "offline"
      }`}
    >
      <div className="device-icon">
        <Smartphone size={24} />
      </div>
      <div className="device-info">
        <div className="device-name">{device.name}</div>
        <div className="device-id">{device.id}</div>
        <div className="device-badges">
          <span
            className={`badge badge-status ${
              isMirroring ? "mirroring" : isConnected ? "connected" : "offline"
            }`}
          >
            {statusText}
          </span>
          <span className={`badge badge-type ${device.type}`}>
            {device.type === "usb" ? "USB" : "WIFI"}
          </span>
          {isRecording && (
            <span className="badge badge-recording">
              <Disc size={10} className="recording-dot" />
              REC
            </span>
          )}
        </div>
      </div>
      <div className="device-actions">
        {device.type === "usb" &&
          device.status === "device" &&
          onEnableWifi && (
            <button
              className="btn btn-outline btn-small"
              onClick={() => onEnableWifi(device.id)}
              title={t("devices.enableWifi")}
            >
              WiFi
            </button>
          )}

        {/* Camera button - always visible for independent camera start */}
        <button
          className={`btn btn-outline btn-small ${
            isCameraActive ? "active" : ""
          }`}
          onClick={handleCameraToggle}
          title={t("devices.camera")}
        >
          <Camera size={14} />
        </button>

        {/* File manager button - visible when connected */}
        {isConnected && onOpenFileManager && (
          <button
            className="btn btn-outline btn-small"
            onClick={() => onOpenFileManager(device.id, device.name)}
            title={t("devices.fileManager.title")}
          >
            <Folder size={14} />
          </button>
        )}

        {/* Install APK button - visible when connected */}
        {isConnected && (
          <button
            className="btn btn-outline btn-small"
            onClick={handleInstallApk}
            title={t("devices.installApk.title")}
          >
            <Package size={14} />
          </button>
        )}

        {/* Recording and audio buttons - only visible when actively mirroring */}
        {isMirroring && isConnected && (
          <>
            <button
              className={`btn btn-outline btn-small ${
                isRecording ? "recording" : ""
              }`}
              onClick={handleRecordToggle}
              title={t("devices.record")}
            >
              <Radio size={14} />
            </button>
            <button
              className={`btn btn-outline btn-small ${
                !audioEnabled ? "muted" : ""
              }`}
              onClick={handleAudioToggle}
              title={t("devices.audio")}
            >
              {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </>
        )}

        {/* Connect/Disconnect button */}
        {isMirroring ? (
          <button
            className="btn btn-small"
            onClick={() => onDisconnect(device.id)}
          >
            {t("devices.disconnect")}
          </button>
        ) : (
          <>
            {onRemove && (
              <button
                className="btn btn-outline btn-small"
                onClick={() => onRemove(device.id)}
                title={t("devices.remove")}
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              className="btn btn-primary btn-small"
              onClick={() => {
                if (isConnected) {
                  onConnect(device.id);
                } else {
                  if (device.type === "usb") {
                    // USB device offline, need physical connection
                    showToast(t("devices.toast.connectUsbDevice"));
                  } else {
                    // WiFi device offline, check if previously connected via USB
                    const isPreviouslyConnected = device.status !== "offline";
                    if (isPreviouslyConnected) {
                      // Device was connected before, likely WiFi disconnected
                      showToast(t("devices.toast.wifiDisconnected"));
                    } else {
                      // New device, prompt to enable WiFi mode via USB
                      showToast(t("devices.toast.enableWifiFirst"));
                    }
                    onConnect(device.id);
                  }
                }
              }}
            >
              {t("devices.connect")}
            </button>
          </>
        )}
      </div>
    </div>
  );
},
arePropsEqual);
