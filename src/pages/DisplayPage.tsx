import { useState, useEffect } from 'react'
import { electronAPI } from '../utils/electron'

interface DisplaySettings {
  maxSize: number
  videoBitrate: number
  frameRate: number
  alwaysOnTop: boolean
  fullscreen: boolean
  stayAwake: boolean
}

export default function DisplayPage() {
  const [settings, setSettings] = useState<DisplaySettings>({
    maxSize: 1080,
    videoBitrate: 8,
    frameRate: 60,
    alwaysOnTop: false,
    fullscreen: false,
    stayAwake: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const result = await electronAPI.loadSettings()
    if (result.display) {
      setSettings((prev) => ({ ...prev, ...result.display }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await electronAPI.saveSettings('display', settings)
    showToast('投屏设置已保存')
    setSaving(false)
  }

  const showToast = (message: string) => {
    const toast = document.createElement('div')
    toast.className = 'toast'
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.classList.add('fade-out')
      setTimeout(() => toast.remove(), 300)
    }, 2000)
  }

  const updateCommandPreview = () => {
    const parts = ['scrcpy']
    if (settings.maxSize && settings.maxSize !== 1920) parts.push(`--max-size=${settings.maxSize}`)
    if (settings.videoBitrate) parts.push(`--video-bitrate=${settings.videoBitrate}M`)
    if (settings.frameRate && settings.frameRate !== 60) parts.push(`--frame-rate=${settings.frameRate}`)
    if (settings.alwaysOnTop) parts.push('--always-on-top')
    if (settings.fullscreen) parts.push('--fullscreen')
    if (settings.stayAwake) parts.push('--stay-awake')
    return parts.join(' ')
  }

  return (
    <div>
      <div className="page-header">
        <h1>投屏设置</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect x="2" y="3" width="16" height="12" rx="1" />
          </svg>
          视频设置
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>最大分辨率</label>
            <select
              value={settings.maxSize}
              onChange={(e) => setSettings({ ...settings, maxSize: parseInt(e.target.value) })}
            >
              <option value="480">480p</option>
              <option value="720">720p</option>
              <option value="1080">1080p</option>
              <option value="1440">1440p</option>
              <option value="2160">2160p</option>
            </select>
          </div>
          <div className="form-group">
            <label>视频码率 (Mbps)</label>
            <select
              value={settings.videoBitrate}
              onChange={(e) => setSettings({ ...settings, videoBitrate: parseInt(e.target.value) })}
            >
              <option value="1">1 Mbps</option>
              <option value="2">2 Mbps</option>
              <option value="4">4 Mbps</option>
              <option value="8">8 Mbps</option>
              <option value="16">16 Mbps</option>
              <option value="32">32 Mbps</option>
            </select>
          </div>
          <div className="form-group">
            <label>帧率 (fps)</label>
            <select
              value={settings.frameRate}
              onChange={(e) => setSettings({ ...settings, frameRate: parseInt(e.target.value) })}
            >
              <option value="30">30 fps</option>
              <option value="60">60 fps</option>
              <option value="90">90 fps</option>
              <option value="120">120 fps</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect x="3" y="2" width="14" height="16" rx="2" />
          </svg>
          窗口设置
        </div>
        <div className="card-body">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.alwaysOnTop}
              onChange={(e) => setSettings({ ...settings, alwaysOnTop: e.target.checked })}
            />
            <span className="checkmark" />
            始终在顶部
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.fullscreen}
              onChange={(e) => setSettings({ ...settings, fullscreen: e.target.checked })}
            />
            <span className="checkmark" />
            全屏显示
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.stayAwake}
              onChange={(e) => setSettings({ ...settings, stayAwake: e.target.checked })}
            />
            <span className="checkmark" />
            保持屏幕常亮
          </label>
        </div>
      </div>

      <div className="command-preview">
        <div className="preview-header">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 4l8 4-8 4V4z" />
          </svg>
          命令预览
        </div>
        <code>{updateCommandPreview()}</code>
      </div>
    </div>
  )
}
