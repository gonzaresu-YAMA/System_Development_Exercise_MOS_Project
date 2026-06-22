import { menuApi } from '../../services/api.js'

export async function loadMenus() {
  return menuApi.getAll()
}

// saveMenus は不要（各変更操作で直接 API を呼ぶ）
export async function saveMenuItem(item) {
  if (item.id && typeof item.id === 'number') {
    return menuApi.update(item.id, item)
  }
  return menuApi.create(item)
}

export async function deleteMenuItem(id) {
  return menuApi.delete(id)
}

export function makeNextMenuId(list) {
  // 新規追加時のフォーム表示用プレースホルダ（実際のIDはサーバーが採番）
  return '(自動採番)'
}

export function isSoldOut(menu) {
  return !!menu && menu.active && menu.stock !== null && Number(menu.stock) === 0
}

export function searchMenus(list, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return list
  return list.filter((m) => {
    const hitName = m.name.toLowerCase().includes(q)
    const hitId = String(m.id).toLowerCase().includes(q)
    const hitTags = (m.tags || []).some((t) => t.toLowerCase().includes(q))
    return hitName || hitId || hitTags
  })
}

