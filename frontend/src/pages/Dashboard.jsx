import React from 'react'
import { useAudit } from '../hooks/useAudit'
import ScoreGauge from '../components/ScoreGauge'
import MetricCard from '../components/MetricCard'
import TrendChart from '../components/TrendChart'
import SeverityBars from '../components/SeverityBars'
import ServiceGrid from '../components/ServiceGrid'
import ViolationTable from '../components/ViolationTable'

const Section = ({ title, children, style }) => (
  <div style={{
    background: '#16181c',
    border: '0.5px solid #2c2f38',
    borderRadius: 10,
    padding: '18px 20px',
    ...style,
  }}>
    {title && (
      <div style={{
        fontSize: 11, fontWeight: 600, color: '#555b6e',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 16,
      }}>{title}</div>
    )}
    {children}
  </div>
)

export default function Dashboard() {
  const {
    accountId, accounts, auditResult, snapshots, violations,
    loading, error, lastAuditTime,
    triggerAudit, switchAccount, resolveViolation,
  } = useAudit()

  const score = auditResult?.compliance_score ?? 0
  const summary = auditResult?.summary ?? {}
  const mode = summary?.mode

  const scoreVariant = score >= 80 ? 'good' : score >= 60 ? 'warn' : 'bad'
  const openCount = violations.length
  const critCount = summary?.by_severity?.critical ?? 0

  return (
    <div style={{ minHeight: '100vh', background: '#0e0f11' }}>
      {/* Header */}
      <div style={{
        borderBottom: '0.5px solid #2c2f38',
        padding: '0 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 52,
        position: 'sticky', top: 0, zIndex: 10,
        background: '#0e0f11',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf0', letterSpacing: '0.02em' }}>
            ◈ Governance
          </span>
          <span style={{ fontSize: 11, color: '#2c2f38' }}>|</span>
          <span style={{ fontSize: 12, color: '#555b6e', fontFamily: "'IBM Plex Mono', monospace" }}>
            CloudWatch Compliance Dashboard
          </span>
          {mode && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 12, fontWeight: 600,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              background: mode === 'demo' ? '#271c05' : '#0d2618',
              color: mode === 'demo' ? '#fbbf24' : '#4ade80',
              border: `0.5px solid ${mode === 'demo' ? '#92400e' : '#166534'}`,
            }}>
              {mode === 'demo' ? 'Demo mode' : 'Live'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {lastAuditTime && (
            <span style={{ fontSize: 11, color: '#555b6e' }}>
              Last audit {lastAuditTime.toLocaleTimeString()}
            </span>
          )}
          <select
            value={accountId}
            onChange={e => switchAccount(e.target.value)}
            style={{
              fontSize: 12, padding: '5px 10px', borderRadius: 6,
              border: '0.5px solid #3a3e4a', background: '#1e2025',
              color: '#e8eaf0', cursor: 'pointer',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.id} — {a.label}</option>
            ))}
          </select>
          <button
            onClick={triggerAudit}
            disabled={loading}
            style={{
              padding: '6px 16px', borderRadius: 6, fontSize: 12,
              border: '0.5px solid #3a3e4a',
              background: loading ? '#1e2025' : '#16181c',
              color: loading ? '#555b6e' : '#4ade80',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: 500, letterSpacing: '0.02em',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {loading && (
              <span style={{
                width: 10, height: 10, border: '1.5px solid #555b6e',
                borderTopColor: '#4ade80', borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }} />
            )}
            {loading ? 'Auditing…' : '▶ Run audit'}
          </button>
        </div>
      </div>

      {/* Spinner keyframes injected once */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto' }}>
        {error && (
          <div style={{
            background: '#200d0d', border: '0.5px solid #7f1d1d',
            borderRadius: 6, padding: '10px 14px', marginBottom: 16,
            fontSize: 12, color: '#f87171',
          }}>
            {error} — showing demo data
          </div>
        )}

        {!auditResult ? (
          /* Empty state */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 400, gap: 16,
          }}>
            <div style={{ fontSize: 40 }}>◈</div>
            <div style={{ fontSize: 16, color: '#8b90a0', fontWeight: 500 }}>
              Select an account and run your first audit
            </div>
            <div style={{ fontSize: 13, color: '#555b6e' }}>
              Checks IAM, EC2, S3, and Config across {accountId}
            </div>
            <button
              onClick={triggerAudit}
              disabled={loading}
              style={{
                marginTop: 8, padding: '10px 24px', borderRadius: 8, fontSize: 13,
                border: '0.5px solid #166534', background: '#0d2618',
                color: '#4ade80', cursor: 'pointer', fontWeight: 500,
              }}
            >
              {loading ? 'Auditing…' : '▶ Run audit now'}
            </button>
          </div>
        ) : (
          <>
            {/* Top row: score + metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr',
              gap: 12, marginBottom: 16, alignItems: 'stretch',
            }}>
              <Section style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 24px' }}>
                <ScoreGauge score={score} />
              </Section>
              <MetricCard label="Total resources" value={auditResult.total_resources} variant="default" />
              <MetricCard label="Compliant" value={auditResult.compliant_resources} variant="good"
                sub={`${Math.round((auditResult.compliant_resources / auditResult.total_resources) * 100)}% clean`} />
              <MetricCard label="Open violations" value={openCount} variant={openCount > 5 ? 'bad' : 'warn'} />
              <MetricCard label="Critical" value={critCount} variant={critCount > 0 ? 'bad' : 'good'}
                sub={critCount > 0 ? 'Needs immediate attention' : 'None found'} />
            </div>

            {/* Middle row: severity + service + trend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.6fr', gap: 12, marginBottom: 16 }}>
              <Section title="Violations by severity">
                <SeverityBars summary={summary} />
              </Section>
              <Section title="By service">
                <ServiceGrid summary={summary} />
              </Section>
              <Section title="Compliance trend">
                <TrendChart snapshots={snapshots} />
              </Section>
            </div>

            {/* Violations table */}
            <Section title={`Open violations (${openCount})`}>
              <ViolationTable violations={violations} onResolve={resolveViolation} />
            </Section>
          </>
        )}
      </div>
    </div>
  )
}
