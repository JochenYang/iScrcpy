import { useState, useEffect } from 'react'
import { electronAPI } from '../utils/electron'
import { Folder, Network, Info, Terminal } from 'lucide-react'

interface ServerSettings {
  tunnelMode: string
  cleanup: boolean
}

interface VersionInfo {
  scrcpy: string
  adb: string
  server: boolean
}

export default function ServerPage() {
  const [settings, setSettings] = useState<ServerSettings>({
    tunnelMode: 'reverse',
    cleanup: true,
  })
  const [scrcpyPath, setScrcpyPath] = useState('app/scrcpy.exe')
  const [adbPath, setAdbPath] = useState('app/adb.exe')
  const [versions, setVersions] = useState<VersionInfo>({ scrcpy: '', adb: '', server: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
    loadVersionInfo()
  }, [])

  const loadSettings = async () => {
    const result = await electronAPI.loadSettings()
    if (result.server) {
      setSettings((prev) => ({ ...prev, ...result.server }))
    }
  }

  const loadVersionInfo = async () => {
    const [scrcpy, adb] = await Promise.all([
      electronAPI.getVersion(),
      electronAPI.getAdbVersion(),
    ])
    setVersions({
      scrcpy: scrcpy.success ? scrcpy.version || '' : '',
      adb: adb.success ? adb.version || '' : '',
      server: true,
    })
  }

  const handleSave = async () => {
    setSaving(true)
    await electronAPI.saveSettings('server', settings)
    showToast('服务器设置已保存')
    setSaving(false)
  }

  const openScrcpyFolder = () => {
    electronAPI.openFolder('app/')
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
    <div className="content-wrapper">
      <div className="page-header">
        <h1>服务器配置</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Folder size={20} />
          程序路径
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>Scrcpy 路径</label>
            <div className="path-input">
              <input
                type="text"
                value={scrcpyPath}
                onChange={(e) => setScrcpyPath(e.target.value)}
                placeholder="app/scrcpy.exe"
              />
              <button className="btn btn-small" onClick={openScrcpyFolder}>
                浏览
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>ADB 路径</label>
            <div className="path-input">
              <input
                type="text"
                value={adbPath}
                onChange={(e) => setAdbPath(e.target.value)}
                placeholder="app/adb.exe"
              />
              <button className="btn btn-small" onClick={openScrcpyFolder}>
                浏览
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Network size={20} />
          连接设置
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>隧道模式</label>
            <select
              value={settings.tunnelMode}
              onChange={(e) => setSettings({ ...settings, tunnelMode: e.target.value })}
            >
              <option value="reverse">反向 (adb reverse)</option>
              <option value="forward">正向 (adb forward)</option>
              <option value="auto">自动选择</option>
            </select>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.cleanup}
              onChange={(e) => setSettings({ ...settings, cleanup: e.target.checked })}
            />
            <span className="checkmark" />
            断开后清理服务器
          </label>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <Info size={20} />
          版本信息
        </div>
        <div className="card-body">
          <div className="version-info">
            {versions.scrcpy && <span>scrcpy: {versions.scrcpy}</span>}
            {versions.adb && <span>ADB: {versions.adb}</span>}
            <span>服务器: {versions.server ? '已安装' : '未找到'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
