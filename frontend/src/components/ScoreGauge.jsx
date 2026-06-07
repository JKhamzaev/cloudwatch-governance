import React from 'react'

const scoreColor = (s) => {
  if (s >= 80) return '#4ade80'
  if (s >= 60) return '#fbbf24'
  return '#f87171'
}

export default function ScoreGauge({ score }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const arc = circ * 0.75   // 270° arc
  const offset = arc - (score / 100) * arc
  const color = scoreColor(score)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={110} height={90} viewBox="0 0 110 90">
        {/* Track */}
        <circle
          cx={55} cy={60} r={r}
          fill="none"
          stroke="#2c2f38"
          strokeWidth={8}
          strokeDasharray={`${arc} ${circ}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform="rotate(-225 55 60)"
        />
        {/* Fill */}
        <circle
          cx={55} cy={60} r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={`${arc} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-225 55 60)"
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
        />
        <text
          x={55} y={63}
          textAnchor="middle"
          fontSize={22}
          fontWeight={600}
          fontFamily="'IBM Plex Sans', sans-serif"
          fill={color}
        >
          {score.toFixed(0)}
        </text>
        <text x={55} y={78} textAnchor="middle" fontSize={10} fill="#555b6e" fontFamily="'IBM Plex Sans', sans-serif">
          / 100
        </text>
      </svg>
      <span style={{ fontSize: 11, color: '#8b90a0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Compliance score
      </span>
    </div>
  )
}
