import { useState, useRef, useCallback } from 'react'
import {
  Upload,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileText,
  Calendar,
  Hash,
  AlertCircle,
} from 'lucide-react'
import { parseFile } from '@/utils/parseFile'
import { useAppStore } from '@/store/appStore'

// ── Styles ────────────────────────────────────────────────────────────────────

const base = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '20px',
  minHeight: 200,
  display: 'flex',
  flexDirection: 'column',
  transition: 'border-color 0.2s, background 0.2s',
}

const btnSecondary = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: 11,
  fontFamily: 'inherit',
}

const periodInput = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 5,
  padding: '3px 8px',
  color: 'var(--text-primary)',
  fontSize: 12,
  width: 170,
  outline: 'none',
  fontFamily: 'inherit',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ZoneHeader({ config }) {
  const Icon = config.icon
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          background: `${config.color}1f`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={14} style={{ color: config.color }} />
      </div>
      <div>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>
          {config.label}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>{config.description}</p>
      </div>
    </div>
  )
}

function MetaChip({ icon: Icon, label, accent }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 8px',
        borderRadius: 5,
        background: accent ? 'rgba(52,211,153,0.08)' : 'var(--bg-elevated)',
        border: `1px solid ${accent ? 'rgba(52,211,153,0.2)' : 'var(--border)'}`,
      }}
    >
      <Icon size={11} style={{ color: accent ? 'var(--accent-success)' : 'var(--text-muted)' }} />
      <span
        style={{
          color: accent ? 'var(--accent-success)' : 'var(--text-secondary)',
          fontSize: 11,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  )
}

function Spinner() {
  return (
    <div
      style={{
        width: 22,
        height: 22,
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent-primary)',
        borderRadius: '50%',
        animation: 'tara-spin 0.7s linear infinite',
      }}
    />
  )
}

function formatTime(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UploadZone({ config }) {
  const [dragOver, setDragOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [manualPeriod, setManualPeriod] = useState('')
  const fileInputRef = useRef()

  const setUploadedData = useAppStore((s) => s.setUploadedData)
  const clearUploadedData = useAppStore((s) => s.clearUploadedData)

  // ── File processing ─────────────────────────────────────────────────────────

  const processFile = useCallback(
    async (file) => {
      if (!file) return
      const ext = file.name.split('.').pop().toLowerCase()
      if (!['csv', 'xlsx', 'xls'].includes(ext)) {
        setResult({
          status: 'invalid',
          fileName: file.name,
          errors: [`Unsupported format .${ext} — use .csv or .xlsx`],
        })
        return
      }

      setProcessing(true)
      setResult(null)

      try {
        const parsed = await parseFile(file)
        const uploadedAt = new Date()

        if (parsed.valid) {
          const meta = {
            fileName: file.name,
            rowCount: parsed.rowCount,
            period: parsed.period ?? null,
            uploadedAt: uploadedAt.toISOString(),
            columns: parsed.columns,
          }
          setUploadedData(config.key, parsed.data, meta)
          setManualPeriod('')
          setResult({ status: 'valid', ...parsed, fileName: file.name, uploadedAt })
        } else {
          clearUploadedData(config.key)
          setResult({
            status: 'invalid',
            fileName: file.name,
            errors: parsed.errors,
            missingColumns: parsed.missingColumns,
          })
        }
      } catch (err) {
        clearUploadedData(config.key)
        setResult({ status: 'invalid', fileName: file.name, errors: [err.message] })
      } finally {
        setProcessing(false)
      }
    },
    [config, setUploadedData, clearUploadedData],
  )

  // ── Event handlers ──────────────────────────────────────────────────────────

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      processFile(e.dataTransfer.files[0])
    },
    [processFile],
  )

  const onDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const onDragLeave = (e) => {
    // Only clear if leaving the zone entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false)
  }

  const onFileChange = (e) => {
    processFile(e.target.files[0])
    e.target.value = ''
  }

  const handleReplace = () => {
    setResult(null)
    setManualPeriod('')
    clearUploadedData(config.key)
  }

  const handleManualPeriod = (val) => {
    setManualPeriod(val)
    // Keep Zustand meta in sync
    const state = useAppStore.getState()
    const data = state.uploadedData[config.key]
    const meta = state.uploadedMeta[config.key]
    if (data && meta) {
      setUploadedData(config.key, data, { ...meta, period: val || null })
    }
  }

  // ── Render states ───────────────────────────────────────────────────────────

  // 1. Processing
  if (processing) {
    return (
      <div style={base}>
        <ZoneHeader config={config} />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <Spinner />
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Parsing file…</span>
        </div>
      </div>
    )
  }

  // 2. Valid — confirmation card
  if (result?.status === 'valid') {
    return (
      <div style={{ ...base, borderColor: 'rgba(52,211,153,0.35)' }}>
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <CheckCircle2 size={15} style={{ color: 'var(--accent-success)' }} />
            <span
              style={{
                color: 'var(--accent-success)',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Ready
            </span>
          </div>
          <button onClick={handleReplace} style={btnSecondary}>
            <RotateCcw size={11} />
            Replace file
          </button>
        </div>

        {/* File name */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
          <FileText size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
          <span
            style={{
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 500,
              wordBreak: 'break-all',
              lineHeight: 1.4,
            }}
          >
            {result.fileName}
          </span>
        </div>

        {/* Row count + period */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <MetaChip icon={Hash} label={`${result.rowCount.toLocaleString()} rows`} />
          {result.period ? (
            <MetaChip icon={Calendar} label={result.period} accent />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Enter period (e.g. Q1 2025)"
                value={manualPeriod}
                onChange={(e) => handleManualPeriod(e.target.value)}
                style={periodInput}
              />
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 'auto' }}>
          Uploaded at {formatTime(result.uploadedAt)}
        </div>
      </div>
    )
  }

  // 3. Invalid — error card
  if (result?.status === 'invalid') {
    return (
      <div style={{ ...base, borderColor: 'rgba(248,113,113,0.35)' }}>
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <XCircle size={15} style={{ color: 'var(--accent-danger)' }} />
            <span
              style={{
                color: 'var(--accent-danger)',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Invalid
            </span>
          </div>
          <button onClick={handleReplace} style={btnSecondary}>
            <RotateCcw size={11} />
            Try again
          </button>
        </div>

        {/* File name */}
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: 12,
            marginBottom: 12,
            wordBreak: 'break-all',
          }}
        >
          {result.fileName}
        </p>

        {/* Missing columns */}
        {result.missingColumns?.length > 0 ? (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>
              Missing required columns:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {result.missingColumns.map((col) => (
                <div key={col} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={11} style={{ color: 'var(--accent-danger)', flexShrink: 0 }} />
                  <code
                    style={{
                      color: 'var(--accent-danger)',
                      fontSize: 12,
                      fontFamily: 'ui-monospace, monospace',
                      background: 'rgba(248,113,113,0.08)',
                      padding: '1px 7px',
                      borderRadius: 4,
                      border: '1px solid rgba(248,113,113,0.2)',
                    }}
                  >
                    {col}
                  </code>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {result.errors?.map((err, i) => (
              <p key={i} style={{ color: 'var(--accent-danger)', fontSize: 12 }}>
                {err}
              </p>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 4. Default — drop zone
  return (
    <div
      style={{
        ...base,
        borderStyle: 'dashed',
        borderColor: dragOver ? 'var(--accent-primary)' : 'var(--border)',
        background: dragOver ? 'rgba(79,124,255,0.04)' : 'var(--bg-surface)',
        cursor: 'pointer',
      }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      aria-label={`Upload ${config.label}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />

      <ZoneHeader config={config} />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          paddingBottom: 8,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: `1px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: dragOver ? 'rgba(79,124,255,0.08)' : 'var(--bg-elevated)',
            transition: 'all 0.2s',
          }}
        >
          <Upload
            size={16}
            style={{
              color: dragOver ? 'var(--accent-primary)' : 'var(--text-muted)',
              transition: 'color 0.2s',
            }}
          />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, textAlign: 'center' }}>
          {dragOver ? 'Drop to upload' : 'Drop file here or click to browse'}
        </p>
        <span
          style={{
            color: 'var(--text-muted)',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 4,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          CSV or XLSX
        </span>
      </div>
    </div>
  )
}
