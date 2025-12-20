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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <rect x="8" y="18" width="8" height="2" />
        </svg>
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
