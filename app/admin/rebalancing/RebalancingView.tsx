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

function getSignal(actual: number, target: number): { label: string; color: string } {
  if (actual > target + 5) return { label: 'Overweight', color: '#ef4444' }
  if (actual < target - 5) return { label: 'Underweight', color: '#3b82f6' }
  return { label: 'On target', color: '#22c55e' }
}

export default function RebalancingView({ positions, cases, targetAllocation: initialTarget }: RebalancingViewProps) {
  const [targetAllocation, setTargetAllocation] = useState<Record<string, number>>(initialTarget)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  // Build case map
  const caseMap = new Map<string, string>(
    cases.map((c) => [c.trading_id, c.sector ?? 'Unknown'])
  )

  // Calculate total NAV and sector breakdown
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

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'target_allocation', value: targetAllocation, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) {
      setSaveMsg(`Error: ${error.message}`)
    } else {
      setSaveMsg('Saved successfully')
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Chart */}
      <div
        style={{
          background: '#1a1d27',
          border: '1px solid #2a2d3e',
          borderRadius: '10px',
          padding: '24px',
        }}
      >
        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: '0 0 20px' }}>
          Target vs Actual Allocation
        </h2>
        {chartData.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '14px', padding: '32px 0', textAlign: 'center' }}>
            No positions or target allocations to display.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
              <XAxis
                dataKey="sector"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#2a2d3e' }}
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f1117',
                  border: '1px solid #2a2d3e',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value}%`]}
              />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
              <Bar dataKey="target" name="Target %" fill="#3b82f6" opacity={0.7} radius={[3, 3, 0, 0]} />
              <Bar dataKey="actual" name="Actual %" fill="#22c55e" opacity={0.8} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sector Detail Table + Target Inputs */}
      <div
        style={{
          background: '#1a1d27',
          border: '1px solid #2a2d3e',
          borderRadius: '10px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: 0 }}>
            Sector Allocation Detail
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {saveMsg && (
              <span
                style={{
                  color: saveMsg.startsWith('Error') ? '#ef4444' : '#22c55e',
                  fontSize: '13px',
                }}
              >
                {saveMsg}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: saving ? '#1e3a5f' : '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                padding: '7px 18px',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Targets'}
            </button>
          </div>
        </div>

        {sectors.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
            No sectors found. Add positions or set target allocations.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2d3e' }}>
                {['Sector', 'Market Value', 'Actual %', 'Target %', 'Signal'].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      color: '#6b7280',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectors.map((sector, i) => {
                const value = sectorValues.get(sector) ?? 0
                const actualPct = totalValue > 0 ? (value / totalValue) * 100 : 0
                const targetPct = targetAllocation[sector] ?? 0
                const { label, color } = getSignal(actualPct, targetPct)
                return (
                  <tr
                    key={sector}
                    style={{ borderBottom: i < sectors.length - 1 ? '1px solid #2a2d3e' : 'none' }}
                  >
                    <td style={{ padding: '12px 16px', color: '#fff', fontSize: '14px' }}>
                      {sector}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '13px' }}>
                      €{value.toLocaleString('en-EU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#d1d5db', fontSize: '14px', fontWeight: 600 }}>
                      {actualPct.toFixed(1)}%
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                          style={{
                            width: '72px',
                            background: '#0f1117',
                            border: '1px solid #2a2d3e',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '13px',
                            padding: '6px 8px',
                            outline: 'none',
                          }}
                        />
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color,
                          background: `${color}20`,
                          border: `1px solid ${color}40`,
                        }}
                      >
                        {label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
