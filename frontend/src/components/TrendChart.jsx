import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: '#1e2025', border: '0.5px solid #3a3e4a',
      borderRadius: 6, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: '#8b90a0', marginBottom: 4 }}>Audit #{d.index}</div>
      <div style={{ color: '#4ade80', fontWeight: 600 }}>{d.score.toFixed(1)}%</div>
      <div style={{ color: '#555b6e', marginTop: 2 }}>{d.violations} violations</div>
    </div>
  )
}

export default function TrendChart({ snapshots }) {
  if (!snapshots.length) {
    return (
      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#555b6e', fontSize: 12 }}>Run audits to see trend data</span>
      </div>
    )
  }

  const data = snapshots.slice(-15).map((s, i) => ({
    index: i + 1,
    score: s.compliance_score,
    violations: s.violation_count ?? 0,
    label: `#${i + 1}`,
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2c2f38" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#555b6e', fontSize: 11 }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#555b6e', fontSize: 11 }}
          axisLine={false} tickLine={false}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3a3e4a' }} />
        <ReferenceLine y={80} stroke="#166534" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#4ade80"
          strokeWidth={2}
          dot={{ fill: '#4ade80', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#4ade80' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
