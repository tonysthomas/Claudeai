// ── Column alias resolution ───────────────────────────────────────────────────
// Maps semantic field names to ordered lists of candidate column names.
// First exact case-insensitive match wins; partial match is the fallback.

const ALIASES = {
  name:     ['name', 'employee_name', 'full_name', 'staff_name', 'emp_name', 'agent_name'],
  store:    ['store', 'store_name', 'location', 'branch', 'outlet', 'shop'],
  market:   ['market', 'region', 'area', 'territory', 'zone', 'cluster', 'district'],
  sales:    ['sales_value', 'sales', 'revenue', 'total_sales', 'amount', 'sales_amount', 'net_sales', 'value'],
  sessions: ['sessions_completed', 'sessions', 'training_sessions', 'completed_sessions', 'no_of_sessions', 'attendance'],
  score:    ['score', 'knowledge_score', 'avg_score', 'test_score', 'assessment_score', 'quiz_score'],
}

function findVal(row, field) {
  if (!row) return null
  const keys = Object.keys(row)
  const candidates = ALIASES[field] || [field]
  // Exact case-insensitive match first
  for (const c of candidates) {
    const k = keys.find((k) => k.toLowerCase() === c.toLowerCase())
    if (k !== undefined && row[k] !== '' && row[k] !== null && row[k] !== undefined)
      return row[k]
  }
  // Partial match fallback
  for (const c of candidates) {
    const k = keys.find((k) => k.toLowerCase().includes(c.toLowerCase()))
    if (k !== undefined && row[k] !== '' && row[k] !== null && row[k] !== undefined)
      return row[k]
  }
  return null
}

function toNum(v) {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

function avg(nums) {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

// Build a Map<joinKey value → row[]>.
// Finds the column case-insensitively so mismatched casing across files still joins.
// Normalises values: trim + strip Excel decimal artefacts (1001.0 → 1001).
function multiMap(rows, key) {
  const m = new Map()
  const keyLower = key.toLowerCase()
  for (const row of rows) {
    const actualCol = Object.keys(row).find((c) => c.toLowerCase() === keyLower) ?? key
    const k = String(row[actualCol] ?? '').trim().replace(/\.0+$/, '')
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(row)
  }
  return m
}

// ── Auto-detect the common join key across all 4 datasets ─────────────────────
// Finds columns present in every dataset (case-insensitive), then picks the one
// that looks most like an employee identifier.
const JOIN_KEY_HINTS = [
  'employee_id', 'emp_id', 'emp id', 'empid',
  'staff_id', 'staff id', 'agent_id', 'agent id',
  'user_id', 'user id', 'personnel_id', 'personnel id',
  'emp_no', 'emp no', 'employee_no', 'employee no',
  'staff_no', 'staff no', 'agent_no', 'agent no', 'id',
]

export function detectJoinKey(staffRows, salesRows, trainingRows, knowledgeRows) {
  const labels = ['staff', 'sales', 'training', 'knowledge']
  const allDatasets = [staffRows, salesRows, trainingRows, knowledgeRows]
  if (allDatasets.some((d) => !d.length)) return null

  // Get column names (original case) per dataset
  const colSets = allDatasets.map((rows) =>
    Object.keys(rows[0]).map((c) => ({ original: c, lower: c.toLowerCase().trim() })),
  )

  // Log columns found in each file for diagnosis
  colSets.forEach((cols, i) => {
    console.log(`[ATLAS] ${labels[i]} columns (${cols.length}):`, cols.map((c) => c.original))
  })

  // Keep only columns present in ALL 4 datasets (case-insensitive)
  const common = colSets[0].filter(({ lower }) =>
    colSets.slice(1).every((set) => set.some((c) => c.lower === lower)),
  )
  console.log('[ATLAS] Common columns across all 4 files:', common.map((c) => c.original))

  if (!common.length) {
    console.warn('[ATLAS] No common column found — cannot join. Check that all 4 files share at least one column name.')
    return null
  }

  // Prefer columns whose lowercase name matches a known ID hint (in priority order)
  for (const hint of JOIN_KEY_HINTS) {
    const match = common.find((c) => c.lower === hint)
    if (match) {
      console.log(`[ATLAS] Join key detected (hint match): "${match.original}"`)
      return match.original
    }
  }

  // Partial match: any common column whose name contains 'id'
  const idLike = common.find((c) => c.lower.includes('id'))
  if (idLike) {
    console.log(`[ATLAS] Join key detected (partial 'id' match): "${idLike.original}"`)
    return idLike.original
  }

  // Partial match: contains 'no' or 'number'
  const noLike = common.find((c) => c.lower.includes('_no') || c.lower.includes('number'))
  if (noLike) {
    console.log(`[ATLAS] Join key detected (partial 'no' match): "${noLike.original}"`)
    return noLike.original
  }

  // Fallback: first common column
  console.log(`[ATLAS] Join key detected (fallback — first common column): "${common[0].original}"`)
  return common[0].original
}

// ── Main categorisation entry point ───────────────────────────────────────────

export function runCategorisation(staffRows, salesRows, trainingRows, knowledgeRows) {
  // Auto-detect which column to join on
  const joinKey = detectJoinKey(staffRows, salesRows, trainingRows, knowledgeRows)

  // If no common column exists across all 4 files, every employee is MISSING_DATA
  if (!joinKey) {
    return staffRows.map((emp) => ({
      id: String(Object.values(emp)[0] ?? ''),
      name: findVal(emp, 'name') || 'Unknown',
      store: '—', market: 'Unknown',
      category: 'MISSING_DATA',
      salesVal: 0, sessions: 0, avgScore: 0,
      highEngagement: false, highPerformance: false,
      flag: null,
      _error: 'No common column found across all 4 files',
    }))
  }

  const salesMap     = multiMap(salesRows, joinKey)
  const trainingMap  = multiMap(trainingRows, joinKey)
  const knowledgeMap = multiMap(knowledgeRows, joinKey)

  console.log(`[ATLAS] Maps built — staff:${staffRows.length} sales:${salesMap.size} training:${trainingMap.size} knowledge:${knowledgeMap.size}`)
  // Sample first 3 keys from each map to verify values match
  const sample = (m) => [...m.keys()].slice(0, 3)
  console.log('[ATLAS] Sample IDs — sales:', sample(salesMap), '| training:', sample(trainingMap), '| knowledge:', sample(knowledgeMap))
  // Sample staff IDs
  const joinKeyLower0 = joinKey.toLowerCase()
  const staffSample = staffRows.slice(0, 3).map((r) => {
    const col = Object.keys(r).find((c) => c.toLowerCase() === joinKeyLower0) ?? joinKey
    return String(r[col] ?? '').trim().replace(/\.0+$/, '')
  })
  console.log('[ATLAS] Sample IDs — staff:', staffSample)

  // ── PASS 1: resolve per-employee values ───────────────────────────────────
  const joinKeyLower = joinKey.toLowerCase()
  const employees = staffRows.map((emp) => {
    const staffCol = Object.keys(emp).find((c) => c.toLowerCase() === joinKeyLower) ?? joinKey
    const id       = String(emp[staffCol] ?? '').trim().replace(/\.0+$/, '')
    const name   = findVal(emp, 'name')   || `Employee ${id}`
    const store  = findVal(emp, 'store')  || '—'
    const market = findVal(emp, 'market') || 'Unknown'

    const empSales     = salesMap.get(id)
    const empTraining  = trainingMap.get(id)
    const empKnowledge = knowledgeMap.get(id)

    // Step 1 — missing data: absent from any of the 3 other files
    if (!empSales?.length || !empTraining?.length || !empKnowledge?.length) {
      return {
        id, name, store, market,
        category: 'MISSING_DATA',
        salesVal: 0, sessions: 0, avgScore: 0,
        highEngagement: false, highPerformance: false,
        flag: null,
      }
    }

    // Sales — sum all records (handles multi-period data)
    const salesVal = empSales.reduce((s, r) => s + toNum(findVal(r, 'sales')), 0)

    // Sessions — if a sessions column exists, sum it; otherwise count rows
    const hasSessionCol = findVal(empTraining[0], 'sessions') !== null
    const sessions = hasSessionCol
      ? empTraining.reduce((s, r) => s + toNum(findVal(r, 'sessions')), 0)
      : empTraining.length

    // Knowledge — average score across all assessment rows
    const avgScore = avg(empKnowledge.map((r) => toNum(findVal(r, 'score'))))

    // Step 2 — engagement
    const highEngagement = sessions >= 4 && avgScore >= 70

    return {
      id, name, store, market,
      category: null,        // resolved in pass 2
      salesVal, sessions, avgScore,
      highEngagement, highPerformance: false,
      flag: null,
    }
  })

  // ── PASS 2: peer-relative performance + category assignment ───────────────
  // Build market groups from non-missing employees only
  const byMarket = new Map()
  for (const e of employees) {
    if (e.category === 'MISSING_DATA') continue
    if (!byMarket.has(e.market)) byMarket.set(e.market, [])
    byMarket.get(e.market).push(e)
  }

  for (const e of employees) {
    if (e.category === 'MISSING_DATA') continue

    const peers      = byMarket.get(e.market) || []
    const peerAvg    = avg(peers.map((p) => p.salesVal))
    e.highPerformance = e.salesVal >= peerAvg

    // Step 4 — FROZEN category
    if (e.highEngagement && e.highPerformance) {
      e.category = 'STAR'
    } else if (e.highEngagement && !e.highPerformance) {
      e.category = 'LEARNER'
      // LEARNER PARADOX FLAG — high knowledge but not converting to sales
      e.flag = {
        paradox: true,
        message:
          'High knowledge score — behavioural gap. Floor coaching required. Do not prescribe more content.',
      }
    } else if (!e.highEngagement && e.highPerformance) {
      e.category = 'PERFORMER'
    } else {
      e.category = 'NEEDS_SUPPORT'
    }
  }

  const catCounts = employees.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc }, {})
  console.log('[ATLAS] Category counts:', catCounts)

  return employees
}
