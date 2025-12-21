import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { languages } from "../i18n";
import { Globe } from "lucide-react";
import { electronAPI } from "../utils/electron";

export default function TitleBar() {
  const { t, i18n } = useTranslation();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem("language", langCode);
    setShowLanguageMenu(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
    };

    if (showLanguageMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLanguageMenu]);

  const minimize = () => electronAPI.windowMinimize();
  const maximize = () => electronAPI.windowMaximize();
  const close = () => electronAPI.windowClose();

  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <img src="app/icon.png" alt="iScrcpy" className="app-icon" />
        <span className="app-name">iScrcpy</span>
      </div>
      <div className="titlebar-buttons">
        <div className="language-selector-titlebar" ref={menuRef}>
          <button
            className="language-btn-titlebar"
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            title={t("statusBar.language")}
          >
            <Globe size={14} />
            <span>{currentLanguage.nativeName}</span>
          </button>
          {showLanguageMenu && (
            <div className="language-menu-titlebar">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  className={`language-item ${
                    i18n.language === lang.code ? "active" : ""
                  }`}
                  onClick={() => changeLanguage(lang.code)}
                >
                  <span className="language-native">{lang.nativeName}</span>
                  <span className="language-name">{lang.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="titlebar-btn" onClick={minimize}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect y="5" width="12" height="2" fill="currentColor" />
          </svg>
        </button>
        <button className="titlebar-btn" onClick={maximize}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect
              x="1"
              y="1"
              width="10"
              height="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </button>
        <button className="titlebar-btn close-btn" onClick={close}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M1 1L11 11M1 11L11 1"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
