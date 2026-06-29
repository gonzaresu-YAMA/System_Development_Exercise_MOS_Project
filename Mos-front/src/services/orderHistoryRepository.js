/**
 * orderHistoryRepository.js — 注文履歴の取得・保存を担うリポジトリ
 *
 * 「リポジトリパターン」とは?
 *   データの取得・保存ロジックをコンポーネントから分離するための設計パターン。
 *   コンポーネントは「注文履歴を load() してほしい」と呼ぶだけでよく、
 *   「どこから・どのように取得するか」の詳細はここに隠蔽される。
 *
 * このファイルが必要な理由:
 *   バックエンド（Spring Boot）の API が返す OrderResponse の構造と、
 *   HistoryPage が期待するデータ構造が異なる。
 *   変換（マッピング）ロジックをここに集めることで、
 *   API の仕様変更があったときの修正が1箇所で済む。
 *
 * バックエンドの OrderResponse の形式:
 *   {
 *     id: number,
 *     createdAt: string,
 *     items: [{ itemName: string, quantity: number, ... }]
 *   }
 *
 * HistoryPage が期待する形式:
 *   {
 *     id: number,
 *     createdAt: string,
 *     items: [{ name: string, qty: number }]  ← キー名が違う
 *   }
 */

import { orderApi } from './api.jsx'

export const orderHistoryRepository = {
  /**
   * バックエンドから注文履歴を取得して、HistoryPage 用の形式に変換して返す
   *
   * 処理の流れ:
   *   1. sessionStorage から座席ID を取得する
   *   2. 座席ID がなければ空配列を返す（QRコードスキャン前など）
   *   3. API で座席IDに紐づく注文一覧を取得する
   *   4. バックエンドの形式 → HistoryPage 用の形式に変換（マッピング）する
   *   5. エラーが起きた場合は空配列を返してアプリのクラッシュを防ぐ
   *
   * @returns {Promise<Array>} 変換済みの注文履歴リスト
   */
  async load() {
    try {
      // sessionStorage から座席ID を取得
      // この値はQRコードスキャン時に保存されることを想定している
      const seatId = sessionStorage.getItem('seatId')

      // 座席IDがなければこの席の注文履歴を取得できないため、空配列を返す
      if (!seatId) return []

      // バックエンドAPIから注文一覧を取得（非同期処理を await で待つ）
      const orders = await orderApi.getOrdersByTable(seatId)

      // バックエンドの形式 → フロントが期待する形式にマッピング
      // Array.map(): 配列の各要素を変換して新しい配列を作る
      return orders.map((order) => ({
        id: order.id,
        createdAt: order.createdAt,
        // order.items が存在しない可能性があるため || [] でフォールバック
        items: (order.items || []).map((it) => ({
          name: it.itemName,   // バックエンドの "itemName" → "name" に変換
          qty: it.quantity,    // バックエンドの "quantity" → "qty" に変換
        })),
      }))
    } catch {
      // ネットワークエラー・サーバーエラーなど、どんな例外でもここで拾う
      // エラーをそのまま投げると画面が真っ白になるため、空配列で安全に返す
      return []
    }
  },

  // ── バックエンドが主記録のため、フロントからの save/clear は何もしない ──
  // CartContext から呼ばれるインターフェースを満たすための「no-op（何もしない）」関数
  // 戻り値の Promise<true> は「成功した」ことを示すダミーの値
  async save() { return true },
  async clear() { return true },
}
