/**
 * services/api.jsx — バックエンドAPIとの HTTP 通信モジュール
 *
 * 「なぜ services フォルダに分けているのか?」
 *   API 通信のコードをページコンポーネントに直接書くと、
 *   同じ通信処理があちこちに散らばって管理が難しくなる。
 *   このファイルに API 呼び出しをまとめることで、
 *   バックエンドの URL が変わったときなど、修正が1箇所で済む。
 *
 * 「なぜ axios を使うのか?」（ブラウザ標準の fetch との違い）
 *   - タイムアウトを簡単に設定できる（fetch にはない）
 *   - インターセプターでエラー処理を共通化できる
 *   - レスポンスが自動的に JSON に変換される
 *   - リクエストのキャンセルなど高度な機能がある
 *
 * 構成:
 *   api       → 共通設定を持つ axios インスタンス（このファイルの基盤）
 *   menuApi   → メニュー関連のエンドポイント集
 *   orderApi  → 注文関連のエンドポイント集
 *   seatApi   → 座席関連のエンドポイント集
 *   receiptApi → レシート関連のエンドポイント集
 */

import axios from 'axios'

// バックエンドサーバーの URL
// import.meta.env.VITE_API_BASE_URL: .env ファイルに VITE_API_BASE_URL=xxx と書くと読める
// 未設定の場合は開発用のローカルサーバーを使う
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// ── axios インスタンスの作成 ──────────────────────────────────

// axios.create() で共通設定（baseURL・タイムアウト・ヘッダー）を持つインスタンスを作る
// このインスタンス経由でリクエストすると、設定が自動的に適用される
const api = axios.create({
  baseURL: BASE_URL,   // 例: api.get('/api/menu') → GET http://localhost:8080/api/menu になる
  timeout: 10000,      // 10,000ms = 10秒。サーバーが応答しない場合はエラーにする
  headers: {
    'Content-Type': 'application/json'  // リクエストボディが JSON 形式であることを伝える
  }
})

// ── レスポンスインターセプター ────────────────────────────────

// interceptors.response.use(成功時の処理, エラー時の処理)
// すべての API レスポンスに対して共通のエラーハンドリングを適用する
api.interceptors.response.use(
  // 成功時（HTTP 2xx）: そのまま返す
  (response) => response,

  // エラー時（ネットワークエラー・4xx・5xx など）
  (error) => {
    if (error.response) {
      // ケース1: サーバーはレスポンスを返したが、ステータスコードが 2xx 以外
      // 例: 404 Not Found, 500 Internal Server Error
      console.error('[API] Server error:', error.response.status, error.response.data)
    } else if (error.request) {
      // ケース2: リクエストは送られたが、レスポンスが返ってこなかった
      // 例: サーバーダウン、ネットワーク切断
      console.error('[API] No response received:', error.request)
    } else {
      // ケース3: リクエスト自体の設定でエラーが発生
      // 例: axios.create() の設定ミスなど
      console.error('[API] Request setup error:', error.message)
    }
    // Promise.reject() でエラーを呼び出し元に伝播させる
    // → 呼び出し元の catch() で受け取ることができる
    return Promise.reject(error)
  }
)

// ── Menu API ──────────────────────────────────────────────────
// メニューの取得に関するエンドポイントをオブジェクトにまとめる
// .then((r) => r.data): axios のレスポンスは { data, status, headers, ... } なので
//                       r.data でバックエンドが返した実際の JSON データを取り出す

export const menuApi = {
  /** 全カテゴリの一覧を取得する */
  getCategories: () =>
    api.get('/api/menu/categories').then((r) => r.data),

  /**
   * カテゴリ名でフィルターした商品一覧を取得する
   * @param {string} category - カテゴリID ('yakitori', 'drink' など)
   */
  getItemsByCategory: (category) =>
    api.get('/api/menu/items', { params: { category } }).then((r) => r.data),
    // { params: { category } } → URL クエリパラメーター: /api/menu/items?category=yakitori

  /**
   * 商品IDで1件取得する
   * @param {number} id - 商品ID
   */
  getItemById: (id) =>
    api.get(`/api/menu/items/${id}`).then((r) => r.data),
    // テンプレートリテラル: URLにIDを埋め込む → /api/menu/items/9

  /**
   * キーワードで商品を検索する
   * @param {string} keyword - 検索キーワード
   */
  searchItems: (keyword) =>
    api.get('/api/menu/items/search', { params: { keyword } }).then((r) => r.data),

  /**
   * 価格範囲で商品を絞り込む
   * @param {number} min - 最低価格
   * @param {number} max - 最高価格
   */
  getItemsByPriceRange: (min, max) =>
    api.get('/api/menu/items', { params: { minPrice: min, maxPrice: max } }).then((r) => r.data),

  /**
   * 無効化かどうかを取得する
   * 
   * @param {number} active - 売り切れフラグ
   */
  getItemActive:(active) =>   
    api.get('/api/menu/items/${id}',{params: {soldOut:active}}).then((r) => r.data) 
}

// ── Order API ─────────────────────────────────────────────────
// 注文の作成・取得・ステータス更新に関するエンドポイント

export const orderApi = {
  /**
   * 新しい注文をバックエンドに送信して作成する（CartContext から呼ばれる）
   * api.post(): HTTP POST リクエスト = データを新規作成するときに使う
   * @param {{ seatId, courseType, items }} orderRequest
   */
  createOrder: (orderRequest) =>
    api.post('/api/orders', orderRequest).then((r) => r.data),

  /** 注文IDで1件取得する */
  getOrderById: (id) =>
    api.get(`/api/orders/${id}`).then((r) => r.data),

  /**
   * テーブルID（座席ID）に紐づく注文の一覧を取得する
   * orderHistoryRepository.load() から呼ばれる（注文履歴ページで使用）
   * @param {number} tableId - 座席ID
   */
  getOrdersByTable: (tableId) =>
    api.get(`/api/orders/table/${tableId}`).then((r) => r.data),

  /** 今日の全注文を取得する（従業員用） */
  getTodayOrders: () =>
    api.get('/api/orders/today').then((r) => r.data),

  /** 現在アクティブな（未完了の）注文を取得する */
  getActiveOrders: () =>
    api.get('/api/orders/active').then((r) => r.data),

  /** キッチン表示用の注文一覧を取得する */
  getKitchenOrders: () =>
    api.get('/api/orders/kitchen').then((r) => r.data),

  /** 既存の注文にアイテムを追加する */
  addItemsToOrder: (orderId, items) =>
    api.post(`/api/orders/${orderId}/items`, items).then((r) => r.data),

  /**
   * 注文ステータスを任意の値に更新する
   * api.patch(): HTTP PATCH = 一部のフィールドだけ更新するときに使う
   */
  updateOrderStatus: (orderId, status) =>
    api.patch(`/api/orders/${orderId}/status`, { status }).then((r) => r.data),

  /** 注文を確認済みにする */
  confirmOrder: (orderId) =>
    api.patch(`/api/orders/${orderId}/confirm`).then((r) => r.data),

  /** 注文を調理中にする */
  startCooking: (orderId) =>
    api.patch(`/api/orders/${orderId}/cooking`).then((r) => r.data),

  /** 注文を調理完了にする */
  markReady: (orderId) =>
    api.patch(`/api/orders/${orderId}/ready`).then((r) => r.data),

  /** 注文を提供済みにする */
  markServed: (orderId) =>
    api.patch(`/api/orders/${orderId}/served`).then((r) => r.data),

  /** 注文を会計済みにする */
  markPaid: (orderId) =>
    api.patch(`/api/orders/${orderId}/paid`).then((r) => r.data),

  /** 注文をキャンセルする */
  cancelOrder: (orderId) =>
    api.patch(`/api/orders/${orderId}/cancel`).then((r) => r.data)
}

// ── Seat/Table API ────────────────────────────────────────────
// 座席の情報取得・ステータス更新に関するエンドポイント

export const seatApi = {
  /** 全座席の情報を取得する */
  getAllSeats: () =>
    api.get('/api/seats').then((r) => r.data),

  /** 空き座席のみ取得する */
  getAvailableSeats: () =>
    api.get('/api/seats/available').then((r) => r.data),

  /** 座席番号で1件取得する */
  getSeatByNumber: (number) =>
    api.get(`/api/seats/${number}`).then((r) => r.data),

  /**
   * QRコードで座席を特定する
   * お客様がQRコードをスキャンしたとき、どのテーブルかを判定するために使う
   */
  getSeatByQrCode: (qrCode) =>
    api.get('/api/seats/qr', { params: { code: qrCode } }).then((r) => r.data),

  /** 座席のステータスを更新する（着席・退席など） */
  updateSeatStatus: (seatId, status) =>
    api.patch(`/api/seats/${seatId}/status`, { status }).then((r) => r.data)
}

// ── Receipt API ───────────────────────────────────────────────
// レシートの取得・ダウンロードに関するエンドポイント

export const receiptApi = {
  /** レシートをテキスト形式で取得する */
  getReceiptText: (orderId) =>
    api.get(`/api/receipts/${orderId}/text`).then((r) => r.data),

  /** レシートを HTML 形式で取得する */
  getReceiptHtml: (orderId) =>
    api.get(`/api/receipts/${orderId}/html`).then((r) => r.data),

  /**
   * レシートを PDF としてダウンロードする
   * responseType: 'blob': バイナリデータ（PDF）を受け取るための設定
   *   → 通常の JSON ではなく、ファイルデータとして扱う
   */
  downloadReceipt: (orderId) =>
    api.get(`/api/receipts/${orderId}/pdf`, { responseType: 'blob' }).then((r) => r.data)
}

// axios インスタンスを default export として公開
// → 他のファイルから import api from './api' で使える
export default api
