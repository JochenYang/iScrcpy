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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 max-w-[90vw] mx-4 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <X className="w-5 h-5" />
            {t("settings.closeConfirm.title")}
          </h2>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-900 dark:text-white font-medium mb-2">
            {t("settings.closeConfirm.message")}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {t("settings.closeConfirm.detail")}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onMinimizeToTray}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <Minus className="w-4 h-4" />
              {t("settings.closeConfirm.minimizeToTray")}
            </button>
            <button
              onClick={onQuit}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              {t("settings.closeConfirm.quit")}
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors font-medium"
            >
              {t("settings.closeConfirm.cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
