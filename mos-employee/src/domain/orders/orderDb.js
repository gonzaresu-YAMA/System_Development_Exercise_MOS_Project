/**
 * 注文ドメイン操作レイヤー
 *
 * 注文データの取得・検索・並び替えを担当する。
 * 各ステータス変更（startCooking, markReady など）は
 * Orders.jsx が直接 orderApi を呼ぶため、ここには書かない（関心の分離）。
 */
import { orderApi } from '../../services/api.js'

/** 本日の全注文をバックエンドから取得（Orders.jsx で 30 秒ごとにポーリングされる） */
export async function loadOrders() {
  return orderApi.getTodayOrders()
}

// saveOrders は不要（各変更操作で直接 API を呼ぶ）

/**
 * 注文リストをステータス順に並び替える
 *
 * 優先度: 未確認(0) → 調理中(1) → 提供待ち(2) → 完了(3)
 * 未確認の注文が先頭に来るので見落としを防ぐ。
 * rank に存在しないステータスは 9 として末尾に追いやる。
 */
export function sortOrders(list) {
  const rank = { '未確認': 0, '調理中': 1, '提供待ち': 2, '完了': 3 }
  // スプレッドで元配列を変更しないイミュータブルな sort
  return [...(list || [])].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9))
}

/**
 * 注文リストをステータスフィルタ・フリーワードで絞り込む
 *
 * 検索対象: 卓番号・商品名
 * 絞り込み後に sortOrders をかけて優先度順を維持した状態で返す。
 *
 * @param {Array} list - 全注文配列
 * @param {string} query - 検索ワード（空文字 = 全件）
 * @param {string} statusFilter - ステータスキー（'all' = 絞り込みなし）
 */
export function searchOrders(list, query, statusFilter = 'all') {
  const q = String(query || '').trim().toLowerCase()

  return sortOrders(list).filter((o) => {
    // ステータスフィルタ（'all' の場合はスキップ）
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    // フリーワードなし → 全件通す
    if (!q) return true

    // 卓番号または商品名にキーワードが含まれているか
    const hitTable = String(o.table).toLowerCase().includes(q)
    const hitItems = (o.items || []).some((it) => String(it.name).toLowerCase().includes(q))
    return hitTable || hitItems
  })
}

