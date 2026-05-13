import { useEffect, useState } from 'react'
import { BarChart3, Upload, RefreshCw, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { runCategorisation } from '@/utils/categorise'
import CategoryCards from '@/components/analytics/CategoryCards'
import EmployeeTable from '@/components/analytics/EmployeeTable'

// ── Constants ─────────────────────────────────────────────────────────────────

const FILE_LABELS = {
  staff:     'Staff List',
  sales:     'Sales Performance',
  training:  'Training Frequency',
  knowledge: 'Knowledge Score',
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  const box = (w, h = 16, mt = 0) => (
    <div className="shimmer" style={{ width: w, height: h, marginTop: mt, borderRadius: 6 }} />
  )

  return (
    <div style={{ animation: 'tara-fadein 0.3s ease' }}>
      {/* Category card skeletons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '14px',
            }}
          >
            {box('60%', 12)}
            {box('40px', 28, 10)}
            {box('50%', 10, 6)}
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '16px',
        }}
      >
        {/* Controls row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {box('220px', 32)}
          {box('130px', 32)}
          {box('90px', 32, 0)}
        </div>
        {/* Header */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
          {['18%','12%','12%','14%','10%','8%','9%','7%'].map((w, i) => (
            <div key={i} className="shimmer" style={{ width: w, height: 10, borderRadius: 4 }} />
          ))}
        </div>
        {/* Rows */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}
          >
            {['18%','12%','12%','14%','10%','8%','9%','7%'].map((w, j) => (
              <div key={j} className="shimmer" style={{ width: w, height: 12, borderRadius: 4, opacity: 1 - i * 0.09 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Missing files banner ──────────────────────────────────────────────────────

function MissingBanner({ missing, onGoToUpload }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        textAlign: 'center',
        maxWidth: 480,
        margin: '0 auto',
        marginTop: 40,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 11,
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertCircle size={20} style={{ color: 'var(--accent-danger)' }} />
      </div>

      <div>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
          Data required before categorisation
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
          The following {missing.length === 1 ? 'file is' : 'files are'} missing:
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        {missing.map((label) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 7,
              background: 'rgba(248,113,113,0.06)',
              border: '1px solid rgba(248,113,113,0.18)',
            }}
          >
            <div
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-danger)', flexShrink: 0 }}
            />
            <span style={{ color: 'var(--accent-danger)', fontSize: 13 }}>{label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onGoToUpload}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '9px 18px',
          borderRadius: 8,
          border: 'none',
          background: 'var(--accent-primary)',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
          fontFamily: 'inherit',
          marginTop: 4,
        }}
      >
        <Upload size={13} />
        Go to Upload Data
      </button>
    </div>
  )
}

// ── Page header ───────────────────────────────────────────────────────────────

function PageHeader({ onRerun, hasResults }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
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
          <BarChart3 size={16} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, marginTop: 2 }}>
            ATLAS categorisation engine — FROZEN employee categories
          </p>
        </div>
      </div>

      {hasResults && (
        <button
          onClick={onRerun}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 13px',
            borderRadius: 7,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 12.5,
            fontFamily: 'inherit',
          }}
          title="Re-run categorisation"
        >
          <RefreshCw size={12} />
          Re-run
        </button>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Analytics() {
  const uploadedData   = useAppStore((s) => s.uploadedData)
  const uploadedMeta   = useAppStore((s) => s.uploadedMeta)
  const selectedPeriod = useAppStore((s) => s.selectedPeriod)
  const setActivePage  = useAppStore((s) => s.setActivePage)

  const [results, setResults]               = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [runKey, setRunKey]                 = useState(0)   // increment to force re-run

  const { staff, sales, training, knowledge } = uploadedData

  const missing = Object.entries(FILE_LABELS)
    .filter(([key]) => !uploadedData[key])
    .map(([, label]) => label)
  const allReady = missing.length === 0

  // Derived: show skeleton whenever all files are ready but results haven't arrived yet
  const loading = allReady && results === null

  // Auto-run when all files are present, or when runKey changes.
  // All state mutations happen inside callbacks or the cleanup — never synchronously
  // in the effect body — to satisfy the react-hooks/set-state-in-effect rule.
  useEffect(() => {
    if (!allReady) return

    // setTimeout gives React a frame to paint the skeleton before categorisation runs
    const t = setTimeout(() => {
      try {
        setResults(runCategorisation(staff, sales, training, knowledge))
        setActiveCategory(null)
      } catch {
        setResults([])
      }
    }, 60)

    // Cleanup: cancel in-flight timer and clear stale results so the skeleton shows
    return () => {
      clearTimeout(t)
      setResults(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff, sales, training, knowledge, runKey])

  // Detect best period string for the export filename
  const period =
    uploadedMeta.knowledge?.period ||
    uploadedMeta.staff?.period     ||
    selectedPeriod                 ||
    'export'

  const handleCategoryClick = (cat) =>
    setActiveCategory((prev) => (prev === cat ? null : cat))

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, width: '100%' }}>
      <PageHeader hasResults={!!results} onRerun={() => setRunKey((k) => k + 1)} />

      {!allReady && (
        <MissingBanner missing={missing} onGoToUpload={() => setActivePage('upload')} />
      )}

      {loading && <Skeleton />}

      {results && (
        <div style={{ animation: 'tara-fadein 0.35s ease' }}>
          <CategoryCards
            results={results}
            activeCategory={activeCategory}
            onCategoryClick={handleCategoryClick}
          />
          <EmployeeTable
            employees={results}
            activeCategory={activeCategory}
            period={period}
          />
        </div>
      )}
    </div>
  )
}
