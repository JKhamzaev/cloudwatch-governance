import React from 'react'

const SEV_COLORS = {
  critical: '#f87171',
  high:     '#fbbf24',
  medium:   '#60a5fa',
  low:      '#555b6e',
}

export default function SeverityBars({ summary }) {
  const sevs = ['critical', 'high', 'medium', 'low']
  const max = Math.max(1, ...sevs.map(s => summary?.by_severity?.[s] ?? 0))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sevs.map(sev => {
        const count = summary?.by_severity?.[sev] ?? 0
        const pct = Math.round((count / max) * 100)
        return (
          <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 56, fontSize: 11, color: '#8b90a0',
              textAlign: 'right', textTransform: 'capitalize',
            }}>{sev}</span>
            <div style={{
              flex: 1, height: 6, background: '#1e2025',
              borderRadius: 3, overflow: 'hidden',
            }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: SEV_COLORS[sev], borderRadius: 3,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{
              width: 20, fontSize: 12, fontWeight: 600,
              color: count ? SEV_COLORS[sev] : '#555b6e',
              textAlign: 'right',
            }}>{count}</span>
          </div>
        )
      })}
    </div>
  )
}
