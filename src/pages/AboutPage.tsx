import { useTranslation } from "react-i18next";
import { electronAPI } from "../utils/electron";
import { Github, HelpCircle, ExternalLink } from "lucide-react";

export default function AboutPage() {
  const { t } = useTranslation();

  const openExternal = (url: string) => {
    electronAPI.openExternal(url);
  };

  return (
    <div className="content-wrapper about-page">
      <div className="page-header">
        <h1>{t("about.title")}</h1>
      </div>

      <div className="about-container">
        <div className="about-logo">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
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
          <h2>iScrcpy</h2>
          <p className="version">Scrcpy 3.3.4</p>
          <p className="author">Jochenyang</p>
        </div>

        <div className="settings-card">
          <div className="card-header">
            <Github size={20} />
            {t("about.links")}
          </div>
          <div className="card-body">
            <p className="description">{t("about.description")}</p>
            <div className="github-links">
              <button
                className="github-link-btn"
                onClick={() =>
                  openExternal("https://github.com/JochenYang/iScrcpy")
                }
              >
                <Github size={18} />
                <span>iScrcpy</span>
                <ExternalLink size={14} className="external-link-icon" />
              </button>
              <button
                className="github-link-btn"
                onClick={() =>
                  openExternal("https://github.com/Genymobile/scrcpy")
                }
              >
                <Github size={18} />
                <span>scrcpy</span>
                <ExternalLink size={14} className="external-link-icon" />
              </button>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="card-header">
            <HelpCircle size={20} />
            {t("about.documentation")}
          </div>
          <div className="card-body">
            <ul className="help-list">
              <li>USB / WiFi {t("devices.connect")}</li>
              <li>{t("devices.connect")}</li>
              <li>{t("display.title")}</li>
              <li>{t("devices.wifiDevices")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
