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

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Data', icon: Upload },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'alerts', label: 'Alerts', icon: BellRing },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'outputs', label: 'Outputs', icon: FileOutput },
]

// The 4 upload types — same order as the Upload page zones
const UPLOAD_KEYS = [
  { key: 'staff', color: '#4f7cff', label: 'Staff' },
  { key: 'sales', color: '#34d399', label: 'Sales' },
  { key: 'training', color: '#fbbf24', label: 'Training' },
  { key: 'knowledge', color: '#a78bfa', label: 'Knowledge' },
]

export default function Sidebar() {
  const activePage = useAppStore((s) => s.activePage)
  const setActivePage = useAppStore((s) => s.setActivePage)
  const uploadedData = useAppStore((s) => s.uploadedData)

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
                gap: 10,
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                marginBottom: 2,
                transition: 'background 0.15s',
                background: isActive ? 'var(--bg-hover)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 13.5,
                fontWeight: isActive ? 500 : 400,
                textAlign: 'left',
                fontFamily: 'inherit',
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

              {/* Upload status dots — always visible on the Upload Data row */}
              {id === 'upload' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {UPLOAD_KEYS.map(({ key, color, label: dotLabel }) => {
                    const loaded = uploadedData[key] !== null
                    return (
                      <div
                        key={key}
                        title={`${dotLabel}: ${loaded ? 'uploaded' : 'not uploaded'}`}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: loaded ? color : 'var(--text-muted)',
                          opacity: loaded ? 1 : 0.35,
                          transition: 'background 0.3s, opacity 0.3s',
                          flexShrink: 0,
                        }}
                      />
                    )
                  })}
                </div>
              )}

              {isActive && id !== 'upload' && (
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
          fontSize: 11,
        }}
      >
        TARA v2.0
      </div>
    </aside>
  )
}
