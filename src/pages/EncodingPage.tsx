import { useState, useEffect } from 'react'
import { electronAPI } from '../utils/electron'

interface EncodingSettings {
  videoCodec: string
  audioCodec: string
  bitrateMode: string
}

export default function EncodingPage() {
  const [settings, setSettings] = useState<EncodingSettings>({
    videoCodec: 'h264',
    audioCodec: 'opus',
    bitrateMode: 'vbr',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const result = await electronAPI.loadSettings()
    if (result.encoding) {
      setSettings((prev) => ({ ...prev, ...result.encoding }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await electronAPI.saveSettings('encoding', settings)
    showToast('编码设置已保存')
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

  return (
    <div>
      <div className="page-header">
        <h1>编码设置</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4l12 6-4 2-4-4-4 4-4-2 12-6z" />
          </svg>
          视频编码
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>视频编码</label>
            <select
              value={settings.videoCodec}
              onChange={(e) => setSettings({ ...settings, videoCodec: e.target.value })}
            >
              <option value="h264">H.264</option>
              <option value="h265">H.265</option>
              <option value="av1">AV1</option>
            </select>
          </div>
          <div className="form-group">
            <label>码率模式</label>
            <select
              value={settings.bitrateMode}
              onChange={(e) => setSettings({ ...settings, bitrateMode: e.target.value })}
            >
              <option value="vbr">VBR (可变码率)</option>
              <option value="cbr">CBR (恒定码率)</option>
              <option value="cq">CQ (质量优先)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 8v4h12V8H4zm0-2h12v2H4V6z" />
          </svg>
          音频编码
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>音频编码</label>
            <select
              value={settings.audioCodec}
              onChange={(e) => setSettings({ ...settings, audioCodec: e.target.value })}
            >
              <option value="opus">Opus</option>
              <option value="aac">AAC</option>
              <option value="raw">RAW</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
