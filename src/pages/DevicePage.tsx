import { useState, useEffect } from "react";
import { electronAPI } from "../utils/electron";
import DeviceCard from "../components/DeviceCard";
import { useDeviceStore } from "../store/deviceStore";

interface Device {
  id: string;
  name: string;
  type: "usb" | "wifi";
  status: string;
}

export default function DevicePage() {
  const {
    devices,
    setDevices,
    connectedDevices,
    addConnectedDevice,
    removeConnectedDevice,
  } = useDeviceStore();
  const [refreshing, setRefreshing] = useState(false);
  const [wifiIp, setWifiIp] = useState("");
  const [showWifiInput, setShowWifiInput] = useState(false);

  const loadDevices = async () => {
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
  };

  const connectDevice = async (deviceId: string) => {
    const result = await electronAPI.connectDevice(deviceId);
    if (result.success) {
      addConnectedDevice(deviceId);
      showToast(`${getDeviceName(deviceId)} 投屏已启动`);
      await loadDevices(); // 重新加载设备列表
    } else {
      showToast(`投屏失败: ${result.error || "未知错误"}`);
    }
  };

  const disconnectDevice = async (deviceId: string) => {
    const result = await electronAPI.disconnectDevice(deviceId);
    if (result.success) {
      removeConnectedDevice(deviceId);
      showToast(`${getDeviceName(deviceId)} 已断开投屏`);
      await loadDevices(); // 重新加载设备列表
    }
  };

  const connectWifiDevice = async () => {
    if (!wifiIp.trim()) {
      showToast("请输入设备 IP 地址");
      return;
    }

    // 添加默认端口 5555 如果没有指定
    const deviceAddress = wifiIp.includes(":") ? wifiIp : `${wifiIp}:5555`;

    const result = await electronAPI.connectWifi(deviceAddress);
    if (result.success) {
      showToast(`WiFi 设备 ${deviceAddress} 连接成功`);
      setWifiIp("");
      setShowWifiInput(false);
      await loadDevices(); // 重新加载设备列表
    } else {
      showToast(`WiFi 连接失败: ${result.error || "未知错误"}`);
    }
  };

  const enableWifiMode = async (deviceId: string) => {
    showToast(`正在为设备 ${deviceId} 启用 WiFi 模式...`);
    const result = await electronAPI.enableTcpip(deviceId);

    if (result.success) {
      if (result.ip) {
        showToast(`WiFi 模式已启用！设备 IP: ${result.ip}:5555`);
        // 自动连接到 WiFi 设备
        setTimeout(async () => {
          const connectResult = await electronAPI.connectWifi(
            `${result.ip}:5555`
          );
          if (connectResult.success) {
            showToast(`已自动连接到 WiFi 设备 ${result.ip}:5555`);
            await loadDevices();
          }
        }, 2000);
      } else {
        showToast(result.error || "WiFi 模式已启用，请手动输入设备 IP 连接");
      }
    } else {
      showToast(`启用 WiFi 模式失败: ${result.error || "未知错误"}`);
    }
  };

  const getDeviceName = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    return device?.name || deviceId;
  };

  const connectAll = async () => {
    const disconnected = devices.filter(
      (d) => !connectedDevices.has(d.id) && d.status !== "unauthorized"
    );
    if (disconnected.length === 0) {
      showToast("没有可连接的设备");
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
    loadDevices();
  }, []);

  const usbDevices = devices.filter((d) => d.type === "usb");
  const wifiDevices = devices.filter((d) => d.type === "wifi");

  return (
    <div>
      <div className="page-header">
        <h1>设备列表</h1>
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
            刷新
          </button>
          <button className="btn btn-outline" onClick={connectAll}>
            连接全部
          </button>
        </div>
      </div>

      <div className="device-section">
        <h2 className="section-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="4" width="4" height="8" rx="1" />
            <rect x="10" y="4" width="4" height="8" rx="1" />
          </svg>
          USB 设备
        </h2>
        <div className="device-list" id="usb-devices">
          {usbDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              isConnected={connectedDevices.has(device.id)}
              onConnect={connectDevice}
              onDisconnect={disconnectDevice}
              onEnableWifi={enableWifiMode}
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
          WIFI 设备
        </h2>

        {showWifiInput && (
          <div
            className="wifi-input-container"
            style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}
          >
            <input
              type="text"
              className="wifi-input"
              placeholder="输入设备 IP 地址 (例如: 192.168.1.100 或 192.168.1.100:5555)"
              value={wifiIp}
              onChange={(e) => setWifiIp(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && connectWifiDevice()}
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
              连接
            </button>
            <button
              className="btn btn-outline btn-small"
              onClick={() => {
                setShowWifiInput(false);
                setWifiIp("");
              }}
            >
              取消
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
            添加 WiFi 设备
          </button>
        )}

        <div className="device-list" id="wifi-devices">
          {wifiDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              isConnected={connectedDevices.has(device.id)}
              onConnect={connectDevice}
              onDisconnect={disconnectDevice}
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
          <p>未检测到设备</p>
          <span>请连接 Android 设备并开启 USB 调试</span>
        </div>
      )}
    </div>
  );
}
