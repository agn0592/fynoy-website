'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { IconCheck, IconAlertCircle, IconBalance } from '@/app/dashboard/components/Icons'
import { fmtEUR } from '@/lib/analytics'

interface Position {
  trading_id: string | null
  symbol: string
  current_price: number
  position_size_actual: number
}

interface Case {
  trading_id: string
  sector: string | null
}

interface RebalancingViewProps {
  positions: Position[]
  cases: Case[]
  targetAllocation: Record<string, number>
}

type SignalKey = 'over' | 'under' | 'on'

function getSignal(actual: number, target: number): { label: string; key: SignalKey } {
  if (actual > target + 5) return { label: 'Overweight', key: 'over' }
  if (actual < target - 5) return { label: 'Underweight', key: 'under' }
  return { label: 'On target', key: 'on' }
}

const SIGNAL_CLASS: Record<SignalKey, string> = {
  over: 'warning',
  under: 'info',
  on:    'active',
}

interface TooltipPayload { value: number; name: string; color: string }

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-date">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="dash-tooltip-row">
          <span className="dash-tooltip-label">{p.name}</span>
          <span className="dash-tooltip-val" style={{ color: p.color }}>{p.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

export default function RebalancingView({
  positions, cases, targetAllocation: initialTarget,
}: RebalancingViewProps) {
  const [targetAllocation, setTargetAllocation] = useState<Record<string, number>>(initialTarget)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const caseMap = new Map<string, string>(
    cases.map((c) => [c.trading_id, c.sector ?? 'Unknown'])
  )

  const sectorValues = new Map<string, number>()
  let totalValue = 0
  for (const pos of positions) {
    const value = pos.current_price * pos.position_size_actual
    const sector = pos.trading_id ? (caseMap.get(pos.trading_id) ?? 'Unknown') : 'Unknown'
    sectorValues.set(sector, (sectorValues.get(sector) ?? 0) + value)
    totalValue += value
  }

  const sectors = Array.from(
    new Set([
      ...Array.from(sectorValues.keys()),
      ...Object.keys(targetAllocation),
    ])
  ).sort()

  const chartData = sectors.map((sector) => {
    const actualValue = sectorValues.get(sector) ?? 0
    const actualPct = totalValue > 0 ? (actualValue / totalValue) * 100 : 0
    const targetPct = targetAllocation[sector] ?? 0
    return {
      sector: sector.length > 15 ? sector.slice(0, 14) + '…' : sector,
      fullSector: sector,
      actual: parseFloat(actualPct.toFixed(1)),
      target: targetPct,
    }
  })

  // Summary KPIs
  const totalDiff = sectors.reduce((s, sec) => {
    const actual = totalValue > 0 ? ((sectorValues.get(sec) ?? 0) / totalValue) * 100 : 0
    const target = targetAllocation[sec] ?? 0
    return s + Math.abs(actual - target)
  }, 0)
  const targetCoverage = Object.values(targetAllocation).reduce((s, v) => s + v, 0)
  const overweightCount = sectors.filter(sec => {
    const a = totalValue > 0 ? ((sectorValues.get(sec) ?? 0) / totalValue) * 100 : 0
    const t = targetAllocation[sec] ?? 0
    return a > t + 5
  }).length
  const underweightCount = sectors.filter(sec => {
    const a = totalValue > 0 ? ((sectorValues.get(sec) ?? 0) / totalValue) * 100 : 0
    const t = targetAllocation[sec] ?? 0
    return a < t - 5
  }).length

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'target_allocation', value: targetAllocation, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) {
      setSaveMsg({ kind: 'error', text: error.message })
    } else {
      setSaveMsg({ kind: 'success', text: 'Saved' })
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI strip */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi kpi-neutral">
          <div className="adm-kpi-label">Sectors</div>
          <div className="adm-kpi-val">{sectors.length}</div>
          <div className="adm-kpi-sub">Tracked allocations</div>
        </div>
        <div className={`adm-kpi ${overweightCount > 0 ? 'kpi-dn' : 'kpi-neutral'}`}>
          <div className="adm-kpi-label">Overweight</div>
          <div className="adm-kpi-val">{overweightCount}</div>
          <div className="adm-kpi-sub">More than +5% of target</div>
        </div>
        <div className={`adm-kpi ${underweightCount > 0 ? 'kpi-dn' : 'kpi-neutral'}`}>
          <div className="adm-kpi-label">Underweight</div>
          <div className="adm-kpi-val">{underweightCount}</div>
          <div className="adm-kpi-sub">Less than -5% of target</div>
        </div>
        <div className="adm-kpi kpi-neutral">
          <div className="adm-kpi-label">Total Drift</div>
          <div className="adm-kpi-val">{totalDiff.toFixed(1)}%</div>
          <div className="adm-kpi-sub">Sum of |actual − target|</div>
        </div>
        <div className="adm-kpi kpi-neutral">
          <div className="adm-kpi-label">Target Coverage</div>
          <div className="adm-kpi-val">{targetCoverage.toFixed(0)}%</div>
          <div className="adm-kpi-sub">Sum of target weights</div>
        </div>
      </div>

      {/* Chart */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">Target vs Actual Allocation</div>
            <div className="dash-card-sub">Sector exposure comparison</div>
          </div>
        </div>
        <div className="dash-card-body">
          {chartData.length === 0 ? (
            <div className="dash-empty">No positions or target allocations to display.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" vertical={false} />
                <XAxis
                  dataKey="sector"
                  tick={{ fill: 'var(--ink-dim)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(232,228,220,0.08)' }}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: 'var(--ink-dim)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(201,169,110,0.05)' }} />
                <Legend wrapperStyle={{ color: 'var(--ink-mute)', fontSize: 11 }} iconType="square" />
                <Bar dataKey="target" name="Target %" fill="var(--ink-dim)" opacity={0.65} radius={[2, 2, 0, 0]} />
                <Bar dataKey="actual" name="Actual %" fill="var(--gold)" opacity={0.95} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Detail Table + Target Inputs */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">Sector Allocation Detail</div>
            <div className="dash-card-sub">Adjust targets and save</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {saveMsg && (
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: saveMsg.kind === 'error' ? 'var(--dash-red)' : 'var(--dash-green)',
                  fontSize: 11, fontWeight: 500, letterSpacing: 0.04,
                }}
              >
                {saveMsg.kind === 'error'
                  ? <IconAlertCircle width={13} height={13} />
                  : <IconCheck width={13} height={13} />}
                {saveMsg.text}
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="dash-btn btn-gold btn-sm"
            >
              <IconBalance width={13} height={13} />
              {saving ? 'Saving…' : 'Save Targets'}
            </button>
          </div>
        </div>

        {sectors.length === 0 ? (
          <div className="dash-empty">No sectors found. Add positions or set target allocations.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  {['Sector', 'Market Value', 'Actual %', 'Target %', 'Signal'].map((col) => (
                    <th key={col} className="dash-th">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectors.map((sector) => {
                  const value = sectorValues.get(sector) ?? 0
                  const actualPct = totalValue > 0 ? (value / totalValue) * 100 : 0
                  const targetPct = targetAllocation[sector] ?? 0
                  const sig = getSignal(actualPct, targetPct)
                  return (
                    <tr key={sector} className="dash-tr">
                      <td className="dash-td">
                        <span className="dash-symbol">{sector}</span>
                      </td>
                      <td className="dash-td">{fmtEUR(value)}</td>
                      <td className="dash-td" style={{ color: 'var(--ink)', fontWeight: 600 }}>
                        {actualPct.toFixed(1)}%
                      </td>
                      <td className="dash-td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={targetPct}
                            onChange={(e) =>
                              setTargetAllocation((prev) => ({
                                ...prev,
                                [sector]: Number(e.target.value),
                              }))
                            }
                            className="dash-input"
                            style={{ width: 90, padding: '6px 8px' }}
                          />
                          <span style={{ color: 'var(--ink-dim)', fontSize: 12 }}>%</span>
                        </div>
                      </td>
                      <td className="dash-td">
                        <span className={`status-badge ${SIGNAL_CLASS[sig.key]}`}>
                          {sig.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
