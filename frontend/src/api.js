import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
})

export const runAudit = (accountId, region = 'us-east-1') =>
  api.post('/compliance/audit', { account_id: accountId, region }).then(r => r.data)

export const getSummary = (accountId) =>
  api.get(`/compliance/summary/${accountId}`).then(r => r.data)

export const getSnapshots = (accountId, limit = 20) =>
  api.get(`/compliance/snapshots/${accountId}`, { params: { limit } }).then(r => r.data)

export const getViolations = (accountId, filters = {}) =>
  api.get(`/compliance/violations/${accountId}`, { params: { resolved: false, ...filters } }).then(r => r.data)

export const resolveViolation = (id) =>
  api.patch(`/compliance/violations/${id}/resolve`).then(r => r.data)

export default api
