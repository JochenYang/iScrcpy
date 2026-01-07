import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import language files
import zhCN from "./locales/zh-CN.json";
import enUS from "./locales/en-US.json";
import jaJP from "./locales/ja-JP.json";
import koKR from "./locales/ko-KR.json";
import esES from "./locales/es-ES.json";
import frFR from "./locales/fr-FR.json";
import trTR from "./locales/tr-TR.json";

// Language resources
const resources = {
  "zh-CN": { translation: zhCN },
  "en-US": { translation: enUS },
  "ja-JP": { translation: jaJP },
  "ko-KR": { translation: koKR },
  "es-ES": { translation: esES },
  "fr-FR": { translation: frFR },
  "tr-TR": { translation: trTR },
};

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "zh-CN",
    lng: localStorage.getItem("language") || "zh-CN",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;

// Export language list for language selector
export const languages = [
  { code: "zh-CN", name: "简体中文", nativeName: "简体中文" },
  { code: "en-US", name: "English", nativeName: "English" },
  { code: "ja-JP", name: "Japanese", nativeName: "日本語" },
  { code: "ko-KR", name: "Korean", nativeName: "한국어" },
  { code: "es-ES", name: "Spanish", nativeName: "Español" },
  { code: "fr-FR", name: "French", nativeName: "Français" },
  { code: "tr-TR", name: "Turkish", nativeName: "Türkçe" },
];
