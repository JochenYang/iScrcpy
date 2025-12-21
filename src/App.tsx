import { useState } from 'react'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import DevicePage from './pages/DevicePage'
import DisplayPage from './pages/DisplayPage'
import EncodingPage from './pages/EncodingPage'
import ServerPage from './pages/ServerPage'
import AboutPage from './pages/AboutPage'

export type TabType = 'devices' | 'display' | 'encoding' | 'server' | 'about'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('devices')

  const renderContent = () => {
    switch (activeTab) {
      case 'devices':
        return <DevicePage />
      case 'display':
        return <DisplayPage />
      case 'encoding':
        return <EncodingPage />
      case 'server':
        return <ServerPage />
      case 'about':
        return <AboutPage />
      default:
        return <DevicePage />
    }
  }

  return (
    <div className="app">
      <TitleBar />
      <div className="app-container">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default App
