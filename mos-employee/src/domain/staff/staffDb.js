import { staffApi } from '../../services/api.js'

export async function loadStaff() {
  return staffApi.getAll()
}

export function generateIdByRole(role, staffList = []) {
  const list = staffList || []
  if (role === 'partTime') {
    const nums = list
      .map((x) => x.id)
      .filter((id) => /^A\d{6}$/i.test(String(id)))
      .map((id) => Number(String(id).slice(1)))
      .filter(Number.isFinite)
    const max = nums.length ? Math.max(...nums) : 0
    return `A${String(max + 1).padStart(6, '0')}`
  }
  const nums = list
    .map((x) => x.id)
    .filter((id) => /^S\d{6}$/i.test(String(id)))
    .map((id) => Number(String(id).slice(1)))
    .filter(Number.isFinite)
  const max = nums.length ? Math.max(...nums) : 0
  return `S${String(max + 1).padStart(6, '0')}`
}

export function getDefaultUseCasesFromRole(role) {
  if (role === 'manager') return ['hall', 'kitchen', 'admin']
  if (role === 'employee') return ['hall', 'kitchen', 'admin']
  return ['hall', 'kitchen']
}

export function normalizeAllowedUseCases(role, allowedUseCases) {
  const set = new Set(allowedUseCases || [])
  if (role === 'partTime') set.delete('admin')
  return Array.from(set)
}

export async function authenticate(id, password) {
  try {
    const user = await staffApi.authenticate(id, password)
    return { ok: true, user }
  } catch (err) {
    const reason = err?.response?.data?.reason || 'IDまたはパスワードが違います'
    return { ok: false, reason }
  }
}

