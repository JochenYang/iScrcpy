import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { electronAPI } from "../utils/electron";
import {
  Video,
  Monitor,
  Settings2,
  VideoOff,
  Volume2,
  VolumeX,
  Layout,
  Maximize2,
  Zap,
  Clock,
  Camera,
  Radio,
  Folder,
  Disc,
  Maximize,
} from "lucide-react";

interface DisplaySettings {
  maxSize: number | "custom";
  videoBitrate: number | "custom";
  frameRate: number | "custom";
  alwaysOnTop: boolean;
  fullscreen: boolean;
  stayAwake: boolean;
  enableVideo: boolean;
  enableAudio: boolean;
  record: boolean;
  recordAudio: boolean;
  recordPath: string;
  recordTimeLimit: number; // 0 = unlimited
  camera: boolean;
  cameraId: string;
  cameraSize: string;
  cameraFps: number;
  windowBorderless: boolean;
  disableScreensaver: boolean;
}

interface EncodingSettings {
  videoCodec: string;
  audioCodec: string;
  bitrateMode: string;
}

export default function DisplayPage() {
  const { t } = useTranslation();
  const [encodingSettings, setEncodingSettings] = useState<EncodingSettings>({
    videoCodec: "h264",
    audioCodec: "opus",
    bitrateMode: "vbr",
  });
  const [settings, setSettings] = useState<DisplaySettings>({
    maxSize: 1080,
    videoBitrate: 8,
    frameRate: 60,
    alwaysOnTop: false,
    fullscreen: false,
    stayAwake: false,
    enableVideo: true,
    enableAudio: true,
    record: false,
    recordAudio: false,
    recordPath: "",
    recordTimeLimit: 0, // 0 = unlimited
    camera: false,
    cameraId: "",
    cameraSize: "1920x1080",
    cameraFps: 30,
    windowBorderless: false,
    disableScreensaver: false,
  });
  const [saving, setSaving] = useState(false);
  const [customMaxSize, setCustomMaxSize] = useState("");
  const [customBitrate, setCustomBitrate] = useState("");
  const [customFps, setCustomFps] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const result = await electronAPI.loadSettings();
    if (result.display) {
      setSettings((prev) => ({ ...prev, ...result.display }));
    }
    if (result.encoding) {
      setEncodingSettings((prev) => ({ ...prev, ...result.encoding }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await electronAPI.saveSettings("display", settings);
    await electronAPI.saveSettings("encoding", encodingSettings);
    showToast(t("display.saved"));
    setSaving(false);
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

  const updateCommandPreview = () => {
    const parts = ["scrcpy"];
    if (!settings.enableVideo) parts.push("--no-video");
    if (!settings.enableAudio) parts.push("--no-audio");
    const maxSize = typeof settings.maxSize === "number" ? settings.maxSize : 0;
    const bitrate =
      typeof settings.videoBitrate === "number" ? settings.videoBitrate : 0;
    const fps = typeof settings.frameRate === "number" ? settings.frameRate : 0;
    if (maxSize && maxSize !== 1920) parts.push(`--max-size=${maxSize}`);
    if (bitrate) parts.push(`--video-bit-rate=${bitrate}M`);
    if (fps && fps !== 60) parts.push(`--max-fps=${fps}`);
    if (settings.alwaysOnTop) parts.push("--always-on-top");
    if (settings.fullscreen) parts.push("--fullscreen");
    if (settings.stayAwake) parts.push("--stay-awake");
    if (settings.windowBorderless) parts.push("--window-borderless");
    if (settings.disableScreensaver) parts.push("--disable-screensaver");
    if (settings.record) {
      parts.push("--record");
      parts.push(settings.recordPath || "recording.mp4");
    }
    if (settings.recordTimeLimit > 0) {
      parts.push(`--time-limit=${settings.recordTimeLimit}`);
    }
    if (settings.recordAudio) parts.push("--record-audio");
    if (settings.camera) {
      if (settings.cameraId) parts.push(`--camera-id=${settings.cameraId}`);
      parts.push(`--camera-size=${settings.cameraSize}`);
      if (settings.cameraFps !== 30) parts.push(`--camera-fps=${settings.cameraFps}`);
    }
    return parts.join(" ");
  };

  const handleMaxSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "custom") {
      setSettings({ ...settings, maxSize: "custom" });
    } else {
      setSettings({ ...settings, maxSize: parseInt(value) });
      setCustomMaxSize("");
    }
  };

  const handleVideoBitrateChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    if (value === "custom") {
      setSettings({ ...settings, videoBitrate: "custom" });
    } else {
      setSettings({ ...settings, videoBitrate: parseInt(value) });
      setCustomBitrate("");
    }
  };

  const handleFrameRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "custom") {
      setSettings({ ...settings, frameRate: "custom" });
    } else {
      setSettings({ ...settings, frameRate: parseInt(value) });
      setCustomFps("");
    }
  };

  const handleCustomMaxSizeBlur = () => {
    const value = parseInt(customMaxSize);
    if (value && value > 0 && value <= 7680) {
      setSettings({ ...settings, maxSize: value });
      setCustomMaxSize(""); // Clear after saving
    } else if (customMaxSize === "") {
      setSettings({ ...settings, maxSize: 1080 });
    }
  };

  const handleCustomBitrateBlur = () => {
    const value = parseInt(customBitrate);
    if (value && value > 0 && value <= 1000) {
      setSettings({ ...settings, videoBitrate: value });
      setCustomBitrate(""); // Clear after saving
    } else if (customBitrate === "") {
      setSettings({ ...settings, videoBitrate: 8 });
    }
  };

  const handleCustomFpsBlur = () => {
    const value = parseInt(customFps);
    if (value && value > 0 && value <= 1000) {
      setSettings({ ...settings, frameRate: value });
      setCustomFps(""); // Clear after saving
    } else if (customFps === "") {
      setSettings({ ...settings, frameRate: 60 });
    }
  };

  const handleSelectFolder = async () => {
    try {
      const result = await electronAPI.selectFolder(settings.recordPath);
      if (result.success && result.path) {
        setSettings({ ...settings, recordPath: result.path });
      }
    } catch (error) {
      console.error("Failed to select folder:", error);
    }
  };

  const getMaxSizeValue = () => {
    if (settings.maxSize === "custom") return "custom";
    return String(settings.maxSize);
  };

  const getBitrateValue = () => {
    if (settings.videoBitrate === "custom") return "custom";
    return String(settings.videoBitrate);
  };

  const getFpsValue = () => {
    if (settings.frameRate === "custom") return "custom";
    return String(settings.frameRate);
  };

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h1>{t("display.title")}</h1>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t("display.save") + "..." : t("display.save")}
        </button>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Video size={20} />
          {t("display.title")}
        </div>
        <div className="card-body">
          <label className="toggle-item">
            <div className="toggle-item-left">
              {settings.enableVideo ? (
                <Video size={18} />
              ) : (
                <VideoOff size={18} />
              )}
              <span>{t("display.enableVideo")}</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.enableVideo}
                onChange={(e) =>
                  setSettings({ ...settings, enableVideo: e.target.checked })
                }
              />
              <span className="toggle-slider" />
            </div>
          </label>

          <label className="toggle-item">
            <div className="toggle-item-left">
              {settings.enableAudio ? (
                <Volume2 size={18} />
              ) : (
                <VolumeX size={18} />
              )}
              <span>{t("display.enableAudio")}</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.enableAudio}
                onChange={(e) =>
                  setSettings({ ...settings, enableAudio: e.target.checked })
                }
              />
              <span className="toggle-slider" />
            </div>
          </label>

          <div className="form-group select-form-group">
            <label>
              <Maximize2 size={16} />
              {t("display.maxSize")}
            </label>
            <select value={getMaxSizeValue()} onChange={handleMaxSizeChange}>
              <option value="480">480p</option>
              <option value="720">720p</option>
              <option value="1080">1080p</option>
              <option value="1440">1440p (2K)</option>
              <option value="2160">2160p (4K)</option>
              <option value="custom">{t("display.maxSize")}...</option>
            </select>
            {settings.maxSize === "custom" && (
              <div className="custom-input-group">
                <input
                  type="number"
                  placeholder="1920"
                  value={customMaxSize}
                  onChange={(e) => setCustomMaxSize(e.target.value)}
                  onBlur={handleCustomMaxSizeBlur}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleCustomMaxSizeBlur()
                  }
                />
                <span className="input-suffix">px</span>
              </div>
            )}
          </div>

          <div className="form-group select-form-group">
            <label>
              <Zap size={16} />
              {t("display.videoBitrate")}
            </label>
            <select
              value={getBitrateValue()}
              onChange={handleVideoBitrateChange}
            >
              <option value="1">1 Mbps</option>
              <option value="2">2 Mbps</option>
              <option value="4">4 Mbps</option>
              <option value="8">8 Mbps</option>
              <option value="16">16 Mbps</option>
              <option value="32">32 Mbps</option>
              <option value="custom">{t("display.videoBitrate")}...</option>
            </select>
            {settings.videoBitrate === "custom" && (
              <div className="custom-input-group">
                <input
                  type="number"
                  placeholder="10"
                  value={customBitrate}
                  onChange={(e) => setCustomBitrate(e.target.value)}
                  onBlur={handleCustomBitrateBlur}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleCustomBitrateBlur()
                  }
                />
                <span className="input-suffix">Mbps</span>
              </div>
            )}
          </div>

          <div className="form-group select-form-group">
            <label>
              <Clock size={16} />
              {t("display.frameRate")}
            </label>
            <select value={getFpsValue()} onChange={handleFrameRateChange}>
              <option value="30">30 fps</option>
              <option value="60">60 fps</option>
              <option value="90">90 fps</option>
              <option value="120">120 fps</option>
              <option value="144">144 fps</option>
              <option value="custom">{t("display.frameRate")}...</option>
            </select>
            {settings.frameRate === "custom" && (
              <div className="custom-input-group">
                <input
                  type="number"
                  placeholder="90"
                  value={customFps}
                  onChange={(e) => setCustomFps(e.target.value)}
                  onBlur={handleCustomFpsBlur}
                  onKeyPress={(e) => e.key === "Enter" && handleCustomFpsBlur()}
                />
                <span className="input-suffix">fps</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Monitor size={20} />
          {t("display.title")}
        </div>
        <div className="card-body">
          <label className="toggle-item">
            <div className="toggle-item-left">
              <Layout size={18} />
              <span>{t("display.alwaysOnTop")}</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.alwaysOnTop}
                onChange={(e) =>
                  setSettings({ ...settings, alwaysOnTop: e.target.checked })
                }
              />
              <span className="toggle-slider" />
            </div>
          </label>

          <label className="toggle-item">
            <div className="toggle-item-left">
              <Maximize2 size={18} />
              <span>{t("display.fullscreen")}</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.fullscreen}
                onChange={(e) =>
                  setSettings({ ...settings, fullscreen: e.target.checked })
                }
              />
              <span className="toggle-slider" />
            </div>
          </label>

          <label className="toggle-item">
            <div className="toggle-item-left">
              <Clock size={18} />
              <span>{t("display.stayAwake")}</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.stayAwake}
                onChange={(e) =>
                  setSettings({ ...settings, stayAwake: e.target.checked })
                }
              />
              <span className="toggle-slider" />
            </div>
          </label>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Radio size={20} />
          {t("display.recordTitle")}
        </div>
        <div className="card-body">
          <label className="toggle-item">
            <div className="toggle-item-left">
              <Radio size={18} />
              <span>{t("display.record")}</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.record}
                onChange={(e) =>
                  setSettings({ ...settings, record: e.target.checked })
                }
              />
              <span className="toggle-slider" />
            </div>
          </label>

          <label className="toggle-item">
            <div className="toggle-item-left">
              <Volume2 size={18} />
              <span>{t("display.recordAudio")}</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.recordAudio}
                onChange={(e) =>
                  setSettings({ ...settings, recordAudio: e.target.checked })
                }
              />
              <span className="toggle-slider" />
            </div>
          </label>

          <div className="form-group select-form-group">
            <label>
              <Folder size={16} />
              {t("display.recordPath")}
            </label>
            <div className="path-input">
              <input
                type="text"
                placeholder={t("display.recordPathPlaceholder")}
                value={settings.recordPath}
                onChange={(e) =>
                  setSettings({ ...settings, recordPath: e.target.value })
                }
              />
              <button
                className="btn btn-outline btn-small"
                onClick={handleSelectFolder}
                title="Browse"
              >
                <Folder size={14} />
              </button>
            </div>
          </div>

          <div className="form-group select-form-group">
            <label>
              <Clock size={16} />
              {t("display.recordTimeLimit")}
            </label>
            <div className="number-input">
              <input
                type="number"
                min="0"
                max="86400"
                placeholder={t("display.recordTimeLimitPlaceholder")}
                value={settings.recordTimeLimit || ""}
                onChange={(e) =>
                  setSettings({ ...settings, recordTimeLimit: parseInt(e.target.value) || 0 })
                }
              />
              <span className="input-suffix">{t("display.seconds")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Maximize size={20} />
          {t("display.windowTitle")}
        </div>
        <div className="card-body">
          <label className="toggle-item">
            <div className="toggle-item-left">
              <Layout size={18} />
              <span>{t("display.windowBorderless")}</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.windowBorderless}
                onChange={(e) =>
                  setSettings({ ...settings, windowBorderless: e.target.checked })
                }
              />
              <span className="toggle-slider" />
            </div>
          </label>

          <label className="toggle-item">
            <div className="toggle-item-left">
              <Disc size={18} />
              <span>{t("display.disableScreensaver")}</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.disableScreensaver}
                onChange={(e) =>
                  setSettings({ ...settings, disableScreensaver: e.target.checked })
                }
              />
              <span className="toggle-slider" />
            </div>
          </label>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Camera size={20} />
          {t("display.cameraTitle")}
        </div>
        <div className="card-body">
          <label className="toggle-item">
            <div className="toggle-item-left">
              <Camera size={18} />
              <span>{t("display.camera")}</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.camera}
                onChange={(e) =>
                  setSettings({ ...settings, camera: e.target.checked })
                }
              />
              <span className="toggle-slider" />
            </div>
          </label>

          <div className="form-group">
            <label>{t("display.cameraSize")}</label>
            <select
              value={settings.cameraSize}
              onChange={(e) =>
                setSettings({ ...settings, cameraSize: e.target.value })
              }
            >
              <option value="640x480">640x480 (VGA)</option>
              <option value="1280x720">1280x720 (720p)</option>
              <option value="1920x1080">1920x1080 (1080p)</option>
              <option value="2560x1440">2560x1440 (2K)</option>
              <option value="3840x2160">3840x2160 (4K)</option>
            </select>
          </div>

          <div className="form-group select-form-group">
            <label>
              <Clock size={16} />
              {t("display.cameraFps")}
            </label>
            <select
              value={settings.cameraFps}
              onChange={(e) =>
                setSettings({ ...settings, cameraFps: parseInt(e.target.value) })
              }
            >
              <option value="15">15 fps</option>
              <option value="24">24 fps</option>
              <option value="30">30 fps</option>
              <option value="60">60 fps</option>
              <option value="90">90 fps</option>
              <option value="120">120 fps</option>
            </select>
          </div>
        </div>
      </div>

      <div className="command-preview">
        <div className="preview-header">
          <Settings2 size={16} />
          Command Preview
        </div>
        <code>{updateCommandPreview()}</code>
      </div>
    </div>
  );
}
