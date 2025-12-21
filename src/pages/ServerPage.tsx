import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { electronAPI } from "../utils/electron";
import { Folder, Network, Info } from "lucide-react";

interface ServerSettings {
  tunnelMode: string;
  cleanup: boolean;
}

interface VersionInfo {
  scrcpy: string;
  adb: string;
  server: boolean;
}

export default function ServerPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<ServerSettings>({
    tunnelMode: "reverse",
    cleanup: true,
  });
  const [scrcpyPath] = useState("app/scrcpy.exe");
  const [adbPath] = useState("app/adb.exe");
  const [versions, setVersions] = useState<VersionInfo>({
    scrcpy: "",
    adb: "",
    server: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadVersionInfo();
  }, []);

  const loadSettings = async () => {
    const result = await electronAPI.loadSettings();
    if (result.server) {
      setSettings((prev) => ({ ...prev, ...result.server }));
    }
  };

  const loadVersionInfo = async () => {
    const [scrcpy, adb] = await Promise.all([
      electronAPI.getVersion(),
      electronAPI.getAdbVersion(),
    ]);
    setVersions({
      scrcpy: scrcpy.success ? scrcpy.version || "" : "",
      adb: adb.success ? adb.version || "" : "",
      server: true,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await electronAPI.saveSettings("server", settings);
    showToast(t("server.saved"));
    setSaving(false);
  };

  const openScrcpyFolder = () => {
    electronAPI.openFolder("app/");
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
        <h1>{t("server.title")}</h1>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t("server.save") + "..." : t("server.save")}
        </button>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Folder size={20} />
          Scrcpy / ADB
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>Scrcpy</label>
            <div className="path-input">
              <input
                type="text"
                value={scrcpyPath}
                readOnly
                placeholder="app/scrcpy.exe"
              />
              <button className="btn btn-small" onClick={openScrcpyFolder}>
                {t("about.openLogsFolder")}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>ADB</label>
            <div className="path-input">
              <input
                type="text"
                value={adbPath}
                readOnly
                placeholder="app/adb.exe"
              />
              <button className="btn btn-small" onClick={openScrcpyFolder}>
                {t("about.openLogsFolder")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Network size={20} />
          {t("server.tunnelMode")}
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>{t("server.tunnelMode")}</label>
            <select
              value={settings.tunnelMode}
              onChange={(e) =>
                setSettings({ ...settings, tunnelMode: e.target.value })
              }
            >
              <option value="reverse">{t("server.reverse")}</option>
              <option value="forward">{t("server.forward")}</option>
            </select>
          </div>
          <label className="toggle-item">
            <div className="toggle-item-left">
              <span>{t("server.cleanup")}</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.cleanup}
                onChange={(e) =>
                  setSettings({ ...settings, cleanup: e.target.checked })
                }
              />
              <span className="toggle-slider" />
            </div>
          </label>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Info size={20} />
          {t("about.version")}
        </div>
        <div className="card-body">
          <div className="version-info">
            {versions.scrcpy && (
              <span>
                {t("about.scrcpyVersion")}: {versions.scrcpy}
              </span>
            )}
            {versions.adb && (
              <span>
                {t("about.adbVersion")}: {versions.adb}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
