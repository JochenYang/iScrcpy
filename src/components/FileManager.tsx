import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Folder,
  FileText,
  ArrowLeft,
  Download,
  Upload,
  Trash2,
  FolderPlus,
  Home,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { electronAPI } from "../utils/electron";

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size: string;
  modified: number;
}

interface FileManagerProps {
  deviceId: string;
  deviceName: string;
  onClose: () => void;
}

function formatPath(path: string): string {
  // Simplify path for display
  if (path === "/") return "Device Storage";
  if (path.startsWith("/sdcard")) {
    return path.replace("/sdcard", "Storage");
  }
  return path.split("/").pop() || path;
}

export default function FileManager({ deviceId, deviceName, onClose }: FileManagerProps) {
  const { t } = useTranslation();
  const [currentPath, setCurrentPath] = useState("/sdcard");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);

  useEffect(() => {
    loadFiles(currentPath);
  }, [deviceId, currentPath]);

  useEffect(() => {
    // Build breadcrumbs from current path
    const parts = currentPath.split("/").filter(Boolean);
    const crumbs: string[] = [];
    let path = "";
    for (const part of parts) {
      path += "/" + part;
      crumbs.push(path);
    }
    setBreadcrumbs(crumbs);
  }, [currentPath]);

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await electronAPI.listDeviceFiles(deviceId, path);
      if (result.success && result.files) {
        // Sort: directories first, then files, alphabetically
        const sorted = [...result.files].sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === "directory" ? -1 : 1;
        });
        setFiles(sorted);
      } else {
        setError(result.error || t("devices.fileManager.listFailed"));
      }
    } catch (err) {
      setError(t("devices.fileManager.listFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
  };

  const handleNavigateUp = () => {
    const parts = currentPath.split("/").filter(Boolean);
    if (parts.length > 0) {
      parts.pop();
      const newPath = parts.length === 0 ? "/" : "/" + parts.join("/");
      handleNavigate(newPath);
    }
  };

  const handleDownload = async () => {
    if (!selectedFile || selectedFile.type === "directory") return;
    
    setLoading(true);
    try {
      const result = await electronAPI.selectFolder(currentPath);
      if (result.success && result.path) {
        const downloadResult = await electronAPI.downloadDeviceFile(
          deviceId,
          selectedFile.path,
          result.path
        );
        if (downloadResult.success) {
          showToast(t("devices.fileManager.downloadSuccess", { name: selectedFile.name }));
        } else {
          setError(downloadResult.error || t("devices.fileManager.downloadFailed"));
        }
      }
    } catch (err) {
      setError(t("devices.fileManager.downloadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    try {
      const result = await electronAPI.selectFile({
        title: t("devices.fileManager.selectFile"),
      });
      if (result.success && result.path) {
        const fileName = result.path.split("/").pop();
        const targetPath = `${currentPath}/${fileName}`;
        const uploadResult = await electronAPI.uploadFileToDevice(
          deviceId,
          result.path,
          targetPath
        );
        if (uploadResult.success) {
          showToast(t("devices.fileManager.uploadSuccess", { name: fileName }));
          loadFiles(currentPath);
        } else {
          setError(uploadResult.error || t("devices.fileManager.uploadFailed"));
        }
      }
    } catch (err) {
      setError(t("devices.fileManager.uploadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    
    if (!confirm(t("devices.fileManager.deleteConfirm", { name: selectedFile.name }))) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await electronAPI.deleteDeviceFile(deviceId, selectedFile.path);
      if (result.success) {
        showToast(t("devices.fileManager.deleteSuccess"));
        setSelectedFile(null);
        loadFiles(currentPath);
      } else {
        setError(result.error || t("devices.fileManager.deleteFailed"));
      }
    } catch (err) {
      setError(t("devices.fileManager.deleteFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt(t("devices.fileManager.enterFolderName"));
    if (!folderName) return;
    
    const newPath = `${currentPath}/${folderName}`;
    setLoading(true);
    try {
      const result = await electronAPI.createDeviceFolder(deviceId, newPath);
      if (result.success) {
        showToast(t("devices.fileManager.createFolderSuccess"));
        loadFiles(currentPath);
      } else {
        setError(result.error || t("devices.fileManager.createFolderFailed"));
      }
    } catch (err) {
      setError(t("devices.fileManager.createFolderFailed"));
    } finally {
      setLoading(false);
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

  return (
    <div className="file-manager-overlay" onClick={onClose}>
      <div className="file-manager" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="file-manager-header">
          <h2>
            <Folder size={18} />
            {t("devices.fileManager.title", { device: deviceName })}
          </h2>
          <button className="btn btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Toolbar */}
        <div className="file-manager-toolbar">
          <button
            className="btn btn-outline btn-small"
            onClick={handleNavigateUp}
            disabled={currentPath === "/"}
            title={t("devices.fileManager.goUp")}
          >
            <ArrowLeft size={14} />
          </button>
          <button
            className="btn btn-outline btn-small"
            onClick={() => loadFiles(currentPath)}
            disabled={loading}
            title={t("devices.fileManager.refresh")}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
          </button>
          <button
            className="btn btn-outline btn-small"
            onClick={() => handleNavigate("/sdcard")}
            title={t("devices.fileManager.goHome")}
          >
            <Home size={14} />
          </button>
          <div className="toolbar-divider" />
          <button
            className="btn btn-outline btn-small"
            onClick={handleUpload}
            disabled={loading}
            title={t("devices.fileManager.uploadFile")}
          >
            <Upload size={14} />
          </button>
          <button
            className="btn btn-outline btn-small"
            onClick={handleCreateFolder}
            disabled={loading}
            title={t("devices.fileManager.createFolder")}
          >
            <FolderPlus size={14} />
          </button>
          <div className="toolbar-divider" />
          <button
            className="btn btn-outline btn-small"
            onClick={handleDownload}
            disabled={!selectedFile || selectedFile.type === "directory" || loading}
            title={t("devices.fileManager.downloadFile")}
          >
            <Download size={14} />
          </button>
          <button
            className="btn btn-outline btn-small"
            onClick={handleDelete}
            disabled={!selectedFile || loading}
            title={t("devices.fileManager.deleteFile")}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="file-manager-breadcrumb">
          <button
            className="breadcrumb-item"
            onClick={() => handleNavigate("/")}
          >
            <Home size={12} />
          </button>
          {breadcrumbs.map((path) => (
            <button
              key={path}
              className="breadcrumb-item"
              onClick={() => handleNavigate(path)}
            >
              <ChevronRight size={12} />
              <span>{formatPath(path)}</span>
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="file-manager-error">
            {error}
            <button onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        {/* File list */}
        <div className="file-manager-content">
          {loading ? (
            <div className="file-manager-loading">
              <RefreshCw size={24} className="spin" />
              <span>{t("devices.fileManager.loading")}</span>
            </div>
          ) : files.length === 0 ? (
            <div className="file-manager-empty">
              <Folder size={48} />
              <span>{t("devices.fileManager.empty")}</span>
            </div>
          ) : (
            <div className="file-list">
              {files.map((file) => (
                <div
                  key={file.path}
                  className={`file-item ${selectedFile?.path === file.path ? "selected" : ""}`}
                  onClick={() => setSelectedFile(file)}
                  onDoubleClick={() => {
                    if (file.type === "directory") {
                      handleNavigate(file.path);
                    }
                  }}
                >
                  <div className="file-icon">
                    {file.type === "directory" ? (
                      <Folder size={20} className="folder-icon" />
                    ) : (
                      <FileText size={20} />
                    )}
                  </div>
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-meta">
                      {file.type === "file" && (file.size || "-")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="file-manager-footer">
          <span>
            {t("devices.fileManager.currentPath")}: {currentPath}
          </span>
          <span>
            {files.length} {t("devices.fileManager.items")}
          </span>
        </div>
      </div>
    </div>
  );
}
