import { useState, useEffect } from "react";
import TitleBar from "./components/TitleBar";
import Sidebar from "./components/Sidebar";
import DevicePage from "./pages/DevicePage";
import DisplayPage from "./pages/DisplayPage";
import EncodingPage from "./pages/EncodingPage";
import ServerPage from "./pages/ServerPage";
import LogsPage from "./pages/LogsPage";
import AboutPage from "./pages/AboutPage";
import CloseConfirmDialog from "./components/CloseConfirmDialog";
import { electronAPI } from "./utils/electron";
import "./i18n"; // Initialize i18n

export type TabType = "devices" | "display" | "encoding" | "server" | "settings" | "about";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("devices");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  useEffect(() => {
    // Listen for close confirmation request from main process
    electronAPI.onShowCloseConfirm(() => {
      setShowCloseConfirm(true);
    });

    return () => {
      electronAPI.removeCloseConfirmListener();
    };
  }, []);

  const handleCloseConfirm = (minimizeToTray: boolean) => {
    setShowCloseConfirm(false);
    if (minimizeToTray) {
      electronAPI.sendCloseConfirmResult({ minimizeToTray: true });
    }
    // If minimizeToTray is false (cancel), just close the dialog without sending result
  };

  const renderContent = () => {
    switch (activeTab) {
      case "devices":
        return <DevicePage />;
      case "display":
        return <DisplayPage />;
      case "encoding":
        return <EncodingPage />;
      case "server":
        return <ServerPage />;
      case "settings":
        return <LogsPage />;
      case "about":
        return <AboutPage />;
      default:
        return <DevicePage />;
    }
  };

  return (
    <div className="app">
      <TitleBar />
      <div className="app-container">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="main-content">{renderContent()}</main>
      </div>
      <CloseConfirmDialog
        open={showCloseConfirm}
        onClose={() => handleCloseConfirm(false)}
        onMinimizeToTray={() => handleCloseConfirm(true)}
        onQuit={() => handleCloseConfirm(false)}
      />
    </div>
  );
}

export default App;
