import { useState, useEffect } from 'react'
import { electronAPI } from '../utils/electron'
import { Video, Monitor, Settings2, VideoOff, Volume2, VolumeX, Layout, Maximize2, Zap, Clock } from 'lucide-react'

interface DisplaySettings {
  maxSize: number | 'custom'
  videoBitrate: number | 'custom'
  frameRate: number | 'custom'
  alwaysOnTop: boolean
  fullscreen: boolean
  stayAwake: boolean
  enableVideo: boolean
  enableAudio: boolean
}

export default function DisplayPage() {
  const [settings, setSettings] = useState<DisplaySettings>({
    maxSize: 1080,
    videoBitrate: 8,
    frameRate: 60,
    alwaysOnTop: false,
    fullscreen: false,
    stayAwake: false,
    enableVideo: true,
    enableAudio: true,
  })
  const [saving, setSaving] = useState(false)
  const [customMaxSize, setCustomMaxSize] = useState('')
  const [customBitrate, setCustomBitrate] = useState('')
  const [customFps, setCustomFps] = useState('')

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
    if (!settings.enableVideo) parts.push('--no-video')
    if (!settings.enableAudio) parts.push('--no-audio')
    const maxSize = typeof settings.maxSize === 'number' ? settings.maxSize : 0
    const bitrate = typeof settings.videoBitrate === 'number' ? settings.videoBitrate : 0
    const fps = typeof settings.frameRate === 'number' ? settings.frameRate : 0
    if (maxSize && maxSize !== 1920) parts.push(`--max-size=${maxSize}`)
    if (bitrate) parts.push(`--video-bit-rate=${bitrate}M`)
    if (fps && fps !== 60) parts.push(`--max-fps=${fps}`)
    if (settings.alwaysOnTop) parts.push('--always-on-top')
    if (settings.fullscreen) parts.push('--fullscreen')
    if (settings.stayAwake) parts.push('--stay-awake')
    return parts.join(' ')
  }

  const handleMaxSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === 'custom') {
      setSettings({ ...settings, maxSize: 'custom' })
    } else {
      setSettings({ ...settings, maxSize: parseInt(value) })
      setCustomMaxSize('')
    }
  }

  const handleVideoBitrateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === 'custom') {
      setSettings({ ...settings, videoBitrate: 'custom' })
    } else {
      setSettings({ ...settings, videoBitrate: parseInt(value) })
      setCustomBitrate('')
    }
  }

  const handleFrameRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === 'custom') {
      setSettings({ ...settings, frameRate: 'custom' })
    } else {
      setSettings({ ...settings, frameRate: parseInt(value) })
      setCustomFps('')
    }
  }

  const handleCustomMaxSizeBlur = () => {
    const value = parseInt(customMaxSize)
    if (value && value > 0 && value <= 7680) {
      setSettings({ ...settings, maxSize: value })
    } else if (customMaxSize === '') {
      // If input is empty, revert to default
      setSettings({ ...settings, maxSize: 1080 })
    }
  }

  const handleCustomBitrateBlur = () => {
    const value = parseInt(customBitrate)
    if (value && value > 0 && value <= 1000) {
      setSettings({ ...settings, videoBitrate: value })
    } else if (customBitrate === '') {
      setSettings({ ...settings, videoBitrate: 8 })
    }
  }

  const handleCustomFpsBlur = () => {
    const value = parseInt(customFps)
    if (value && value > 0 && value <= 1000) {
      setSettings({ ...settings, frameRate: value })
    } else if (customFps === '') {
      setSettings({ ...settings, frameRate: 60 })
    }
  }

  const getMaxSizeValue = () => {
    if (settings.maxSize === 'custom') return 'custom'
    return String(settings.maxSize)
  }

  const getBitrateValue = () => {
    if (settings.videoBitrate === 'custom') return 'custom'
    return String(settings.videoBitrate)
  }

  const getFpsValue = () => {
    if (settings.frameRate === 'custom') return 'custom'
    return String(settings.frameRate)
  }

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h1>投屏设置</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Video size={20} />
          视频设置
        </div>
        <div className="card-body">
          {/* 启用视频 */}
          <label className="toggle-item">
            <div className="toggle-item-left">
              {settings.enableVideo ? <Video size={18} /> : <VideoOff size={18} />}
              <span>启用视频</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.enableVideo}
                onChange={(e) => setSettings({ ...settings, enableVideo: e.target.checked })}
              />
              <span className="toggle-slider" />
            </div>
          </label>

          {/* 启用音频 */}
          <label className="toggle-item">
            <div className="toggle-item-left">
              {settings.enableAudio ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <span>启用音频</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.enableAudio}
                onChange={(e) => setSettings({ ...settings, enableAudio: e.target.checked })}
              />
              <span className="toggle-slider" />
            </div>
          </label>

          {/* 最大分辨率 */}
          <div className="form-group select-form-group">
            <label>
              <Maximize2 size={16} />
              最大分辨率
            </label>
            <select
              value={getMaxSizeValue()}
              onChange={handleMaxSizeChange}
            >
              <option value="480">480p</option>
              <option value="720">720p</option>
              <option value="1080">1080p</option>
              <option value="1440">1440p (2K)</option>
              <option value="2160">2160p (4K)</option>
              <option value="custom">自定义...</option>
            </select>
            {settings.maxSize === 'custom' && (
              <div className="custom-input-group">
                <input
                  type="number"
                  placeholder="输入分辨率，如 1920"
                  value={customMaxSize}
                  onChange={(e) => setCustomMaxSize(e.target.value)}
                  onBlur={handleCustomMaxSizeBlur}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomMaxSizeBlur()}
                />
                <span className="input-suffix">px</span>
              </div>
            )}
          </div>

          {/* 视频码率 */}
          <div className="form-group select-form-group">
            <label>
              <Zap size={16} />
              视频码率
            </label>
            <select
              value={getBitrateValue()}
              onChange={handleVideoBitrateChange}
            >
              <option value="1">1 Mbps</option>
              <option value="2">2 Mbps</option>
              <option value="4">4 Mbps</option>
              <option value="8">8 Mbps</option>
              <option value="16">16 Mbps</option>
              <option value="32">32 Mbps</option>
              <option value="custom">自定义...</option>
            </select>
            {settings.videoBitrate === 'custom' && (
              <div className="custom-input-group">
                <input
                  type="number"
                  placeholder="输入码率，如 10"
                  value={customBitrate}
                  onChange={(e) => setCustomBitrate(e.target.value)}
                  onBlur={handleCustomBitrateBlur}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomBitrateBlur()}
                />
                <span className="input-suffix">Mbps</span>
              </div>
            )}
          </div>

          {/* 帧率 */}
          <div className="form-group select-form-group">
            <label>
              <Clock size={16} />
              帧率
            </label>
            <select
              value={getFpsValue()}
              onChange={handleFrameRateChange}
            >
              <option value="30">30 fps</option>
              <option value="60">60 fps</option>
              <option value="90">90 fps</option>
              <option value="120">120 fps</option>
              <option value="144">144 fps</option>
              <option value="custom">自定义...</option>
            </select>
            {settings.frameRate === 'custom' && (
              <div className="custom-input-group">
                <input
                  type="number"
                  placeholder="输入帧率，如 90"
                  value={customFps}
                  onChange={(e) => setCustomFps(e.target.value)}
                  onBlur={handleCustomFpsBlur}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomFpsBlur()}
                />
                <span className="input-suffix">fps</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Monitor size={20} />
          窗口设置
        </div>
        <div className="card-body">
          <label className="toggle-item">
            <div className="toggle-item-left">
              <Layout size={18} />
              <span>始终在顶部</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.alwaysOnTop}
                onChange={(e) => setSettings({ ...settings, alwaysOnTop: e.target.checked })}
              />
              <span className="toggle-slider" />
            </div>
          </label>

          <label className="toggle-item">
            <div className="toggle-item-left">
              <Maximize2 size={18} />
              <span>全屏显示</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.fullscreen}
                onChange={(e) => setSettings({ ...settings, fullscreen: e.target.checked })}
              />
              <span className="toggle-slider" />
            </div>
          </label>

          <label className="toggle-item">
            <div className="toggle-item-left">
              <Clock size={18} />
              <span>保持屏幕常亮</span>
            </div>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.stayAwake}
                onChange={(e) => setSettings({ ...settings, stayAwake: e.target.checked })}
              />
              <span className="toggle-slider" />
            </div>
          </label>
        </div>
      </div>

      <div className="command-preview">
        <div className="preview-header">
          <Settings2 size={16} />
          命令预览
        </div>
        <code>{updateCommandPreview()}</code>
      </div>
    </div>
  )
}
