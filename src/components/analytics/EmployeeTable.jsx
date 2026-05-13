import { useState, useMemo } from 'react'
import { Search, Download, ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle } from 'lucide-react'
import { CATEGORY_CONFIG, CATEGORY_ORDER } from './categoryConfig'

// ── CSV export ────────────────────────────────────────────────────────────────

function csvCell(v) {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

function exportCSV(employees, period) {
  const headers = ['Name', 'Employee ID', 'Store', 'Market', 'Category', 'Sales (AED)', 'Sessions', 'Avg Score', 'Flag']
  const rows = employees.map((e) =>
    [
      e.name,
      e.id,
      e.store,
      e.market,
      CATEGORY_CONFIG[e.category]?.label ?? e.category,
      e.salesVal.toFixed(2),
      e.sessions,
      e.avgScore.toFixed(1),
      e.flag?.paradox ? 'Learner Paradox — floor coaching required, do not prescribe more content' : '',
    ].map(csvCell),
  )

  const csv  = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `categorised_staff_${String(period ?? 'export').replace(/[^a-z0-9]/gi, '_')}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Tooltip (no dependency) ───────────────────────────────────────────────────

function Tooltip({ children, message }) {
  const [show, setShow] = useState(false)
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            padding: '9px 12px',
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            whiteSpace: 'normal',
            width: 270,
            zIndex: 200,
            boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
            pointerEvents: 'none',
          }}
        >
          <span style={{ color: 'var(--accent-warning)', fontWeight: 600, display: 'block', marginBottom: 3 }}>
            ⚠ Learner Paradox
          </span>
          {message}
        </div>
      )}
    </div>
  )
}

// ── Sort helpers ──────────────────────────────────────────────────────────────

const SORT_KEYS = {
  name:      { label: 'Name',          numeric: false },
  store:     { label: 'Store',         numeric: false },
  market:    { label: 'Market',        numeric: false },
  category:  { label: 'Category',      numeric: false },
  salesVal:  { label: 'Sales (AED)',   numeric: true  },
  sessions:  { label: 'Sessions',      numeric: true  },
  avgScore:  { label: 'Avg Score',     numeric: true  },
}

function sortRows(rows, key, dir) {
  return [...rows].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    let cmp
    if (SORT_KEYS[key]?.numeric) {
      cmp = Number(av) - Number(bv)
    } else {
      cmp = String(av ?? '').localeCompare(String(bv ?? ''))
    }
    return dir === 'desc' ? -cmp : cmp
  })
}

function SortIcon({ colKey, sortKey, sortDir }) {
  if (colKey !== sortKey) return <ChevronsUpDown size={12} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
  return sortDir === 'asc'
    ? <ChevronUp   size={12} style={{ color: 'var(--accent-primary)' }} />
    : <ChevronDown size={12} style={{ color: 'var(--accent-primary)' }} />
}

// ── Category badge ────────────────────────────────────────────────────────────

function CategoryBadge({ category }) {
  const cfg = CATEGORY_CONFIG[category]
  if (!cfg) return null
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 9px',
        borderRadius: 5,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontSize: 11.5,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.emoji} {cfg.label}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EmployeeTable({ employees, activeCategory, period }) {
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [search, setSearch]   = useState('')
  const [market, setMarket]   = useState('all')

  const uniqueMarkets = useMemo(() => {
    const s = new Set(employees.map((e) => e.market).filter((m) => m && m !== '—'))
    return [...s].sort()
  }, [employees])

  // Filter + sort pipeline
  const displayed = useMemo(() => {
    let rows = employees
    if (activeCategory) rows = rows.filter((e) => e.category === activeCategory)
    if (market !== 'all') rows = rows.filter((e) => e.market === market)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter(
        (e) => e.name.toLowerCase().includes(q) || e.store.toLowerCase().includes(q),
      )
    }
    return sortRows(rows, sortKey, sortDir)
  }, [employees, activeCategory, market, search, sortKey, sortDir])

  const handleSort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const thStyle = (key) => ({
    padding: '9px 14px',
    textAlign: key === 'salesVal' || key === 'sessions' || key === 'avgScore' ? 'right' : 'left',
    color: 'var(--text-muted)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    background: 'var(--bg-elevated)',
    borderBottom: '1px solid var(--border)',
  })

  const tdStyle = (align = 'left') => ({
    padding: '10px 14px',
    color: 'var(--text-secondary)',
    fontSize: 13,
    textAlign: align,
    borderBottom: '1px solid var(--border-subtle)',
    verticalAlign: 'middle',
  })

  return (
    <div>
      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search name or store…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 30,
              paddingRight: 10,
              paddingTop: 7,
              paddingBottom: 7,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 7,
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>

        {/* Market filter */}
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          style={{
            padding: '7px 10px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'inherit',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">All markets</option>
          {uniqueMarkets.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Row count */}
        <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 'auto' }}>
          {displayed.length} {displayed.length === 1 ? 'employee' : 'employees'}
        </span>

        {/* Export */}
        <button
          onClick={() => exportCSV(displayed, period)}
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
            fontWeight: 500,
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)'
            e.currentTarget.style.color = 'var(--accent-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                {Object.entries(SORT_KEYS).map(([key, meta]) => (
                  <th
                    key={key}
                    style={thStyle(key)}
                    onClick={() => handleSort(key)}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {meta.label}
                      <SortIcon colKey={key} sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
                {/* Flag column — not sortable */}
                <th style={{ ...thStyle('flag'), cursor: 'default' }}>Flag</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: '32px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                    }}
                  >
                    No employees match the current filters.
                  </td>
                </tr>
              ) : (
                displayed.map((e) => (
                  <tr
                    key={e.id}
                    style={{ transition: 'background 0.1s' }}
                    onMouseEnter={(ev) => (ev.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(ev) => (ev.currentTarget.style.background = 'transparent')}
                  >
                    <td style={tdStyle()}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{e.name}</span>
                    </td>
                    <td style={tdStyle()}>{e.store}</td>
                    <td style={tdStyle()}>{e.market}</td>
                    <td style={tdStyle()}>
                      <CategoryBadge category={e.category} />
                    </td>
                    <td style={tdStyle('right')}>
                      {e.salesVal > 0
                        ? e.salesVal.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                        : '—'}
                    </td>
                    <td style={tdStyle('right')}>
                      {e.category === 'MISSING_DATA' ? '—' : e.sessions}
                    </td>
                    <td style={tdStyle('right')}>
                      {e.category === 'MISSING_DATA' ? '—' : e.avgScore.toFixed(1)}
                    </td>
                    <td style={tdStyle('center')}>
                      {e.flag?.paradox ? (
                        <Tooltip message={e.flag.message}>
                          <AlertTriangle
                            size={15}
                            style={{ color: 'var(--accent-warning)', cursor: 'help' }}
                          />
                        </Tooltip>
                      ) : (
                        <span style={{ color: 'var(--border)', fontSize: 11 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          marginTop: 10,
          paddingLeft: 2,
        }}
      >
        {CATEGORY_ORDER.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat]
          return (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 12 }}>{cfg.emoji}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cfg.label}</span>
            </div>
          )
        })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8 }}>
          <AlertTriangle size={11} style={{ color: 'var(--accent-warning)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Learner Paradox flag</span>
        </div>
      </div>
    </div>
  )
}
