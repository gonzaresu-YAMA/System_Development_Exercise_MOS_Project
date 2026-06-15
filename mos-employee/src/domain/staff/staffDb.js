const STAFF_KEY = 'staffList_v3'
const SEQ_S_KEY = 'staffSeq_S_v2'
const SEQ_A_KEY = 'staffSeq_A_v2'

const pad6 = (n) => String(n).padStart(6, '0')

const defaultStaff = [
  {
    id: 'S000001',
    name: '店長 太郎',
    role: 'manager',
    active: true,
    password: '1111',
    allowedUseCases: ['hall', 'kitchen', 'admin'],
  },
  {
    id: 'S000002',
    name: '社員 花子',
    role: 'employee',
    active: true,
    password: '2222',
    allowedUseCases: ['hall', 'kitchen', 'admin'],
  },
  {
    id: 'A000001',
    name: 'アルバイト 次郎',
    role: 'partTime',
    active: true,
    password: '3333',
    allowedUseCases: ['hall', 'kitchen'],
  },
]

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

export function loadStaff() {
  const raw = sessionStorage.getItem(STAFF_KEY)

  if (!raw) {
    sessionStorage.setItem(STAFF_KEY, JSON.stringify(defaultStaff))
    sessionStorage.setItem(SEQ_S_KEY, '2')
    sessionStorage.setItem(SEQ_A_KEY, '1')
    return defaultStaff
  }

  try {
    const parsed = JSON.parse(raw)
    const list = Array.isArray(parsed) ? parsed : defaultStaff

    const normalized = list.map((s, i) => {
      const role = s.role === 'staff' ? 'employee' : (s.role || 'employee')
      return {
        id: s.id || `S${pad6(i + 1)}`,
        name: s.name || `従業員${i + 1}`,
        role,
        active: typeof s.active === 'boolean' ? s.active : true,
        password: s.password || '1111',
        allowedUseCases: normalizeAllowedUseCases(
          role,
          s.allowedUseCases || getDefaultUseCasesFromRole(role)
        ),
      }
    })

    syncSeq(normalized)
    return normalized
  } catch {
    return defaultStaff
  }
}

export function saveStaff(list) {
  sessionStorage.setItem(STAFF_KEY, JSON.stringify(list))
  syncSeq(list)
}

function syncSeq(list) {
  const sNums = list
    .map((x) => x.id)
    .filter((id) => /^S\d{6}$/i.test(id))
    .map((id) => Number(id.slice(1)))
    .filter(Number.isFinite)

  const aNums = list
    .map((x) => x.id)
    .filter((id) => /^A\d{6}$/i.test(id))
    .map((id) => Number(id.slice(1)))
    .filter(Number.isFinite)

  const maxS = sNums.length ? Math.max(...sNums) : 0
  const maxA = aNums.length ? Math.max(...aNums) : 0

  sessionStorage.setItem(SEQ_S_KEY, String(maxS))
  sessionStorage.setItem(SEQ_A_KEY, String(maxA))
}

function nextSeq(key) {
  const current = Number(sessionStorage.getItem(key) || '0')
  const next = current + 1
  sessionStorage.setItem(key, String(next))
  return next
}

export function generateIdByRole(role) {
  if (role === 'partTime') {
    const n = nextSeq(SEQ_A_KEY)
    return `A${pad6(n)}`
  }

  const n = nextSeq(SEQ_S_KEY)
  return `S${pad6(n)}`
}

export function authenticate(id, password) {
  const list = loadStaff()
  const user = list.find((s) => s.id.toLowerCase() === String(id).toLowerCase())

  if (!user) return { ok: false, reason: 'IDが見つかりません' }
  if (!user.active) return { ok: false, reason: '無効化されています' }
  if (user.password != password) return { ok: false, reason: 'パスワードが違います' }

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      active: user.active,
      allowedUseCases: normalizeAllowedUseCases(user.role, user.allowedUseCases),
    },
  }
}
