import { electronAPI } from '../utils/electron'
import { Github, HelpCircle, ExternalLink } from 'lucide-react'

export default function AboutPage() {
  const openExternal = (url: string) => {
    electronAPI.openExternal(url)
  }

  return (
    <div className="content-wrapper about-page">
      <div className="page-header">
        <h1>关于</h1>
      </div>

      <div className="about-container">
        <div className="about-logo">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="12" width="48" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
            <circle cx="32" cy="30" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M20 52h24M26 58h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h2>iScrcpy</h2>
          <p className="version">基于 scrcpy 3.3.4</p>
          <p className="author">作者: Jochenyang</p>
        </div>

        <div className="settings-card">
          <div className="card-header">
            <Github size={20} />
            开源信息
          </div>
          <div className="card-body">
            <p className="description">
              iScrcpy 是一个基于 scrcpy 的 Android 设备投屏工具，支持 USB 和 WiFi 连接。
            </p>
            <div className="github-links">
              <button className="github-link-btn" onClick={() => openExternal('https://github.com/JochenYang/iScrcpy')}>
                <Github size={18} />
                <span>iScrcpy</span>
                <ExternalLink size={14} className="external-link-icon" />
              </button>
              <button className="github-link-btn" onClick={() => openExternal('https://github.com/Genymobile/scrcpy')}>
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
            使用说明
          </div>
          <div className="card-body">
            <ul className="help-list">
              <li>连接 Android 设备 via USB 或 WiFi</li>
              <li>点击设备旁的投屏按钮开始镜像</li>
              <li>在设置页面调整画质和窗口选项</li>
              <li>设备会自动保存到历史记录</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
