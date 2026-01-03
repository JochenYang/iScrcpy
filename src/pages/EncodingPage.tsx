import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { electronAPI } from "../utils/electron";
import { Film, Music } from "lucide-react";

interface EncodingSettings {
  videoCodec: string;
  audioCodec: string;
  bitrateMode: string;
}

export default function EncodingPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<EncodingSettings>({
    videoCodec: "h264",
    audioCodec: "opus",
    bitrateMode: "vbr",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const result = await electronAPI.loadSettings();
    if (result.encoding) {
      setSettings((prev) => ({ ...prev, ...result.encoding }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await electronAPI.saveSettings("encoding", settings);
    showToast(t("encoding.saved"));
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

  return (
    <div className="content-wrapper">
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
              onChange={(e) =>
                setSettings({ ...settings, videoCodec: e.target.value })
              }
            >
              <option value="h264">H.264 (AVC)</option>
              <option value="h265">H.265 (HEVC)</option>
              <option value="av1">AV1</option>
            </select>
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
