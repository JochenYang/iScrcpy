import { TabType } from '../App'

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems = [
    { id: 'devices' as TabType, label: '设备', icon: DevicesIcon },
    { id: 'display' as TabType, label: '投屏', icon: DisplayIcon },
    { id: 'encoding' as TabType, label: '编码', icon: EncodingIcon },
    { id: 'server' as TabType, label: '服务器', icon: ServerIcon },
  ]

  return (
    <nav className="sidebar">
      {navItems.map((item) => (
        <div
          key={item.id}
          className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => onTabChange(item.id)}
        >
          <item.icon />
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  )
}

function DevicesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 6h12v8H4V6zm2 2v4h8V8H6zM4 16h12v2H4v-2z" />
    </svg>
  )
}

function DisplayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="3" width="16" height="12" rx="1" />
      <path d="M2 17h16v1H2z" />
    </svg>
  )
}

function EncodingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 4l12 6-4 2-4-4-4 4-4-2 12-6z" />
    </svg>
  )
}

function ServerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <rect x="3" y="2" width="14" height="16" rx="2" />
      <line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="10" cy="12" r="2" fill="currentColor" />
    </svg>
  )
}
