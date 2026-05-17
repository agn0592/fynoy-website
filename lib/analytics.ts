/**
 * Portfolio analytics utilities — works off portfolio_snapshots + closed_trades.
 * All percentage inputs are in PERCENT (not decimal), e.g. 1.25 = 1.25%.
 */

export interface SnapshotInput {
  snapshot_date: string
  total_nav: number | null
  daily_twr: number | null
  benchmark_value: number | null
  deposits_withdrawals?: number | null
}

export interface ClosedTradeInput {
  symbol: string
  exit_date: string | null
  entry_date: string | null
  realized_pnl: number | null
  realized_pnl_pct: number | null
  holding_period_days: number | null
}

export interface AdvancedMetrics {
  twrPct: number
  vwcePct: number | null
  alphaPct: number | null
  annualizedReturnPct: number
  volatilityPct: number
  sharpeRatio: number
  sortinoRatio: number
  maxDrawdownPct: number
  maxDrawdownDays: number
  calmarRatio: number
  bestDay: { date: string; pct: number } | null
  worstDay: { date: string; pct: number } | null
  positiveDays: number
  negativeDays: number
  totalDays: number
  recoveryDays: number | null
  betaVsBenchmark: number | null
  currentDrawdownPct: number
}

interface IndexedPoint {
  date: string
  twrIndex: number   // 100 = start
  nav: number
  benchmark: number | null
}

export function indexSnapshots(snapshots: SnapshotInput[]): IndexedPoint[] {
  let factor = 1
  const benchmarks = snapshots.map(s => s.benchmark_value ?? 0)
  const firstBench = benchmarks.find(v => v > 0) ?? 0
  return snapshots.map((s, i) => {
    factor *= 1 + (s.daily_twr ?? 0) / 100
    return {
      date: s.snapshot_date,
      twrIndex: factor * 100,
      nav: s.total_nav ?? 0,
      benchmark: firstBench > 0 && benchmarks[i] > 0
        ? (benchmarks[i] / firstBench) * 100
        : null,
    }
  })
}

/** Compute drawdown series in % from a TWR-indexed series */
export function drawdownSeries(snapshots: SnapshotInput[]): { date: string; dd: number; underwater: boolean }[] {
  const idx = indexSnapshots(snapshots)
  let peak = idx[0]?.twrIndex ?? 100
  return idx.map(p => {
    peak = Math.max(peak, p.twrIndex)
    const dd = peak > 0 ? ((p.twrIndex - peak) / peak) * 100 : 0
    return { date: p.date, dd, underwater: dd < -0.01 }
  })
}

/** Annualized stats from daily TWR series */
export function computeMetrics(
  snapshots: SnapshotInput[],
  options: { riskFreePct?: number } = {},
): AdvancedMetrics {
  const riskFree = options.riskFreePct ?? 0  // percent annual
  const idx = indexSnapshots(snapshots)
  const totalDays = idx.length
  if (totalDays === 0) {
    return {
      twrPct: 0, vwcePct: null, alphaPct: null, annualizedReturnPct: 0,
      volatilityPct: 0, sharpeRatio: 0, sortinoRatio: 0, maxDrawdownPct: 0,
      maxDrawdownDays: 0, calmarRatio: 0, bestDay: null, worstDay: null,
      positiveDays: 0, negativeDays: 0, totalDays: 0, recoveryDays: null,
      betaVsBenchmark: null, currentDrawdownPct: 0,
    }
  }
  const startIdx = idx[0].twrIndex
  const endIdx = idx[idx.length - 1].twrIndex
  const twrPct = ((endIdx - startIdx) / startIdx) * 100

  // VWCE benchmark return
  const firstBench = idx.find(p => p.benchmark != null)?.benchmark ?? null
  const lastBench = [...idx].reverse().find(p => p.benchmark != null)?.benchmark ?? null
  const vwcePct = firstBench != null && lastBench != null && firstBench !== lastBench
    ? ((lastBench - firstBench) / firstBench) * 100
    : null
  const alphaPct = vwcePct != null ? twrPct - vwcePct : null

  // Daily returns (decimal)
  const daily = snapshots.map(s => (s.daily_twr ?? 0) / 100)
  const calendarDays = snapshots.length > 1
    ? Math.max(1, Math.round((new Date(snapshots[snapshots.length - 1].snapshot_date).getTime()
        - new Date(snapshots[0].snapshot_date).getTime()) / 86_400_000))
    : 1

  // Annualization (252 trading days per year)
  const meanDaily = daily.reduce((s, v) => s + v, 0) / daily.length
  const variance = daily.length > 1
    ? daily.reduce((s, v) => s + Math.pow(v - meanDaily, 2), 0) / (daily.length - 1)
    : 0
  const stdDaily = Math.sqrt(variance)
  const annualizedReturnPct = (Math.pow(1 + meanDaily, 252) - 1) * 100
  const volatilityPct = stdDaily * Math.sqrt(252) * 100

  // Sharpe ratio (excess return / volatility, annualized)
  const sharpeRatio = volatilityPct > 0
    ? (annualizedReturnPct - riskFree) / volatilityPct
    : 0

  // Sortino ratio (downside deviation only)
  const downsideDaily = daily.filter(v => v < 0)
  const downsideVar = downsideDaily.length > 0
    ? downsideDaily.reduce((s, v) => s + v * v, 0) / downsideDaily.length
    : 0
  const downsideAnnual = Math.sqrt(downsideVar) * Math.sqrt(252) * 100
  const sortinoRatio = downsideAnnual > 0
    ? (annualizedReturnPct - riskFree) / downsideAnnual
    : 0

  // Drawdown
  let peak = idx[0].twrIndex
  let maxDD = 0
  let maxDDDays = 0
  let currentDDDays = 0
  let peakDate = idx[0].date
  let troughDate = idx[0].date
  let maxPeakDate = idx[0].date
  let maxTroughDate = idx[0].date
  for (const p of idx) {
    if (p.twrIndex >= peak) {
      peak = p.twrIndex
      peakDate = p.date
      currentDDDays = 0
    } else {
      currentDDDays++
      const dd = ((p.twrIndex - peak) / peak) * 100
      if (dd < maxDD) {
        maxDD = dd
        maxDDDays = currentDDDays
        maxPeakDate = peakDate
        maxTroughDate = p.date
        troughDate = p.date
      }
    }
  }
  void maxPeakDate; void maxTroughDate; void troughDate

  // Recovery days: time from trough to back-to-peak (or null if not recovered)
  const finalIdx = idx[idx.length - 1].twrIndex
  const currentDDPct = peak > 0 ? ((finalIdx - peak) / peak) * 100 : 0

  // Calmar ratio
  const calmarRatio = maxDD < 0 ? annualizedReturnPct / Math.abs(maxDD) : 0

  // Best/worst day
  let best: { date: string; pct: number } | null = null
  let worst: { date: string; pct: number } | null = null
  snapshots.forEach(s => {
    const pct = s.daily_twr ?? 0
    if (!best || pct > best.pct) best = { date: s.snapshot_date, pct }
    if (!worst || pct < worst.pct) worst = { date: s.snapshot_date, pct }
  })

  const positiveDays = daily.filter(v => v > 0).length
  const negativeDays = daily.filter(v => v < 0).length

  // Beta vs benchmark (covariance / variance of benchmark)
  let beta: number | null = null
  const benchmarkDaily: number[] = []
  for (let i = 1; i < idx.length; i++) {
    const a = idx[i].benchmark
    const b = idx[i - 1].benchmark
    if (a != null && b != null && b > 0) benchmarkDaily.push((a - b) / b)
    else benchmarkDaily.push(0)
  }
  if (benchmarkDaily.length > 1 && daily.length > 1) {
    const portfolioDaily = daily.slice(1)
    const minLen = Math.min(portfolioDaily.length, benchmarkDaily.length)
    const pSlice = portfolioDaily.slice(0, minLen)
    const bSlice = benchmarkDaily.slice(0, minLen)
    const meanP = pSlice.reduce((s, v) => s + v, 0) / pSlice.length
    const meanB = bSlice.reduce((s, v) => s + v, 0) / bSlice.length
    let cov = 0, varB = 0
    for (let i = 0; i < minLen; i++) {
      cov += (pSlice[i] - meanP) * (bSlice[i] - meanB)
      varB += Math.pow(bSlice[i] - meanB, 2)
    }
    if (varB > 0) beta = cov / varB
  }
  void calendarDays

  return {
    twrPct,
    vwcePct,
    alphaPct,
    annualizedReturnPct,
    volatilityPct,
    sharpeRatio,
    sortinoRatio,
    maxDrawdownPct: maxDD,
    maxDrawdownDays: maxDDDays,
    calmarRatio,
    bestDay: best,
    worstDay: worst,
    positiveDays,
    negativeDays,
    totalDays,
    recoveryDays: null,
    betaVsBenchmark: beta,
    currentDrawdownPct: currentDDPct,
  }
}

/** Compute monthly returns from snapshots (chained daily TWR) */
export function monthlyReturns(snapshots: SnapshotInput[]): { year: number; month: number; pct: number }[] {
  if (snapshots.length === 0) return []
  const byMonth = new Map<string, number>()
  for (const s of snapshots) {
    const d = new Date(s.snapshot_date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const current = byMonth.get(key) ?? 1
    byMonth.set(key, current * (1 + (s.daily_twr ?? 0) / 100))
  }
  return [...byMonth.entries()]
    .map(([key, factor]) => {
      const [y, m] = key.split('-').map(Number)
      return { year: y, month: m, pct: (factor - 1) * 100 }
    })
    .sort((a, b) => a.year - b.year || a.month - b.month)
}

/** Bucket trades by return % for distribution histogram */
export function returnDistribution(trades: ClosedTradeInput[]): { bucket: string; count: number; mid: number }[] {
  const buckets = [
    { range: [-Infinity, -20], label: '< -20%' },
    { range: [-20, -10], label: '-20 to -10%' },
    { range: [-10, -5], label: '-10 to -5%' },
    { range: [-5, 0], label: '-5 to 0%' },
    { range: [0, 5], label: '0 to 5%' },
    { range: [5, 10], label: '5 to 10%' },
    { range: [10, 20], label: '10 to 20%' },
    { range: [20, 50], label: '20 to 50%' },
    { range: [50, Infinity], label: '> 50%' },
  ]
  const counts = buckets.map(b => 0)
  trades.forEach(t => {
    const pct = t.realized_pnl_pct ?? 0
    const i = buckets.findIndex(b => pct >= b.range[0] && pct < b.range[1])
    if (i >= 0) counts[i]++
  })
  const mids = [-25, -15, -7.5, -2.5, 2.5, 7.5, 15, 35, 75]
  return buckets.map((b, i) => ({ bucket: b.label, count: counts[i], mid: mids[i] }))
}

/** Build holding period buckets from closed trades */
export function holdingPeriodDistribution(trades: ClosedTradeInput[]): { bucket: string; count: number; avgReturn: number }[] {
  const buckets = [
    { range: [0, 7], label: '< 1w' },
    { range: [7, 30], label: '1-4w' },
    { range: [30, 90], label: '1-3m' },
    { range: [90, 180], label: '3-6m' },
    { range: [180, 365], label: '6-12m' },
    { range: [365, Infinity], label: '> 1y' },
  ]
  return buckets.map(b => {
    const inBucket = trades.filter(t => (t.holding_period_days ?? 0) >= b.range[0] && (t.holding_period_days ?? 0) < b.range[1])
    const avgReturn = inBucket.length > 0
      ? inBucket.reduce((s, t) => s + (t.realized_pnl_pct ?? 0), 0) / inBucket.length
      : 0
    return { bucket: b.label, count: inBucket.length, avgReturn }
  })
}

/** Build top concentrations from open positions */
export interface PositionInput {
  symbol: string
  pct_of_nav: number | null
  current_price: number | null
  position_size_actual: number | null
}

export function concentrationStats(positions: PositionInput[]): {
  top1Pct: number
  top3Pct: number
  top5Pct: number
  herfindahl: number
  effectiveCount: number
  largest: { symbol: string; pct: number } | null
} {
  const sorted = [...positions]
    .map(p => ({ symbol: p.symbol, pct: p.pct_of_nav ?? 0 }))
    .sort((a, b) => b.pct - a.pct)
  const top1 = sorted[0]?.pct ?? 0
  const top3 = sorted.slice(0, 3).reduce((s, p) => s + p.pct, 0)
  const top5 = sorted.slice(0, 5).reduce((s, p) => s + p.pct, 0)
  // Herfindahl-Hirschman Index of weights
  const hhi = sorted.reduce((s, p) => s + Math.pow(p.pct / 100, 2), 0) * 10000
  const effectiveCount = hhi > 0 ? 10000 / hhi : 0
  return {
    top1Pct: top1,
    top3Pct: top3,
    top5Pct: top5,
    herfindahl: hhi,
    effectiveCount,
    largest: sorted[0] ?? null,
  }
}

/** Format a percentage with sign */
export function fmtPct(v: number | null, digits = 2): string {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(digits)}%`
}

/** Format a number as EUR currency */
export function fmtEUR(v: number | null, digits = 0): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(v)
}

/** Format a number with thousands separator */
export function fmtNum(v: number | null, digits = 0): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(v)
}

/** Format a ratio (2-digit) */
export function fmtRatio(v: number | null): string {
  if (v == null || !isFinite(v)) return '—'
  return v.toFixed(2)
}
