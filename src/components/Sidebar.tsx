import { useState, useEffect } from 'react'
import { TabType } from '../App'
import { Smartphone, Monitor, Code2, Server, Info, ChevronLeft, ChevronRight } from 'lucide-react'

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  // Initialize from localStorage, default to expanded (false)
  // If this is first run (no localStorage), default to expanded
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    // If never set before, default to expanded (false)
    if (saved === null) return false
    return saved === 'true'
  })

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  const navItems = [
    { id: 'devices' as TabType, label: '设备', icon: Smartphone },
    { id: 'display' as TabType, label: '投屏', icon: Monitor },
    { id: 'encoding' as TabType, label: '编码', icon: Code2 },
    { id: 'server' as TabType, label: '服务器', icon: Server },
    { id: 'about' as TabType, label: '关于', icon: Info },
  ]

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="nav-items-container">
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="nav-icon" size={20} />
            {!collapsed && <span>{item.label}</span>}
          </div>
        ))}
      </div>
      <button
        className="toggle-btn"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? '展开' : '收缩'}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  )
}
