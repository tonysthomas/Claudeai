import { CATEGORY_CONFIG, CATEGORY_ORDER } from './categoryConfig'

export default function CategoryCards({ results, activeCategory, onCategoryClick }) {
  const total = results.length

  const counts = {}
  for (const cat of CATEGORY_ORDER) counts[cat] = 0
  for (const e of results) {
    if (counts[e.category] !== undefined) counts[e.category]++
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 10,
        marginBottom: 20,
      }}
    >
      {CATEGORY_ORDER.map((cat) => {
        const cfg     = CATEGORY_CONFIG[cat]
        const count   = counts[cat]
        const pct     = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
        const active  = activeCategory === cat
        const dimmed  = activeCategory !== null && !active

        return (
          <button
            key={cat}
            onClick={() => onCategoryClick(cat)}
            style={{
              background: active ? cfg.bg : 'var(--bg-surface)',
              border: `1px solid ${active ? cfg.border : 'var(--border)'}`,
              borderRadius: 10,
              padding: '14px 14px 12px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.18s',
              opacity: dimmed ? 0.45 : 1,
              outline: 'none',
              fontFamily: 'inherit',
              transform: active ? 'translateY(-1px)' : 'none',
              boxShadow: active ? `0 4px 16px ${cfg.color}22` : 'none',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.borderColor = cfg.border
                e.currentTarget.style.background = cfg.bg
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'var(--bg-surface)'
              }
            }}
            title={active ? `Click to clear filter` : `Filter by ${cfg.label}`}
          >
            {/* Emoji + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 15 }}>{cfg.emoji}</span>
              <span
                style={{
                  color: active ? cfg.color : 'var(--text-secondary)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                {cfg.label}
              </span>
            </div>

            {/* Count */}
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: active ? cfg.color : 'var(--text-primary)',
                lineHeight: 1,
                marginBottom: 4,
                letterSpacing: '-0.5px',
              }}
            >
              {count}
            </div>

            {/* Percentage */}
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{pct}% of staff</div>

            {/* Active filter indicator */}
            {active && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 10.5,
                  color: cfg.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                ✕ Clear filter
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
