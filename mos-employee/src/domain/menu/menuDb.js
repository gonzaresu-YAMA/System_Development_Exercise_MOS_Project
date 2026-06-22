// メニューデータの正本
// 役割：
// - 商品一覧の読み書き
// - 商品データの正規化
// - 売切判定と検索補助
// 将来 API 化する時は load/save/search 系を API 呼び出しへ差し替える想定

const MENU_STORAGE_KEY = 'menuList_v5'

const defaultMenus = [
  {
    id: 'M001',
    name: '枝豆',
    price: 380,
    stock: null, // null = 残数管理しない
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

// 保存データを UI で扱いやすい shape にそろえる
function normalizeMenu(menu) {
  return {
    id: menu.id,
    name: menu.name || '',
    price: Number(menu.price || 0),
    // stock = null の時は「残数管理しない」商品として扱う
    stock:
      menu.stock === null || menu.stock === '' || typeof menu.stock === 'undefined'
        ? null
        : Math.max(0, Number(menu.stock || 0)),
    active: typeof menu.active === 'boolean' ? menu.active : true,
    tags: Array.isArray(menu.tags) ? menu.tags : [],
  }
}

// 商品一覧を読み込む
export function loadMenus() {
  const raw = sessionStorage.getItem(MENU_STORAGE_KEY)

  // 初回起動時は既定データを保存して返す
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

// 商品一覧を保存する
export function saveMenus(list) {
  sessionStorage.setItem(MENU_STORAGE_KEY, JSON.stringify((list || []).map(normalizeMenu)))
}

// 売切判定
// 条件：active かつ stock が数値 0
export function isSoldOut(menu) {
  return !!menu && menu.active && menu.stock !== null && Number(menu.stock) === 0
}

// 新しい商品 ID を採番する
// 例：M001, M002, ...
export function makeNextMenuId(list) {
  const nums = (list || [])
    .map((m) => m.id)
    .filter((id) => /^M\d+$/.test(String(id)))
    .map((id) => Number(String(id).slice(1)))
    .filter((n) => Number.isFinite(n))

  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `M${String(next).padStart(3, '0')}`
}

// 検索補助
// 対象：ID / 商品名 / タグ
export function searchMenus(list, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return list

  return (list || []).filter((m) => (
    String(m.id).toLowerCase().includes(q) ||
    String(m.name).toLowerCase().includes(q) ||
    (m.tags || []).some((t) => String(t).toLowerCase().includes(q))
  ))
}
