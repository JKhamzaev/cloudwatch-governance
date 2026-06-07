import React from 'react'

const variantStyle = {
  default: { color: '#e8eaf0' },
  good:    { color: '#4ade80' },
  warn:    { color: '#fbbf24' },
  bad:     { color: '#f87171' },
  blue:    { color: '#60a5fa' },
  purple:  { color: '#a78bfa' },
}

export default function MetricCard({ label, value, variant = 'default', sub }) {
  const style = variantStyle[variant] || variantStyle.default
  return (
    <div style={{
      background: '#16181c',
      border: '0.5px solid #2c2f38',
      borderRadius: 8,
      padding: '14px 18px',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 11, color: '#555b6e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1, ...style }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: '#555b6e', marginTop: 6 }}>{sub}</div>
      )}
    </div>
  )
}
