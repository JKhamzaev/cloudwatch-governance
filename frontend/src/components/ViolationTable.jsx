import React, { useState, useMemo } from 'react'

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }
const SEV_COLORS = {
  critical: { bg: '#200d0d', color: '#f87171', border: '#7f1d1d' },
  high:     { bg: '#271c05', color: '#fbbf24', border: '#92400e' },
  medium:   { bg: '#0a1929', color: '#60a5fa', border: '#1e3a5f' },
  low:      { bg: '#16181c', color: '#8b90a0', border: '#2c2f38' },
}
const SVC_COLORS = {
  IAM: '#a78bfa', EC2: '#60a5fa', S3: '#4ade80', Config: '#fbbf24',
}

function Badge({ text, colors }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 7px', borderRadius: 12,
      fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
      textTransform: 'uppercase',
      background: colors.bg, color: colors.color,
      border: `0.5px solid ${colors.border}`,
    }}>{text}</span>
  )
}

export default function ViolationTable({ violations, onResolve }) {
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [resolving, setResolving] = useState(null)

  const services = ['all', 'IAM', 'EC2', 'S3', 'Config']

  const filtered = useMemo(() => {
    const list = filter === 'all' ? violations : violations.filter(v => v.resource_type === filter)
    return [...list].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity])
  }, [violations, filter])

  const handleResolve = async (v) => {
    setResolving(v.id)
    await onResolve(v.id)
    setResolving(null)
    if (expanded === v.id) setExpanded(null)
  }

  return (
    <div>
      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {services.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            border: '0.5px solid',
            borderColor: filter === s ? '#3a3e4a' : '#2c2f38',
            background: filter === s ? '#1e2025' : 'transparent',
            color: filter === s ? '#e8eaf0' : '#8b90a0',
            textTransform: s === 'all' ? 'capitalize' : 'none',
          }}>
            {s === 'all' ? `All (${violations.length})` : `${s} (${violations.filter(v => v.resource_type === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#555b6e', fontSize: 13 }}>
          {violations.length === 0
            ? 'No open violations — run an audit to check your account.'
            : 'No violations for this service filter.'}
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        {filtered.length > 0 && (
          <thead>
            <tr>
              {['Resource', 'Type', 'Severity', 'Region', 'Description', ''].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '0 12px 10px 0',
                  fontSize: 11, color: '#555b6e', fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  borderBottom: '0.5px solid #2c2f38',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {filtered.map(v => {
            const isExpanded = expanded === v.id
            const sevStyle = SEV_COLORS[v.severity] || SEV_COLORS.low
            return (
              <React.Fragment key={v.id}>
                <tr
                  onClick={() => setExpanded(isExpanded ? null : v.id)}
                  style={{
                    cursor: 'pointer',
                    background: isExpanded ? '#1e2025' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#16181c' }}
                  onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '10px 12px 10px 0', borderBottom: '0.5px solid #1e2025' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#e8eaf0' }}>
                      {v.resource_id}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px 10px 0', borderBottom: '0.5px solid #1e2025' }}>
                    <span style={{ fontSize: 12, color: SVC_COLORS[v.resource_type] || '#8b90a0', fontWeight: 500 }}>
                      {v.resource_type}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px 10px 0', borderBottom: '0.5px solid #1e2025' }}>
                    <Badge text={v.severity} colors={sevStyle} />
                  </td>
                  <td style={{ padding: '10px 12px 10px 0', borderBottom: '0.5px solid #1e2025', color: '#8b90a0', fontSize: 12 }}>
                    {v.region || 'global'}
                  </td>
                  <td style={{ padding: '10px 12px 10px 0', borderBottom: '0.5px solid #1e2025', color: '#c8cad4', maxWidth: 340 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {v.description}
                    </span>
                  </td>
                  <td style={{ padding: '10px 0 10px 0', borderBottom: '0.5px solid #1e2025', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#555b6e', fontSize: 11, marginRight: 8 }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </td>
                </tr>

                {isExpanded && (
                  <tr>
                    <td colSpan={6} style={{ background: '#1e2025', borderBottom: '0.5px solid #2c2f38', padding: 0 }}>
                      <div style={{ padding: '14px 16px 16px', borderLeft: `3px solid ${sevStyle.color}` }}>
                        <div style={{ fontSize: 12, color: '#c8cad4', marginBottom: 10, lineHeight: 1.6 }}>
                          {v.description}
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, color: '#555b6e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                            Remediation
                          </div>
                          <code style={{
                            display: 'block', fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 11, color: '#4ade80', background: '#0e0f11',
                            padding: '8px 12px', borderRadius: 4, lineHeight: 1.7,
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          }}>
                            {v.remediation}
                          </code>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleResolve(v) }}
                          disabled={resolving === v.id}
                          style={{
                            padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                            border: '0.5px solid #166534', background: '#0d2618', color: '#4ade80',
                            fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500,
                            opacity: resolving === v.id ? 0.5 : 1,
                          }}
                        >
                          {resolving === v.id ? 'Resolving…' : '✓ Mark resolved'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
