import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { electronAPI } from "../utils/electron";
import { Film, Music, Info, ChevronDown } from "lucide-react";

interface EncodingSettings {
  videoCodec: string;
  videoEncoder: string;
  audioCodec: string;
  bitrateMode: string;
}

export default function EncodingPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<EncodingSettings>({
    videoCodec: "h264",
    videoEncoder: "",
    audioCodec: "opus",
    bitrateMode: "vbr",
  });
  const [saving, setSaving] = useState(false);
  const [deviceOptions, setDeviceOptions] = useState<
    Array<{ label: string; value: string; isHardware: boolean; isRecommended: boolean }>
  >([]);
  const [loadingEncoders, setLoadingEncoders] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = (_event: any, data: { type: string; device: any }) => {
      if (data.type === "connected") {
        setCurrentDeviceId(data.device.id);
      } else if (data.type === "disconnected") {
        setCurrentDeviceId(null);
        setDeviceOptions([]);
      }
    };

    electronAPI.onDeviceChange(handleDeviceChange);
    return () => {
      electronAPI.removeDeviceChangeListener();
    };
  }, []);

  // Initial device check
  useEffect(() => {
    const checkDevice = async () => {
      const devicesResult = await electronAPI.adbDevices();
      const devices = devicesResult.devices || [];
      const connectedDevice = devices.find(
        (d: any) => d.status === "connected" || d.status === "device"
      );

      if (connectedDevice) {
        setCurrentDeviceId(connectedDevice.id);
      }
    };

    checkDevice();
  }, []);

  const loadSettings = async () => {
    const result = await electronAPI.loadSettings();
    if (result.encoding) {
      const encoding = result.encoding as EncodingSettings;
      let videoCodec = encoding.videoCodec || "h264";
      let videoEncoder = encoding.videoEncoder || "";

      // If encoder is saved, parse the codec from it (format: "codec & encoder")
      if (videoEncoder && videoEncoder.includes(" & ")) {
        const [codec, encoder] = videoEncoder.split(" & ");
        videoCodec = codec;
        videoEncoder = encoder;
      }

      setSettings({
        videoCodec,
        videoEncoder,
        audioCodec: encoding.audioCodec || "opus",
        bitrateMode: encoding.bitrateMode || "vbr",
      });
    }
  };

  // Get encoders when user clicks on the select dropdown
  const handleEncoderDropdownClick = useCallback(async () => {
    if (!currentDeviceId || loadingEncoders || deviceOptions.length > 0) {
      // Already loaded or no device
      return;
    }

    setLoadingEncoders(true);
    try {
      const encoderResult = await electronAPI.getEncoders(
        currentDeviceId,
        settings.videoCodec
      );

      if (encoderResult.success && encoderResult.encoders) {
        const videoEncoders = encoderResult.encoders.filter(
          (e) => e.type === "video" && e.codec === settings.videoCodec
        );

        // Format: "codec & encoder" like escrcpy
        const options = videoEncoders.map((encoder) => {
          const value = `${encoder.codec} & ${encoder.name}`;
          return {
            label: value,
            value,
            isHardware: encoder.isHardware,
            isRecommended: encoder.isRecommended,
          };
        });

        setDeviceOptions(options);

        if (options.length > 0) {
          setToast({
            message: t("encoding.encodersLoaded", { count: options.length }),
            visible: true,
          });
          setTimeout(() => {
            setToast((prev) => ({ ...prev, visible: false }));
          }, 2500);
        }
      }
    } catch (error) {
      // Silently fail
      console.error("Failed to load encoders:", error);
    }
    setLoadingEncoders(false);
  }, [currentDeviceId, settings.videoCodec, loadingEncoders, deviceOptions.length, t]);

  // Get the display value for encoder select
  const getEncoderDisplayValue = () => {
    if (!settings.videoEncoder) {
      return "";
    }
    // Combine current codec with saved encoder
    return `${settings.videoCodec} & ${settings.videoEncoder}`;
  };

  // When video codec changes, clear cached options
  const handleCodecChange = (newCodec: string) => {
    setSettings((prev) => ({ ...prev, videoCodec: newCodec, videoEncoder: "" }));
    setDeviceOptions([]);
  };

  // Handle encoder selection - parse "codec & encoder" format
  const handleEncoderChange = (value: string) => {
    if (!value) {
      setSettings((prev) => ({ ...prev, videoEncoder: "" }));
      return;
    }

    const [codec, encoder] = value.split(" & ");
    setSettings((prev) => ({
      ...prev,
      videoCodec: codec,
      videoEncoder: encoder,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await electronAPI.saveSettings("encoding", settings);
    setToast({
      message: t("encoding.saved"),
      visible: true,
    });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2500);
    setSaving(false);
  };

  return (
    <div className="content-wrapper">
      {/* Toast notification */}
      {toast.visible && <div className="toast">{toast.message}</div>}

      <div className="page-header">
        <h1>{t("encoding.title")}</h1>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t("encoding.save") + "..." : t("encoding.save")}
        </button>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Film size={20} />
          {t("encoding.videoCodec")}
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>{t("encoding.videoCodec")}</label>
            <select
              value={settings.videoCodec}
              onChange={(e) => handleCodecChange(e.target.value)}
            >
              <option value="h264">H.264 (AVC)</option>
              <option value="h265">H.265 (HEVC)</option>
              <option value="av1">AV1</option>
            </select>
          </div>

          {/* Video Encoder Selection - Click to load */}
          <div className="form-group">
            <label>{t("encoding.videoEncoder")}</label>

            {/* No device connected */}
            {!currentDeviceId && !loadingEncoders && (
              <p className="form-hint text-muted">{t("encoding.noDeviceConnected")}</p>
            )}

            {/* Loading */}
            {loadingEncoders && (
              <p className="form-hint text-muted">{t("encoding.loading")}</p>
            )}

            {/* Encoder select */}
            {currentDeviceId && (
              <div className="encoder-select-wrapper">
                <select
                  value={getEncoderDisplayValue()}
                  onChange={(e) => handleEncoderChange(e.target.value)}
                  onClick={handleEncoderDropdownClick}
                  className="encoder-select"
                  disabled={loadingEncoders}
                >
                  <option value="">{t("encoding.defaultEncoder")}</option>
                  {/* Show saved encoder as hidden option if not in deviceOptions */}
                  {settings.videoEncoder && !deviceOptions.some(o => o.value === getEncoderDisplayValue()) && (
                    <option value={getEncoderDisplayValue()} style={{ display: "none" }}>
                      {getEncoderDisplayValue()}
                    </option>
                  )}
                  {deviceOptions.map((option, index) => (
                    <option key={index} value={option.value}>
                      {option.value}
                      {option.isRecommended && " ★"}
                      {option.isHardware && !option.isRecommended && " (hw)"}
                      {!option.isHardware && !option.isRecommended && " (sw)"}
                    </option>
                  ))}
                </select>
                {!deviceOptions.length && !loadingEncoders && currentDeviceId && (
                  <ChevronDown
                    size={16}
                    className="encoder-dropdown-icon"
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                  />
                )}
              </div>
            )}

            {/* Selected encoder info */}
            {settings.videoEncoder && (
              <div className="selected-encoder-info">
                <Info size={14} />
                <span>{t("encoding.usingEncoder")}: {settings.videoEncoder}</span>
              </div>
            )}

            {/* Description */}
            <p className="form-hint text-small">{t("encoding.videoEncoderDesc")}</p>
          </div>

          <div className="form-group">
            <label>{t("encoding.bitrateMode")}</label>
            <select
              value={settings.bitrateMode}
              onChange={(e) =>
                setSettings({ ...settings, bitrateMode: e.target.value })
              }
            >
              <option value="vbr">{t("encoding.vbr")}</option>
              <option value="cbr">{t("encoding.cbr")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Music size={20} />
          {t("encoding.audioCodec")}
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>{t("encoding.audioCodec")}</label>
            <select
              value={settings.audioCodec}
              onChange={(e) =>
                setSettings({ ...settings, audioCodec: e.target.value })
              }
            >
              <option value="opus">Opus</option>
              <option value="aac">AAC</option>
              <option value="raw">RAW</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
