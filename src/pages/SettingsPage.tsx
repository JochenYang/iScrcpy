import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { electronAPI } from "../utils/electron";
import { ScrollText, AlertTriangle, MinusCircle, Info, Bug, Folder, Trash2, FileArchive, Monitor } from "lucide-react";

type LogLevelType = "error" | "warn" | "info" | "debug";

const logLevels: { value: LogLevelType; color: string; icon: typeof AlertTriangle }[] = [
  { value: "error", color: "text-red-500", icon: AlertTriangle },
  { value: "warn", color: "text-yellow-500", icon: MinusCircle },
  { value: "info", color: "text-blue-500", icon: Info },
  { value: "debug", color: "text-gray-500", icon: Bug },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const [logLevel, setLogLevel] = useState<LogLevelType>("info");
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [logStats, setLogStats] = useState<{ count: number; size: string }>({ count: 0, size: "0 KB" });

  useEffect(() => {
    loadLogLevel();
    loadLogStats();
  }, []);

  const loadLogLevel = async () => {
    const result = await electronAPI.getLogLevel();
    if (result.level) {
      setLogLevel(result.level as LogLevelType);
    }
  };

  const loadLogStats = async () => {
    try {
      const stats = await electronAPI.getLogStats();
      setLogStats(stats);
    } catch (e) {
      console.error("Failed to load log stats:", e);
    }
  };

  const handleLogLevelChange = async (level: LogLevelType) => {
    setSaving(true);
    setLogLevel(level);
    await electronAPI.setLogLevel(level);
    showToast(t("settings.saved"));
    setSaving(false);
  };

  const handleClearLogs = async () => {
    if (!confirm(t("settings.clearLogsConfirm"))) return;

    setClearing(true);
    const result = await electronAPI.clearLogs();
    if (result.success) {
      showToast(t("settings.logsCleared", { count: result.count }));
      await loadLogStats();
    } else {
      showToast(result.error || t("settings.clearLogsFailed"));
    }
    setClearing(false);
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
        <h1>{t("settings.title")}</h1>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <ScrollText size={20} />
          <span>{t("settings.logLevel")}</span>
        </div>
        <div className="card-body">
          <p className="description">{t("settings.logLevelDesc")}</p>
          <div className="log-level-list">
            {logLevels.map((level) => (
              <div
                key={level.value}
                className={`log-level-item ${logLevel === level.value ? "active" : ""}`}
                onClick={() => !saving && handleLogLevelChange(level.value)}
              >
                <div className="log-level-left">
                  <level.icon size={18} className={level.color} />
                  <div className="log-level-info">
                    <span className="log-level-label">{t(`settings.log${level.value.charAt(0).toUpperCase() + level.value.slice(1)}`)}</span>
                    <span className="log-level-desc">{t(`settings.log${level.value.charAt(0).toUpperCase() + level.value.slice(1)}Desc`)}</span>
                  </div>
                </div>
                <div className="log-level-right">
                  {logLevel === level.value && <div className="log-level-check" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <FileArchive size={20} />
          <span>{t("settings.logManagement")}</span>
        </div>
        <div className="card-body">
          <p className="description">{t("settings.logManagementDesc")}</p>

          {/* Log stats */}
          <div className="log-stats" style={{ display: "flex", gap: "16px", marginBottom: "16px", padding: "12px", background: "var(--surface-lighter)", borderRadius: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Folder size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "13px", color: "var(--on-surface-variant)" }}>{t("settings.logFiles")}:</span>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{logStats.count}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FileArchive size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "13px", color: "var(--on-surface-variant)" }}>{t("settings.logSize")}:</span>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{logStats.size}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              className="btn btn-outline"
              onClick={() => electronAPI.openLogsFolder()}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Folder size={16} />
              {t("about.openLogsFolder")}
            </button>
            <button
              className="btn btn-outline"
              onClick={handleClearLogs}
              disabled={clearing || logStats.count === 0}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Trash2 size={16} />
              {clearing ? t("settings.clearing") : t("settings.clearLogs")}
            </button>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Monitor size={20} />
          <span>{t("settings.shortcuts")}</span>
        </div>
        <div className="card-body">
          <p className="description">{t("settings.shortcutsDesc")}</p>
          <button
            className="btn btn-primary"
            onClick={async () => {
              const result = await electronAPI.createDesktopShortcut();
              if (result.success) {
                showToast(t("settings.shortcutCreated"));
              } else {
                showToast(result.error || t("settings.shortcutFailed"));
              }
            }}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Monitor size={16} />
            {t("settings.createDesktopShortcut")}
          </button>
        </div>
      </div>
    </div>
  );
}
