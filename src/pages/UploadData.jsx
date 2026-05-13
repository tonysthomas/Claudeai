import { Users, TrendingUp, BookOpen, Brain, ArrowRight, CheckCircle2, Database } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import UploadZone from '@/components/upload/UploadZone'

// Zone definitions — icon, colour, required columns, description
const ZONES = [
  {
    key: 'staff',
    label: 'Staff List',
    description: 'Employee master data',
    icon: Users,
    color: '#4f7cff',
    required: ['employee_id'],
  },
  {
    key: 'sales',
    label: 'Sales Performance',
    description: 'Sales results by period',
    icon: TrendingUp,
    color: '#34d399',
    required: ['employee_id'],
  },
  {
    key: 'training',
    label: 'Training Frequency',
    description: 'Training session records',
    icon: BookOpen,
    color: '#fbbf24',
    required: ['employee_id'],
  },
  {
    key: 'knowledge',
    label: 'Knowledge Score',
    description: 'Assessment scores & status',
    icon: Brain,
    color: '#a78bfa',
    required: ['employee_id', 'score', 'status'],
  },
]

export default function UploadData() {
  const uploadedData = useAppStore((s) => s.uploadedData)
  const setActivePage = useAppStore((s) => s.setActivePage)

  const validCount = ZONES.filter((z) => uploadedData[z.key] !== null).length
  const allReady = validCount === 4
  const progressPct = (validCount / 4) * 100

  return (
    <div
      style={{
        padding: '32px 36px',
        maxWidth: 980,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={16} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.3px',
                }}
              >
                Upload Data
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, marginTop: 2 }}>
                {validCount === 0
                  ? 'Upload all 4 data files to begin analysis'
                  : validCount === 4
                  ? '4 of 4 files ready'
                  : `${validCount} of 4 files ready — ${4 - validCount} remaining`}
              </p>
            </div>
          </div>

          {/* Status dots — overview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
            {ZONES.map((z) => {
              const loaded = uploadedData[z.key] !== null
              return (
                <div
                  key={z.key}
                  title={z.label}
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: loaded ? z.color : 'var(--border)',
                    transition: 'background 0.4s',
                    boxShadow: loaded ? `0 0 6px ${z.color}80` : 'none',
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 3,
            background: 'var(--border-subtle)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: allReady
                ? 'var(--accent-success)'
                : 'linear-gradient(90deg, var(--accent-primary), #7c4fff)',
              borderRadius: 2,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* ── 2 × 2 upload grid ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}
      >
        {ZONES.map((config) => (
          <UploadZone key={config.key} config={config} />
        ))}
      </div>

      {/* ── All-ready banner ─────────────────────────────────────────────── */}
      {allReady && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '16px 20px',
            borderRadius: 12,
            border: '1px solid rgba(52,211,153,0.3)',
            background: 'rgba(52,211,153,0.05)',
            animation: 'tara-fadein 0.4s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(52,211,153,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={16} style={{ color: 'var(--accent-success)' }} />
            </div>
            <div>
              <p
                style={{
                  color: 'var(--accent-success)',
                  fontWeight: 600,
                  fontSize: 14,
                  lineHeight: 1.3,
                }}
              >
                All data loaded — ready to run categorisation
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                4 files validated · employee IDs normalised · structural zeros removed
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePage('analytics')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 18px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent-success)',
              color: '#0d1117',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: 'inherit',
              flexShrink: 0,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Go to Analytics
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
