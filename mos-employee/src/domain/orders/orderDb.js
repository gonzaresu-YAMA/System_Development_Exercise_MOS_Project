// 注文データの正本
// 役割：
// - 注文一覧の読み書き
// - 商品単位 cooked 状態の初期化 / 正規化
// - ステータス順ソート
// - 検索 / フィルタの補助

const ORDER_STORAGE_KEY = 'orderList_v2'

const defaultOrders = [
  {
    id: 'o1',
    table: 'T1',
    time: '12:00',
    status: '未確認',
    items: [
      { name: '枝豆', qty: 1, cooked: false },
      { name: '唐揚げ', qty: 2, cooked: false },
      { name: 'ハイボール', qty: 2, cooked: false },
    ],
  },
  {
    id: 'o2',
    table: 'T2',
    time: '13:00',
    status: '調理中',
    items: [
      { name: 'ポテト', qty: 1, cooked: false },
      { name: 'レモンサワー', qty: 2, cooked: false },
    ],
  },
  {
    id: 'o3',
    table: 'C1',
    time: '13:45',
    status: '提供待ち',
    items: [
      { name: '刺身盛り', qty: 1, cooked: true },
      { name: '日本酒', qty: 1, cooked: true },
    ],
  },
  {
    id: 'o4',
    table: 'C2',
    time: '14:10',
    status: '完了',
    items: [{ name: 'お茶', qty: 2, cooked: true }],
  },
]

// 注文明細の cooked 値をステータスに合わせて正規化する
function normalizeItems(items, status) {
  const allCooked = status === '提供待ち' || status === '完了'

  return (Array.isArray(items) ? items : []).map((item) => ({
    name: item.name || '',
    qty: Number(item.qty || 0),
    cooked: typeof item.cooked === 'boolean' ? item.cooked : allCooked,
  }))
}

// 注文 shape を UI 用に正規化する
function normalizeOrder(order) {
  const status = order.status || '未確認'
  return {
    id: order.id,
    table: order.table || '',
    time: order.time || '',
    status,
    items: normalizeItems(order.items, status),
  }
}

// 注文一覧を読み込む
export function loadOrders() {
  const raw = sessionStorage.getItem(ORDER_STORAGE_KEY)

  if (!raw) {
    sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(defaultOrders))
    return defaultOrders
  }

  try {
    const parsed = JSON.parse(raw)
    const list = Array.isArray(parsed) ? parsed : defaultOrders
    return list.map(normalizeOrder)
  } catch {
    return defaultOrders
  }
}

// 注文一覧を保存する
export function saveOrders(list) {
  sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify((list || []).map(normalizeOrder)))
}

// ステータス順に並べる
export function sortOrders(list) {
  const rank = { '未確認': 0, '調理中': 1, '提供待ち': 2, '完了': 3 }
  return [...(list || [])].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9))
}

// 検索 + ステータスフィルタ
// 対象：卓番号 / 商品名
export function searchOrders(list, query, statusFilter = 'all') {
  const q = String(query || '').trim().toLowerCase()

  return sortOrders(list).filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (!q) return true

    const hitTable = String(o.table).toLowerCase().includes(q)
    const hitItems = (o.items || []).some((it) => String(it.name).toLowerCase().includes(q))
    return hitTable || hitItems
  })
}
