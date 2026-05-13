import { Activity, ChevronDown, Circle } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '@/store/appStore'

const PERIODS = [
  'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024',
  'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025',
  'FY 2024', 'FY 2025',
]

const AGENT_LABELS = {
  dataAgent: 'Data',
  analyticsAgent: 'Analytics',
  alertAgent: 'Alert',
  reportAgent: 'Report',
}

const STATUS_COLORS = {
  idle: 'var(--text-muted)',
  running: 'var(--accent-primary)',
  done: 'var(--accent-success)',
  error: 'var(--accent-danger)',
}

export default function TopBar() {
  const { orgName, selectedPeriod, setSelectedPeriod, agentStatus } = useAppStore()
  const [periodOpen, setPeriodOpen] = useState(false)

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--topbar-height)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '16px',
        zIndex: 50,
      }}
    >
      {/* Logo + brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'var(--sidebar-width)', paddingLeft: '4px' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Activity size={14} color="#fff" />
        </div>
        <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          TARA
        </span>
      </div>

      {/* Org name */}
      <span
        style={{
          color: 'var(--text-secondary)',
          fontSize: '13px',
          flex: 1,
          paddingLeft: '8px',
          borderLeft: '1px solid var(--border-subtle)',
        }}
      >
        {orgName}
      </span>

      {/* Agent status indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {Object.entries(AGENT_LABELS).map(([key, label]) => {
          const status = agentStatus[key]
          const color = STATUS_COLORS[status] || STATUS_COLORS.idle
          return (
            <div
              key={key}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              title={`${label} Agent: ${status}`}
            >
              <Circle
                size={7}
                fill={color}
                style={{
                  color,
                  animation: status === 'running' ? 'pulse 1.5s infinite' : 'none',
                }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>{label}</span>
            </div>
          )
        })}
      </div>

      {/* Period selector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setPeriodOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
          }}
        >
          {selectedPeriod}
          <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
        </button>

        {periodOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '4px',
              minWidth: '130px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              zIndex: 100,
            }}
          >
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => { setSelectedPeriod(p); setPeriodOpen(false) }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  background: p === selectedPeriod ? 'var(--bg-hover)' : 'transparent',
                  color: p === selectedPeriod ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = p === selectedPeriod ? 'var(--bg-hover)' : 'transparent' }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
