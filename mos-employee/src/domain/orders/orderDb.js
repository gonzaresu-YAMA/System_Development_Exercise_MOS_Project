import { orderApi } from '../../services/api.js'

export async function loadOrders() {
  return orderApi.getTodayOrders()
}

// saveOrders は不要（各変更操作で直接 API を呼ぶ）

export function sortOrders(list) {
  const rank = { '未確認': 0, '調理中': 1, '提供待ち': 2, '完了': 3 }
  return [...(list || [])].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9))
}

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

