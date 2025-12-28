import { useTranslation } from "react-i18next";
import { electronAPI } from "../utils/electron";
import UpdateDialog from "../components/UpdateDialog";
import { Github, ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface VersionInfo {
  appVersion: string;
  scrcpyVersion: string;
  adbVersion: string;
}

export default function AboutPage() {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<VersionInfo>({
    appVersion: "...",
    scrcpyVersion: "...",
    adbVersion: "...",
  });
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    // Get app version from package.json
    electronAPI.getAppVersion().then((result) => {
      if (result.version) {
        setVersions((prev) => ({ ...prev, appVersion: result.version }));
      }
    });

    // Get scrcpy version
    electronAPI.getVersion().then((result) => {
      if (result.success && result.version) {
        setVersions((prev) => ({ ...prev, scrcpyVersion: result.version }));
      }
    });

    // Get ADB version
    electronAPI.getAdbVersion().then((result) => {
      if (result.success && result.version) {
        setVersions((prev) => ({ ...prev, adbVersion: result.version }));
      }
    });
  }, []);

  const openExternal = (url: string) => {
    electronAPI.openExternal(url);
  };

  return (
    <div className="content-wrapper about-page">
      {/* App Header */}
      <div className="about-header">
        <div className="about-logo-icon">
          <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
            <rect
              x="8"
              y="12"
              width="48"
              height="36"
              rx="4"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle
              cx="32"
              cy="30"
              r="8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M20 52h24M26 58h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="about-app-name">iScrcpy</h1>
        <p className="about-app-version">v{versions.appVersion} by Jochen</p>
        <p className="about-tagline">{t("about.description")}</p>
      </div>

      {/* Info Card - Version & Links combined */}
      <div className="settings-card">
        <div className="card-body">
          {/* Version Info */}
          <div className="about-version-row">
            <div className="about-version-item">
              <span className="about-version-label">Scrcpy</span>
              <span className="about-version-value">{versions.scrcpyVersion}</span>
            </div>
            <div className="about-version-item">
              <span className="about-version-label">ADB</span>
              <span className="about-version-value">{versions.adbVersion}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="about-divider"></div>

          {/* Links */}
          <div className="about-links-row">
            <button
              className="about-link-card"
              onClick={() => openExternal("https://github.com/JochenYang/iScrcpy")}
            >
              <Github size={20} />
              <div className="about-link-content">
                <span className="about-link-title">iScrcpy</span>
                <span className="about-link-desc">{t("about.github")}</span>
              </div>
              <ExternalLink size={14} className="about-link-arrow" />
            </button>
            <button
              className="about-link-card"
              onClick={() => openExternal("https://github.com/Genymobile/scrcpy")}
            >
              <Github size={20} />
              <div className="about-link-content">
                <span className="about-link-title">scrcpy</span>
                <span className="about-link-desc">{t("about.github")}</span>
              </div>
              <ExternalLink size={14} className="about-link-arrow" />
            </button>
          </div>

          {/* Update Check Button */}
          <div className="about-divider"></div>
          <button
            className="btn btn-outline"
            onClick={() => setShowUpdateDialog(true)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "16px" }}
          >
            <RefreshCw size={16} />
            {t("settings.update.checkNow")}
          </button>
        </div>
      </div>

      {/* Update Dialog */}
      {showUpdateDialog && <UpdateDialog onClose={() => setShowUpdateDialog(false)} />}
    </div>
  );
}
