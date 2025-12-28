import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Smartphone,
  Radio,
  Volume2,
  VolumeX,
  Camera,
  Disc,
} from "lucide-react";
import { useDeviceStore } from "../store/deviceStore";

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
}

interface RecordOptions {
  record?: boolean;
  recordAudio?: boolean;
  camera?: boolean;
}

export default function DeviceCard({
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
}: DeviceCardProps) {
  const { t } = useTranslation();
  const { recordingDevices, isAudioEnabled } = useDeviceStore();
  const isRecording = recordingDevices.has(device.id);
  const audioEnabled = isAudioEnabled(device.id);

  const [isCameraActive, setIsCameraActive] = useState(false);

  // Status logic:
  // - Mirroring: "投屏中" (regardless of ADB connection)
  // - ADB connected + not mirroring: "已连接" (green)
  // - ADB disconnected: "离线" (gray)
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

  return (
    <div className={`device-card ${isMirroring ? "mirroring" : isConnected ? "connected" : "offline"}`}>
      <div className="device-icon">
        <Smartphone size={24} />
      </div>
      <div className="device-info">
        <div className="device-name">{device.name}</div>
        <div className="device-id">{device.id}</div>
        <div className="device-badges">
          <span
            className={`badge badge-status ${isMirroring ? "mirroring" : isConnected ? "connected" : "offline"}`}
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
          className={`btn btn-outline btn-small ${isCameraActive ? "active" : ""}`}
          onClick={handleCameraToggle}
          title={t("devices.camera")}
        >
          <Camera size={14} />
        </button>

        {/* Recording and audio buttons - only visible when actively mirroring */}
        {isMirroring && isConnected && (
          <>
            <button
              className={`btn btn-outline btn-small ${isRecording ? "recording" : ""}`}
              onClick={handleRecordToggle}
              title={t("devices.record")}
            >
              <Radio size={14} />
            </button>
            <button
              className={`btn btn-outline btn-small ${!audioEnabled ? "muted" : ""}`}
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
        ) : isConnected ? (
          <button
            className="btn btn-primary btn-small"
            onClick={() => onConnect(device.id)}
          >
            {t("devices.connect")}
          </button>
        ) : (
          // Offline device shows connect button
          <button
            className="btn btn-primary btn-small"
            onClick={() => {
              if (device.type === "usb") {
                // USB device offline, need physical connection
                const toast = document.createElement("div");
                toast.className = "toast";
                toast.textContent = t("devices.toast.connectUsbDevice");
                document.body.appendChild(toast);
                setTimeout(() => {
                  toast.classList.add("fade-out");
                  setTimeout(() => toast.remove(), 300);
                }, 2000);
              } else {
                // WiFi device offline, check if previously connected via USB
                const isPreviouslyConnected = device.status !== "offline";
                const toast = document.createElement("div");
                toast.className = "toast";
                if (isPreviouslyConnected) {
                  // Device was connected before, likely WiFi disconnected
                  toast.textContent = t("devices.toast.wifiDisconnected");
                } else {
                  // New device, prompt to enable WiFi mode via USB
                  toast.textContent = t("devices.toast.enableWifiFirst");
                }
                document.body.appendChild(toast);
                setTimeout(() => {
                  toast.classList.add("fade-out");
                  setTimeout(() => toast.remove(), 300);
                }, 3000);
                onConnect(device.id);
              }
            }}
          >
            {t("devices.connect")}
          </button>
        )}
      </div>
    </div>
  );
}
