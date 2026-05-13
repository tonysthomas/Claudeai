export default function Placeholder({ icon: Icon, title, description }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '16px',
        padding: '48px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '14px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={24} style={{ color: 'var(--accent-primary)' }} />
      </div>
      <div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600', marginBottom: '6px' }}>
          {title}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', maxWidth: '360px', lineHeight: '1.6' }}>
          {description}
        </p>
      </div>
      <div
        style={{
          marginTop: '8px',
          padding: '6px 14px',
          borderRadius: '6px',
          border: '1px dashed var(--border)',
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}
      >
        Session 1 — Scaffold placeholder
      </div>
    </div>
  )
}
