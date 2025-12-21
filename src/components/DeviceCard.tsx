import { useTranslation } from "react-i18next";
import { Smartphone } from "lucide-react";

interface DeviceCardProps {
  device: {
    id: string;
    name: string;
    type: "usb" | "wifi";
    status: string;
  };
  isConnected: boolean;
  onConnect: (deviceId: string) => void;
  onDisconnect: (deviceId: string) => void;
  onEnableWifi?: (deviceId: string) => void;
}

export default function DeviceCard({
  device,
  isConnected,
  onConnect,
  onDisconnect,
  onEnableWifi,
}: DeviceCardProps) {
  const { t } = useTranslation();
  const statusText = isConnected
    ? t("devices.connecting")
    : t("devices.connect");

  return (
    <div className={`device-card ${isConnected ? "connected" : ""}`}>
      <div className="device-icon">
        <Smartphone size={24} />
      </div>
      <div className="device-info">
        <div className="device-name">{device.name}</div>
        <div className="device-id">{device.id}</div>
        <div className="device-badges">
          <span
            className={`badge badge-status ${isConnected ? "connected" : ""}`}
          >
            {statusText}
          </span>
          <span className={`badge badge-type ${device.type}`}>
            {device.type === "usb" ? "USB" : "WIFI"}
          </span>
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
        {isConnected ? (
          <button
            className="btn btn-small"
            onClick={() => onDisconnect(device.id)}
          >
            {t("devices.disconnect")}
          </button>
        ) : (
          <button
            className="btn btn-primary btn-small"
            onClick={() => onConnect(device.id)}
          >
            {t("devices.connect")}
          </button>
        )}
      </div>
    </div>
  );
}
