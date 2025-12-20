import { electronAPI } from '../utils/electron'

export default function TitleBar() {
  const minimize = () => electronAPI.windowMinimize()
  const maximize = () => electronAPI.windowMaximize()
  const close = () => electronAPI.windowClose()

  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <img src="app/icon.png" alt="iScrcpy" className="app-icon" />
        <span className="app-name">iScrcpy</span>
      </div>
      <div className="titlebar-buttons">
        <button className="titlebar-btn" onClick={minimize}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect y="5" width="12" height="2" fill="currentColor" />
          </svg>
        </button>
        <button className="titlebar-btn" onClick={maximize}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
        <button className="titlebar-btn close-btn" onClick={close}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
