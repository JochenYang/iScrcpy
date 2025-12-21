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
  const statusText = isConnected ? "投屏中" : "未连接";

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
              title="启用 WiFi 调试模式"
            >
              WiFi
            </button>
          )}
        {isConnected ? (
          <button
            className="btn btn-small"
            onClick={() => onDisconnect(device.id)}
          >
            断开投屏
          </button>
        ) : (
          <button
            className="btn btn-primary btn-small"
            onClick={() => onConnect(device.id)}
          >
            开始投屏
          </button>
        )}
      </div>
    </div>
  );
}
