import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// ── Normalisation helpers ─────────────────────────────────────────────────────

function trimHeaders(rows) {
  return rows.map((row) => {
    const out = {}
    for (const [k, v] of Object.entries(row)) out[k.trim()] = v
    return out
  })
}

// Remove rows where score=0 AND status="passed" (structural artefact)
function filterStructuralZeros(rows) {
  const colNames = rows.length ? Object.keys(rows[0]).map((c) => c.toLowerCase()) : []
  if (!colNames.includes('score') || !colNames.includes('status')) return rows
  return rows.filter((row) => {
    const score = Number(row.score)
    const status = String(row.status ?? '').toLowerCase().trim()
    return !(score === 0 && status === 'passed')
  })
}

// Auto-detect a "period" value from the data
function detectPeriod(rows) {
  if (!rows.length) return null
  const CANDIDATES = ['period', 'Period', 'PERIOD', 'month', 'Month', 'quarter', 'Quarter', 'week', 'Week']
  const cols = Object.keys(rows[0])
  const periodCol = CANDIDATES.find((c) => cols.includes(c))
  if (!periodCol) return null
  const vals = [...new Set(rows.map((r) => String(r[periodCol] ?? '')).filter(Boolean))]
  if (!vals.length) return null
  if (vals.length <= 3) return vals.join(' / ')
  // Many distinct values — show first and last
  return `${vals[0]} – ${vals[vals.length - 1]}`
}

// ── File readers ──────────────────────────────────────────────────────────────

function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (r) => resolve(r.data),
      error: (err) => reject(new Error(err.message)),
    })
  })
}

async function parseXLSX(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  // raw: false → format values as strings; defval: '' → no undefined cells
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false })
  // Trim headers (XLSX doesn't have a transformHeader hook)
  return trimHeaders(rows).filter((r) => Object.values(r).some((v) => v !== ''))
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
    return { valid: false, errors: [`Unsupported format .${ext} — please use .csv or .xlsx`] }
  }

  let rows
  try {
    rows = ext === 'csv' ? await parseCSV(file) : await parseXLSX(file)
  } catch (err) {
    return { valid: false, errors: [`Could not parse file: ${err.message}`] }
  }

  if (!rows.length) {
    return { valid: false, errors: ['File is empty or contains no data rows'] }
  }

  // Apply transformations — no hard-coded column requirements.
  // ATLAS auto-detects the common join key at categorisation time.
  rows = filterStructuralZeros(rows) // drop score=0 & status=passed

  const period = detectPeriod(rows)
  const columns = Object.keys(rows[0])

  return { valid: true, data: rows, rowCount: rows.length, columns, period }
}
