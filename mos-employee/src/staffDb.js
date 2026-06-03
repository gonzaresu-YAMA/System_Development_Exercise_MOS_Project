// src/staffDb.js

const STAFF_KEY = 'staffList_v2'

// 6桁採番のシーケンス
const SEQ_S_KEY = 'staffSeq_S_v1' // 店長/社員 → S000001...
const SEQ_A_KEY = 'staffSeq_A_v1' // アルバイト → A000001...

export const ROLE_LABEL = {
  manager: '店長',
  employee: '社員',
  partTime: 'アルバイト',
}

// 用途ラベル
export const USECASE_LABEL = {
  hall: 'ホール',
  kitchen: '厨房',
  admin: '業務',
}

// 権限ラベル（表示用）
export const PERMISSION_LABEL = {
  manager: '店長',
  employee: '従業員',
  partTime: 'アルバイト',
}

const pad6 = (n) => String(n).padStart(6, '0')

// 役職 → 権限（内部ロジック上は role をそのまま権限としてもOK）
export function getPermissionFromRole(role) {
  if (role === 'manager') return 'manager'
  if (role === 'employee') return 'employee'
  return 'partTime'
}

// 役職 → デフォルト用途
// アルバイトは admin 不可
export function getDefaultUseCasesFromRole(role) {
  if (role === 'manager') return ['hall', 'kitchen', 'admin']
  if (role === 'employee') return ['hall', 'kitchen', 'admin']
  return ['hall', 'kitchen']
}

// 念のため強制ルール
export function normalizeAllowedUseCases(role, allowedUseCases) {
  const set = new Set(allowedUseCases || [])
  if (role === 'partTime') set.delete('admin')
  return Array.from(set)
}

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

export function loadStaff() {
  const raw = sessionStorage.getItem(STAFF_KEY)

  if (!raw) {
    sessionStorage.setItem(STAFF_KEY, JSON.stringify(defaultStaff))
    sessionStorage.setItem(SEQ_S_KEY, '2') // S000002まで使用済み
    sessionStorage.setItem(SEQ_A_KEY, '1') // A000001まで使用済み
    return defaultStaff
  }

  try {
    const parsed = JSON.parse(raw)
    const list = Array.isArray(parsed) ? parsed : defaultStaff

    // 旧データ互換（もし古い shape が残っていても最低限動くように補完）
    const normalized = list.map((s, i) => ({
      id: s.id || `S${pad6(i + 1)}`,
      name: s.name || `従業員${i + 1}`,
      role: s.role === 'staff' ? 'employee' : (s.role || 'employee'),
      active: typeof s.active === 'boolean' ? s.active : true,
      password: s.password || '1111',
      allowedUseCases: normalizeAllowedUseCases(
        s.role === 'staff' ? 'employee' : (s.role || 'employee'),
        s.allowedUseCases || getDefaultUseCasesFromRole(s.role === 'staff' ? 'employee' : (s.role || 'employee'))
      ),
    }))

    // シーケンスの保険更新
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

// 現在の一覧から S/A の最大番号をシーケンスに合わせる
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

// role に応じて 6桁IDを採番
export function generateIdByRole(role) {
  if (role === 'partTime') {
    const n = nextSeq(SEQ_A_KEY)
    return `A${pad6(n)}`
  }
  const n = nextSeq(SEQ_S_KEY)
  return `S${pad6(n)}`
}

// 認証
export function authenticate(id, password) {
  const list = loadStaff()
  const user = list.find((s) => s.id.toLowerCase() === String(id).toLowerCase())

  if (!user) return { ok: false, reason: 'IDが見つかりません' }
  if (!user.active) return { ok: false, reason: '無効化されています' }
  if (user.password !== password) return { ok: false, reason: 'パスワードが違います' }

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
