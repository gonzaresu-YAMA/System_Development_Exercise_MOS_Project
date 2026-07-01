/**
 * メニュードメイン操作レイヤー
 *
 * メニュー商品の取得・保存・削除・検索を担当する。
 * MenuManagement.jsx からはこのレイヤーと直接 menuApi 経由で API を呼ぶ。
 */
import { menuApi } from '../../services/api.js'

/** 全メニュー商品をバックエンドから取得（active/inactive 両方） */
export async function loadMenus() {
  return menuApi.getAll()
}

// saveMenus は不要（各変更操作で直接 API を呼ぶ）

/**
 * メニュー商品を保存する（id の有無で新規作成/更新を自動判断）
 *
 * id が数値 → 既存商品の更新（PUT /api/menu/items/:id）
 * id が null/数値以外 → 新規作成（POST /api/menu/items）
 */
export async function saveMenuItem(item) {
  if (item.id && typeof item.id === 'number') {
    return menuApi.update(item.id, item)
  }
  return menuApi.create(item)
}

/** メニュー商品を完全削除する（無効化と異なり復元不可） */
export async function deleteMenuItem(id) {
  return menuApi.delete(id)
}

/**
 * 新規追加フォームで表示するプレースホルダIDを返す
 * 実際のIDはサーバーが自動採番するため、フォームには確定値を表示できない
 */
export function makeNextMenuId(list) {
  return '(自動採番)'
}

/**
 * 売り切れかどうかを判定する
 *
 * 条件: active（有効）かつ stock が設定されていて（null でない）かつ残数が 0
 * active が false（無効）の商品は売り切れとは見なさない
 */
export function isSoldOut(menu) {
  return !!menu && menu.active && menu.stock !== null && Number(menu.stock) === 0
}

/**
 * メニューリストをフリーワードで検索する
 *
 * 検索対象: 商品名・商品ID・タグ名
 * クエリが空なら全件そのまま返す
 */
export function searchMenus(list, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return list
  return list.filter((m) => {
    const hitName = m.name.toLowerCase().includes(q)
    const hitId   = String(m.id).toLowerCase().includes(q)
    const hitTags = (m.tags || []).some((t) => t.toLowerCase().includes(q))
    return hitName || hitId || hitTags
  })
}

