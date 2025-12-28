import { X, Minus, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CloseConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onMinimizeToTray: () => void;
  onQuit: () => void;
}

export default function CloseConfirmDialog({
  open,
  onClose,
  onMinimizeToTray,
  onQuit,
}: CloseConfirmDialogProps) {
  const { t } = useTranslation();

  if (!open) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  };

  const dialogStyle: React.CSSProperties = {
    backgroundColor: "var(--surface)",
    borderRadius: "12px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    width: "360px",
    maxWidth: "90vw",
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid var(--border-color)",
    backgroundColor: "var(--surface-light)",
  };

  const titleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--on-surface)",
  };

  const contentStyle: React.CSSProperties = {
    padding: "20px",
  };

  const messageStyle: React.CSSProperties = {
    fontSize: "15px",
    fontWeight: 500,
    color: "var(--on-surface)",
    marginBottom: "8px",
  };

  const detailStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--on-surface-variant)",
    marginBottom: "20px",
    lineHeight: 1.5,
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const baseButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 500,
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  };

  const minimizeStyle: React.CSSProperties = {
    ...baseButtonStyle,
    backgroundColor: "var(--primary)",
    color: "var(--primary-foreground)",
  };

  const quitStyle: React.CSSProperties = {
    ...baseButtonStyle,
    backgroundColor: "var(--destructive)",
    color: "var(--destructive-foreground)",
  };

  const cancelStyle: React.CSSProperties = {
    ...baseButtonStyle,
    backgroundColor: "var(--surface-light)",
    color: "var(--on-surface)",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            <X size={18} style={{ color: "var(--on-surface-variant)" }} />
            {t("settings.closeConfirm.title")}
          </h2>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          <p style={messageStyle}>
            {t("settings.closeConfirm.message")}
          </p>
          <p style={detailStyle}>
            {t("settings.closeConfirm.detail")}
          </p>

          {/* Action Buttons */}
          <div style={buttonContainerStyle}>
            <button
              style={minimizeStyle}
              onClick={onMinimizeToTray}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--primary-hover)")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "var(--primary)")}
            >
              <Minus size={16} />
              {t("settings.closeConfirm.minimizeToTray")}
            </button>
            <button
              style={quitStyle}
              onClick={onQuit}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "oklch(0.6 0.2 22)")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "var(--destructive)")}
            >
              <LogOut size={16} />
              {t("settings.closeConfirm.quit")}
            </button>
            <button
              style={cancelStyle}
              onClick={onClose}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-lighter)")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-light)")}
            >
              {t("settings.closeConfirm.cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
