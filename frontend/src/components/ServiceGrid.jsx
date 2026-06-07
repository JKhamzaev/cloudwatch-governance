import React from 'react'

const SERVICES = [
  { key: 'IAM',    label: 'IAM',    color: '#a78bfa', desc: 'Policies & users' },
  { key: 'EC2',    label: 'EC2',    color: '#60a5fa', desc: 'Instances & SGs' },
  { key: 'S3',     label: 'S3',     color: '#4ade80', desc: 'Buckets & access' },
  { key: 'Config', label: 'Config', color: '#fbbf24', desc: 'Rule compliance' },
]

export default function ServiceGrid({ summary }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {SERVICES.map(({ key, label, color, desc }) => {
        const count = summary?.by_service?.[key] ?? 0
        return (
          <div key={key} style={{
            background: '#0e0f11',
            border: '0.5px solid #2c2f38',
            borderRadius: 6,
            padding: '10px 12px',
            borderLeft: `2px solid ${count ? color : '#2c2f38'}`,
          }}>
            <div style={{ fontSize: 11, color: '#555b6e', marginBottom: 4 }}>{desc}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 600, color: count ? color : '#2c2f38', lineHeight: 1 }}>
                {count}
              </span>
              <span style={{ fontSize: 12, color: '#555b6e' }}>{label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
