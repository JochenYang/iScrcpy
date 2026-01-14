import { useState, useEffect, useMemo } from "react";
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
  maxSize: number;
  maxSizeMode: 'preset' | 'custom'; // Track whether user selected preset or custom
  customMaxSize: number;
  videoBitrate: number;
  frameRate: number;
  // Custom option values (independent from preset options)
  customVideoBitrate: number;
  customFrameRate: number;
  buffer: number; // Video buffer in milliseconds for smoother playback
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
    maxSize: 1920, // 1080p (1920 longest edge for 1080x1920 mobile resolution)
    maxSizeMode: 'preset',
    videoBitrate: 8,
    frameRate: 60,
    customMaxSize: 1920,
    customVideoBitrate: 10,
    customFrameRate: 90,
    buffer: 0, // 0 = disabled for real-time mirroring, higher values reduce stutter but increase latency
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
  const [isCustomMaxSize, setIsCustomMaxSize] = useState(false);
  const [isCustomBitrate, setIsCustomBitrate] = useState(false);
  const [isCustomFps, setIsCustomFps] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const result = await electronAPI.loadSettings();
    if (result.display) {
      const savedDisplay = result.display as any;
      // Ensure custom values exist
      if (savedDisplay.customMaxSize === undefined) savedDisplay.customMaxSize = 1920;
      if (savedDisplay.customVideoBitrate === undefined) savedDisplay.customVideoBitrate = 10;
      if (savedDisplay.customFrameRate === undefined) savedDisplay.customFrameRate = 90;
      if (savedDisplay.buffer === undefined) savedDisplay.buffer = 0;
      if (savedDisplay.maxSizeMode === undefined) savedDisplay.maxSizeMode = 'preset';
      setSettings((prev) => ({ ...prev, ...savedDisplay }));
      // Restore custom selection states based on whether current values are presets
      setIsCustomMaxSize(!isPresetMaxSize(savedDisplay.maxSize));
      setIsCustomBitrate(!isPresetBitrate(savedDisplay.videoBitrate));
      setIsCustomFps(!isPresetFps(savedDisplay.frameRate));
    }
    if (result.encoding) {
      setEncodingSettings((prev) => ({ ...prev, ...result.encoding }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // Batch save all settings in a single operation
    await electronAPI.saveSettings({
      display: settings,
      encoding: encodingSettings,
    });
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

  // Use useMemo to cache command preview calculation
  const commandPreview = useMemo(() => {
    const parts = ["scrcpy"];
    if (!settings.enableVideo) parts.push("--no-video");
    if (!settings.enableAudio) parts.push("--no-audio");
    const maxSize = settings.maxSize;
    const bitrate = settings.videoBitrate;
    const fps = settings.frameRate;
    if (maxSize && maxSize !== 1920) parts.push(`--max-size=${maxSize}`);
    if (bitrate) parts.push(`--video-bit-rate=${bitrate}M`);
    if (fps && fps !== 60) parts.push(`--max-fps=${fps}`);
    // Video buffer for smoother playback
    if (settings.buffer && settings.buffer > 0) parts.push(`--video-buffer=${settings.buffer}`);
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
    // Note: --record-audio requires scrcpy 1.17+ with audio support
    // if (settings.recordAudio) parts.push("--record-audio");
    if (settings.camera) {
      if (settings.cameraId) parts.push(`--camera-id=${settings.cameraId}`);
      parts.push(`--camera-size=${settings.cameraSize}`);
      if (settings.cameraFps !== 30) parts.push(`--camera-fps=${settings.cameraFps}`);
    }
    // Encoding options
    if (encodingSettings.videoCodec && encodingSettings.videoCodec !== "h264") {
      parts.push(`--video-codec=${encodingSettings.videoCodec}`);
    }
    if (encodingSettings.audioCodec && encodingSettings.audioCodec !== "opus") {
      parts.push(`--audio-codec=${encodingSettings.audioCodec}`);
    }
    return parts.join(" ");
  }, [settings, encodingSettings]);

  // Check if a value is a preset option (0 = original)
  // scrcpy --max-size limits the longest edge, so for mobile portrait resolutions:
  // 480p = 480x854, 720p = 720x1280, 1080p = 1080x1920, etc.
  const isPresetMaxSize = (value: number) =>
    [0, 854, 1280, 1920, 2560, 3840].includes(value);
  const isPresetBitrate = (value: number) => [1, 2, 4, 8, 16, 32].includes(value);
  const isPresetFps = (value: number) => [30, 60, 90, 120, 144].includes(value);

  const handleMaxSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "custom") {
      setIsCustomMaxSize(true);
      // Don't change maxSize yet, let user input custom value
    } else {
      setIsCustomMaxSize(false);
      setSettings({ ...settings, maxSize: parseInt(value) });
    }
  };

  const handleCustomMaxSizeChange = (value: number) => {
    setSettings({ ...settings, maxSize: value, customMaxSize: value });
  };

  const handleVideoBitrateChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    if (value === "custom") {
      setIsCustomBitrate(true);
      // Don't change videoBitrate yet, let user input custom value
    } else {
      setIsCustomBitrate(false);
      setSettings({ ...settings, videoBitrate: parseInt(value) });
    }
  };

  const handleFrameRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "custom") {
      setIsCustomFps(true);
      // Don't change frameRate yet, let user input custom value
    } else {
      setIsCustomFps(false);
      setSettings({ ...settings, frameRate: parseInt(value) });
    }
  };

  const handleCustomBitrateChange = (value: number) => {
    setSettings({ ...settings, videoBitrate: value, customVideoBitrate: value });
  };

  const handleCustomFpsChange = (value: number) => {
    setSettings({ ...settings, frameRate: value, customFrameRate: value });
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

  // Helper functions for select values
  const getMaxSizeValue = () => {
    if (isCustomMaxSize) return "custom";
    if (isPresetMaxSize(settings.maxSize)) return String(settings.maxSize);
    return "custom";
  };

  const getBitrateValue = () => {
    if (isCustomBitrate) return "custom";
    if (isPresetBitrate(settings.videoBitrate)) return String(settings.videoBitrate);
    return "custom";
  };

  const getFpsValue = () => {
    if (isCustomFps) return "custom";
    if (isPresetFps(settings.frameRate)) return String(settings.frameRate);
    return "custom";
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
              {isCustomMaxSize ? t("display.customMaxSize") : t("display.maxSize")}
            </label>
            <select value={getMaxSizeValue()} onChange={handleMaxSizeChange}>
              <option value="0">{t("display.originalResolution")}</option>
              <option value="854">480p (480×854)</option>
              <option value="1280">720p (720×1280)</option>
              <option value="1920">1080p (1080×1920)</option>
              <option value="2560">2K (1440×2560)</option>
              <option value="3840">4K (2160×3840)</option>
              <option value="custom">{t("display.customMaxSize")}...</option>
            </select>
            {isCustomMaxSize && (
              <div className="custom-input-group">
                <input
                  type="number"
                  placeholder="1920"
                  value={settings.customMaxSize}
                  onChange={(e) => handleCustomMaxSizeChange(parseInt(e.target.value) || 1920)}
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
            {isCustomBitrate && (
              <div className="custom-input-group">
                <input
                  type="number"
                  placeholder="10"
                  value={settings.customVideoBitrate}
                  onChange={(e) => handleCustomBitrateChange(parseInt(e.target.value) || 10)}
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
            {isCustomFps && (
              <div className="custom-input-group">
                <input
                  type="number"
                  placeholder="90"
                  value={settings.customFrameRate}
                  onChange={(e) => handleCustomFpsChange(parseInt(e.target.value) || 90)}
                />
                <span className="input-suffix">fps</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>
              <Clock size={16} />
              <span>{t("display.buffer")}</span>
            </label>
            <div className="number-input">
              <input
                type="number"
                min="0"
                max="500"
                placeholder="0"
                value={settings.buffer || ""}
                onChange={(e) =>
                  setSettings({ ...settings, buffer: parseInt(e.target.value) || 0 })
                }
              />
              <span className="input-suffix">ms</span>
            </div>
            <small className="form-hint">{t("display.bufferDesc")}</small>
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
        <code>{commandPreview}</code>
      </div>
    </div>
  );
}
