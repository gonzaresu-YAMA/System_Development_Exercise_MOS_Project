const MENU_STORAGE_KEY = 'menuList_v5'

const defaultMenus = [
  {
    id: 'M001',
    name: '枝豆',
    price: 380,
    stock: null,
    active: true,
    tags: ['定番'],
  },
  {
    id: 'M002',
    name: '唐揚げ',
    price: 580,
    stock: 5,
    active: true,
    tags: ['人気'],
  },
  {
    id: 'M003',
    name: 'ハイボール',
    price: 450,
    stock: 0,
    active: true,
    tags: ['定番'],
  },
]

export function loadMenus() {
  const raw = sessionStorage.getItem(MENU_STORAGE_KEY)
  if (!raw) {
    sessionStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(defaultMenus))
    return defaultMenus
  }
  try {
    const parsed = JSON.parse(raw)
    const list = Array.isArray(parsed) ? parsed : defaultMenus
    return list.map(normalizeMenu)
  } catch {
    return defaultMenus
  }
}

export function saveMenus(list) {
  sessionStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(list.map(normalizeMenu)))
}

function normalizeMenu(menu) {
  return {
    id: menu.id,
    name: menu.name || '',
    price: Number(menu.price || 0),
    stock: menu.stock === null || menu.stock === '' || typeof menu.stock === 'undefined'
      ? null
      : Math.max(0, Number(menu.stock || 0)),
    active: typeof menu.active === 'boolean' ? menu.active : true,
    tags: Array.isArray(menu.tags) ? menu.tags : [],
  }
}

export function isSoldOut(menu) {
  return !!menu && menu.active && menu.stock !== null && Number(menu.stock) === 0
}

export function makeNextMenuId(list) {
  const nums = (list || [])
    .map((m) => m.id)
    .filter((id) => /^M\d+$/.test(String(id)))
    .map((id) => Number(String(id).slice(1)))
    .filter((n) => Number.isFinite(n))

  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `M${String(next).padStart(3, '0')}`
}

export function searchMenus(list, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return list

  return list.filter((m) => (
    String(m.id).toLowerCase().includes(q) ||
    String(m.name).toLowerCase().includes(q) ||
    (m.tags || []).some((t) => String(t).toLowerCase().includes(q))
  ))
}
