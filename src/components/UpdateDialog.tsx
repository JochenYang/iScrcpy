import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { electronAPI } from "../utils/electron";

interface UpdateDialogProps {
  onClose: () => void;
}

interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseNotes?: string;
  downloadUrl?: string;
  publishedAt?: string;
}

export default function UpdateDialog({ onClose }: UpdateDialogProps) {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadPath, setDownloadPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    setChecking(true);
    setError(null);
    try {
      const result = await electronAPI.checkForUpdates();
      if (result.success) {
        setUpdateInfo({
          updateAvailable: result.updateAvailable,
          currentVersion: result.currentVersion,
          latestVersion: result.latestVersion,
          releaseNotes: result.releaseNotes,
          downloadUrl: result.downloadUrl,
          publishedAt: result.publishedAt,
        });
      } else {
        setError(result.error || t("settings.update.checkFailed"));
      }
    } catch (err) {
      setError(t("settings.update.checkFailed"));
    } finally {
      setChecking(false);
    }
  };

  const handleDownload = async () => {
    if (!updateInfo?.downloadUrl) return;

    setDownloading(true);
    setDownloadProgress(0);
    setError(null);

    try {
      const result = await electronAPI.downloadUpdate(updateInfo.downloadUrl);
      if (result.success && result.downloadPath) {
        setDownloadPath(result.downloadPath);
        setDownloadProgress(100);
      } else {
        setError(result.error || t("settings.update.downloadFailed"));
      }
    } catch (err) {
      setError(t("settings.update.downloadFailed"));
    } finally {
      setDownloading(false);
    }
  };

  const handleInstall = async () => {
    if (!downloadPath) return;

    try {
      await electronAPI.installUpdate(downloadPath);
    } catch (err) {
      setError(t("settings.update.installFailed"));
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog update-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dialog-header">
          <h2>
            <RefreshCw size={18} />
            {t("settings.update.title")}
          </h2>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="dialog-content">
          {checking && (
            <div className="update-loading">
              <RefreshCw size={32} className="spin" />
              <span>{t("settings.update.checking")}</span>
            </div>
          )}

          {error && !checking && (
            <div className="update-error">
              <AlertCircle size={32} />
              <span>{error}</span>
              <button
                className="btn btn-outline btn-small"
                onClick={checkForUpdates}
              >
                {t("settings.update.retry")}
              </button>
            </div>
          )}

          {!checking && !error && updateInfo && (
            <>
              {updateInfo.updateAvailable ? (
                <div className="update-available">
                  <div className="update-icon">
                    <AlertCircle size={48} className="text-primary" />
                  </div>
                  <div className="update-info">
                    <h3>{t("settings.update.available")}</h3>
                    <p className="version-info">
                      {t("settings.update.currentVersion")}:{" "}
                      <strong>{updateInfo.currentVersion}</strong>
                      {" → "}
                      <strong className="text-primary">
                        {updateInfo.latestVersion}
                      </strong>
                    </p>
                    {updateInfo.publishedAt && (
                      <p className="publish-date">
                        {t("settings.update.publishedAt")}:{" "}
                        {formatDate(updateInfo.publishedAt)}
                      </p>
                    )}
                  </div>

                  {updateInfo.releaseNotes && (
                    <div className="release-notes">
                      <h4>{t("settings.update.releaseNotes")}</h4>
                      <div className="release-notes-content">
                        {updateInfo.releaseNotes}
                      </div>
                    </div>
                  )}

                  {downloadPath ? (
                    <div className="download-complete">
                      <CheckCircle size={32} className="text-success" />
                      <span>{t("settings.update.downloadComplete")}</span>
                    </div>
                  ) : downloading ? (
                    <div className="download-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                      <span>
                        {t("settings.update.downloading")} ({downloadProgress}%)
                      </span>
                    </div>
                  ) : (
                    <div className="update-actions">
                      <button
                        className="btn btn-primary"
                        onClick={handleDownload}
                        disabled={!updateInfo.downloadUrl}
                      >
                        <Download size={16} />
                        {t("settings.update.download")}
                      </button>
                      {updateInfo.downloadUrl && (
                        <a
                          href={updateInfo.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline"
                        >
                          {t("settings.update.visitRelease")}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="update-latest">
                  <CheckCircle size={48} className="text-success" />
                  <h3>{t("settings.update.latest")}</h3>
                  <p>
                    {t("settings.update.currentVersion")}:{" "}
                    <strong>{updateInfo.currentVersion}</strong>
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {downloadPath && (
          <div className="dialog-footer">
            <button className="btn btn-primary" onClick={handleInstall}>
              {t("settings.update.installNow")}
            </button>
            <button className="btn btn-outline" onClick={onClose}>
              {t("common.later")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
