import { useState, useCallback } from 'react'
import { runAudit, getSnapshots, getViolations, resolveViolation as apiResolve } from '../api'

const ACCOUNTS = [
  { id: '123456789012', label: 'prod-us-east' },
  { id: '987654321098', label: 'staging-us-west' },
  { id: '111222333444', label: 'dev-sandbox' },
]

export function useAudit() {
  const [accountId, setAccountId] = useState(ACCOUNTS[0].id)
  const [auditResult, setAuditResult] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastAuditTime, setLastAuditTime] = useState(null)

  const fetchSnapshots = useCallback(async (acct) => {
    try {
      const data = await getSnapshots(acct)
      setSnapshots(data)
    } catch (e) {
      setSnapshots([])
    }
  }, [])

  const fetchViolations = useCallback(async (acct) => {
    try {
      const data = await getViolations(acct)
      setViolations(data)
    } catch (e) {
      setViolations([])
    }
  }, [])

  const triggerAudit = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await runAudit(accountId)
      setAuditResult(result)
      setViolations(result.violations.map((v, i) => ({ ...v, id: v.id ?? i })))
      await fetchSnapshots(accountId)
      setLastAuditTime(new Date())
    } catch (e) {
      setError(e.message || 'Audit failed')
    } finally {
      setLoading(false)
    }
  }, [accountId, fetchSnapshots])

  const switchAccount = useCallback((id) => {
    setAccountId(id)
    setAuditResult(null)
    setViolations([])
    setSnapshots([])
    setLastAuditTime(null)
  }, [])

  const resolveViolation = useCallback(async (id) => {
    try {
      await apiResolve(id)
    } catch (e) {
      // optimistic — already removed from UI
    }
    setViolations(prev => prev.filter(v => v.id !== id))
    if (auditResult) {
      setAuditResult(prev => ({
        ...prev,
        violations: prev.violations.filter(v => (v.id ?? v.resource_id) !== id),
      }))
    }
  }, [auditResult])

  return {
    accountId,
    accounts: ACCOUNTS,
    auditResult,
    snapshots,
    violations,
    loading,
    error,
    lastAuditTime,
    triggerAudit,
    switchAccount,
    resolveViolation,
  }
}
