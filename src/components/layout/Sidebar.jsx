import {
  LayoutDashboard,
  Upload,
  BarChart3,
  BellRing,
  Bot,
  FileOutput,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Data', icon: Upload },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'alerts', label: 'Alerts', icon: BellRing },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'outputs', label: 'Outputs', icon: FileOutput },
]

export default function Sidebar() {
  const { activePage, setActivePage } = useAppStore()

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 'var(--topbar-height)',
        left: 0,
        bottom: 0,
        zIndex: 40,
        overflowY: 'auto',
      }}
    >
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                marginBottom: '2px',
                transition: 'background 0.15s, color 0.15s',
                background: isActive ? 'var(--bg-hover)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13.5px',
                fontWeight: isActive ? '500' : '400',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              <Icon
                size={16}
                style={{
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && (
                <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
              )}
            </button>
          )
        })}
      </nav>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          fontSize: '11px',
        }}
      >
        TARA v2.0
      </div>
    </aside>
  )
}
