// Capped M² (Modigliani-Modigliani) risk-adjusted return — B&R-Beurs-style.
//
// All annualized values are expressed as decimals (0.075 = 7.5% per year).
// Daily portfolio returns come in as percent units (matches portfolio_snapshots.daily_twr),
// benchmark comes in as raw price levels (matches portfolio_snapshots.benchmark_value),
// risk-free rate comes in as an annual decimal series aligned to the snapshots.

export interface RiskMetricsInput {
  dailyTwrPct: number[]                 // length N — daily TWR in percent
  benchmarkValues: number[]             // length N — benchmark price level (e.g. VWCE close)
  riskFreeAnnual: number[] | number     // length N (or scalar) — annual R_f as decimal
  tradingDaysPerYear?: number           // default 252
  ratioCap?: number                     // default 3 — caps σ_b / σ_p
  volFloorAnnual?: number               // default 0.0001 — min annualized portfolio vol
}

export interface RiskMetricsResult {
  m2: number                            // Capped M² (annualized decimal)
  m2Alpha: number                       // M² − benchmark return (annualized decimal)
  sharpeRatio: number                   // dimensionless
  portfolioReturnAnnual: number
  benchmarkReturnAnnual: number
  riskFreeAnnualUsed: number            // mean R_f over the window
  portfolioVolAnnual: number            // raw, pre-floor (what the portfolio actually had)
  benchmarkVolAnnual: number
  sampleSize: number                    // number of aligned daily-return pairs used
  capActive: boolean                    // true if σ_b / σ_p was capped
  volFloorActive: boolean               // true if portfolio vol was below floor
}

export function computeRiskMetrics(input: RiskMetricsInput): RiskMetricsResult | null {
  const tradingDays = input.tradingDaysPerYear ?? 252
  const cap = input.ratioCap ?? 3
  const volFloor = input.volFloorAnnual ?? 0.0001

  const n = input.dailyTwrPct.length
  if (n < 2 || input.benchmarkValues.length !== n) return null

  const rfArr = Array.isArray(input.riskFreeAnnual)
    ? input.riskFreeAnnual
    : new Array(n).fill(input.riskFreeAnnual)

  // Align portfolio and benchmark daily returns. Benchmark return needs a prior
  // value, so we start at i = 1 and drop any day with a missing/zero benchmark.
  const rp: number[] = []
  const rb: number[] = []
  const rf: number[] = []
  for (let i = 1; i < n; i++) {
    const bPrev = input.benchmarkValues[i - 1]
    const bCurr = input.benchmarkValues[i]
    if (!bPrev || !bCurr || bPrev <= 0 || bCurr <= 0) continue
    rb.push((bCurr - bPrev) / bPrev)
    rp.push(input.dailyTwrPct[i] / 100)
    rf.push(rfArr[i] ?? 0)
  }

  if (rb.length < 2) return null

  const meanRp = mean(rp)
  const meanRb = mean(rb)
  const meanRf = mean(rf)

  const portfolioReturnAnnual = meanRp * tradingDays
  const benchmarkReturnAnnual = meanRb * tradingDays

  const sigmaPDaily = stdev(rp)
  const sigmaBDaily = stdev(rb)
  const portfolioVolAnnual = sigmaPDaily * Math.sqrt(tradingDays)
  const benchmarkVolAnnual = sigmaBDaily * Math.sqrt(tradingDays)

  const volFloorActive = portfolioVolAnnual < volFloor
  const sigmaPForRatio = volFloorActive ? volFloor : portfolioVolAnnual

  const rawRatio = benchmarkVolAnnual / sigmaPForRatio
  const capActive = rawRatio > cap
  const ratio = capActive ? cap : rawRatio

  const m2 = (portfolioReturnAnnual - meanRf) * ratio + meanRf
  const m2Alpha = m2 - benchmarkReturnAnnual
  const sharpeRatio = (portfolioReturnAnnual - meanRf) / sigmaPForRatio

  return {
    m2,
    m2Alpha,
    sharpeRatio,
    portfolioReturnAnnual,
    benchmarkReturnAnnual,
    riskFreeAnnualUsed: meanRf,
    portfolioVolAnnual,
    benchmarkVolAnnual,
    sampleSize: rb.length,
    capActive,
    volFloorActive,
  }
}

// Forward-fill the risk-free rate so every snapshot date has a usable annual rate.
// rfRecords must be sorted ascending by date. If no rate is known before a given
// snapshot date, the rate for that day is 0 (treated as 'no info').
export function alignRiskFreeRates(
  snapshotDates: string[],
  rfRecords: { date: string; rate: number }[],
): number[] {
  const sorted = [...rfRecords].sort((a, b) => a.date.localeCompare(b.date))
  const result: number[] = new Array(snapshotDates.length)
  let lastRate = 0
  let idx = 0
  for (let i = 0; i < snapshotDates.length; i++) {
    const d = snapshotDates[i]
    while (idx < sorted.length && sorted[idx].date <= d) {
      lastRate = Number(sorted[idx].rate)
      idx++
    }
    result[i] = lastRate
  }
  return result
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0
  let s = 0
  for (const x of xs) s += x
  return s / xs.length
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  let sumSq = 0
  for (const x of xs) sumSq += (x - m) ** 2
  return Math.sqrt(sumSq / (xs.length - 1))
}
