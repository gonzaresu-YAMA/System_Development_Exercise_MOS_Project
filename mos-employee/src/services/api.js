/**
 * mos-employee の API クライアント（axios ベース）
 *
 * このファイルは以下の責務をまとめて担う:
 *   1. axios インスタンスの設定（ベースURL・タイムアウト・エラーログ）
 *   2. バックエンドとフロントエンドの型変換関数（to...）
 *   3. 各ドメインの API メソッド定義（staffApi / menuApi / orderApi / seatApi）
 *
 * バックエンドとフロントエンドで型が異なる理由:
 *   Java Spring Boot の命名規則（UPPER_SNAKE_CASE、snake_case）と
 *   フロントエンドの命名規則（camelCase）を揃えるためにここで変換する。
 */
import axios from 'axios'

// VITE_API_BASE_URL が .env に設定されていればそれを使い、なければ開発用ローカルサーバーを使う
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// axios インスタンスを作成する
// axios.create を使う理由: 全リクエストに共通設定（baseURL・timeout・headers）を自動適用できる
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,  // 10秒でタイムアウト（フリーズ防止）
  headers: { 'Content-Type': 'application/json' },
})

// レスポンスインターセプター: 全 API エラーを一箇所でログ出力する
// 成功レスポンスはそのまま通す（res => res）
// エラーは 3 種類に分類してログを出してから再スローする
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      // サーバーがレスポンスを返した（4xx/5xx エラー）
      console.error('[API] Server error:', err.response.status, err.response.data)
    } else if (err.request) {
      // リクエストは送ったがレスポンスが返ってこなかった（ネットワーク断など）
      console.error('[API] No response:', err.request)
    } else {
      // リクエスト自体の設定に問題があった（URL が不正など）
      console.error('[API] Request error:', err.message)
    }
    // エラーを握りつぶさず呼び出し元に伝播させる
    return Promise.reject(err)
  }
)

// ── ステータス変換ユーティリティ ───────────────────────────
// バックエンドの定数名とフロントエンドの表示ラベルを対応付ける

/**
 * バックエンド Order.Status（大文字）→ フロントエンド表示ラベル（日本語）
 * PENDING と CONFIRMED は両方「未確認」として表示する
 * CANCELLED は「完了」として扱う（キャンセルも処理済みのため一覧から外す）
 */
export function toFrontStatus(backendStatus) {
  const map = {
    PENDING:   '未確認',
    CONFIRMED: '未確認',
    COOKING:   '調理中',
    READY:     '提供待ち',
    COMPLETED: '完了',
    CANCELLED: '完了',
  }
  return map[backendStatus] || backendStatus
}

/** バックエンド Seat.Status（大文字）→ フロントエンド seatDb のキー（小文字） */
export function toFrontSeatStatus(backendStatus) {
  const map = { EMPTY: 'empty', USING: 'using', PAID: 'paid', STOPPED: 'stop' }
  return map[backendStatus] || 'empty'
}

/** フロントエンド seatDb のキー（小文字）→ バックエンド Seat.Status（大文字） */
export function toBackendSeatStatus(frontStatus) {
  const map = { empty: 'EMPTY', using: 'USING', paid: 'PAID', stop: 'STOPPED' }
  return map[frontStatus] || 'EMPTY'
}

/**
 * バックエンドの MenuItem → フロントエンドのメニューオブジェクトに変換
 *
 * tags: バックエンドはカンマ区切り文字列で返すため、split で配列に変換する
 * categoryId: バックエンドはネストされた category オブジェクトで返す
 */
export function toFrontMenuItem(item) {
  return {
    id:         item.id,
    name:       item.name,
    price:      item.price,
    stock:      item.stock ?? null,
    active:     item.active ?? true,
    tags:       item.tags ? item.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    categoryId: item.category?.id ?? null,
  }
}

/**
 * バックエンドの OrderResponse → フロントエンドの order オブジェクトに変換
 *
 * id: 文字列化する理由 → React の key として使うときに文字列の方が安全
 * _numId: バックエンド API に渡す時は数値 ID が必要なので別途保持
 * table: tableNumber があればそれを使い、なければ seatId を文字列変換する
 * time: createdAt（ISO 8601）を HH:MM 形式に変換
 * cooked フラグ: 個別アイテムの status が READY/COMPLETED なら調理済み
 */
export function toFrontOrder(order) {
  const date = new Date(order.createdAt)
  const time = isNaN(date)
    ? ''
    : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return {
    id:     String(order.id),
    _numId: order.id,
    table:  order.tableNumber || String(order.seatId || ''),
    time,
    status: toFrontStatus(order.status),
    items: (order.items || []).map((it) => ({
      name:   it.itemName,
      qty:    it.quantity,
      cooked: it.status === 'READY' || it.status === 'COMPLETED',
    })),
  }
}

/**
 * バックエンドの Seat → フロントエンドの seat オブジェクトに変換
 *
 * _numId: バックエンドの数値 ID（API 呼び出し時に使用）
 * id: 画面表示用の seatNumber（例: 'T101'）
 */
export function toFrontSeat(seat) {
  return {
    _numId:       seat.id,
    id:           seat.seatNumber,
    status:       toFrontSeatStatus(seat.status),
    people:       seat.customerCount ?? 0,
    floor:        seat.floor ?? 1,
    qrCode:       seat.qrCode ?? null,
    qrExpiresAt:  seat.qrExpiresAt ?? null,
  }
}

// ── Staff API ──────────────────────────────────────────────
// バックエンドが allowedUseCases をリスト形式または文字列形式で返すため、
// 取得後に必ず配列に正規化する

function normalizeStaff(s) {
  // allowedUseCaseList（リスト形式）と allowedUseCases（文字列形式）の両方に対応
  const useCases = s.allowedUseCaseList ?? s.allowedUseCases
  return {
    ...s,
    allowedUseCases: Array.isArray(useCases)
      ? useCases
      : typeof useCases === 'string'
        ? useCases.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
  }
}

export const staffApi = {
  // ログイン認証: POST /api/staff/authenticate → ユーザーオブジェクト
  authenticate: (id, password) =>
    api.post('/api/staff/authenticate', { id, password }).then((r) => normalizeStaff(r.data)),

  // 全スタッフ取得
  getAll: () =>
    api.get('/api/staff').then((r) => r.data.map(normalizeStaff)),

  // スタッフ新規作成
  create: (staff) =>
    api.post('/api/staff', staff).then((r) => normalizeStaff(r.data)),

  // スタッフ情報更新（パスワード変更・有効化/無効化もここで行う）
  update: (id, staff) =>
    api.put(`/api/staff/${id}`, staff).then((r) => normalizeStaff(r.data)),

  // スタッフ削除（通常は使わず無効化で管理する）
  delete: (id) =>
    api.delete(`/api/staff/${id}`),
}

// ── Menu API ──────────────────────────────────────────────

export const menuApi = {
  // 全メニュー商品取得（all: true で非公開商品も含む）
  getAll: () =>
    api.get('/api/menu/items', { params: { all: true } }).then((r) => r.data.map(toFrontMenuItem)),

  // タグ一覧取得
  getTags: () =>
    api.get('/api/menu/tags').then((r) => r.data),

  // 商品新規作成
  create: (item) =>
    api.post('/api/menu/items', toBackendMenuItemRequest(item)).then((r) => toFrontMenuItem(r.data)),

  // 商品更新
  update: (id, item) =>
    api.put(`/api/menu/items/${id}`, toBackendMenuItemRequest(item)).then((r) => toFrontMenuItem(r.data)),

  // 商品完全削除
  delete: (id) =>
    api.delete(`/api/menu/items/${id}`),
}

// フロントエンドのメニューオブジェクト → バックエンドへ送るリクエスト形式に変換
function toBackendMenuItemRequest(item) {
  return {
    name:       item.name,
    price:      item.price,
    stock:      item.stock,
    active:     item.active,
    tags:       item.tags || [],
    categoryId: item.categoryId ?? null,
  }
}

// ── Order API ──────────────────────────────────────────────

export const orderApi = {
  // 本日の全注文取得
  getTodayOrders: () =>
    api.get('/api/orders/today').then((r) => r.data.map(toFrontOrder)),

  // 調理開始（未確認 → 調理中）
  startCooking: (numId) =>
    api.patch(`/api/orders/${numId}/cooking`).then((r) => toFrontOrder(r.data)),

  // 提供待ちに変更（調理中 → 提供待ち）: 全アイテム調理完了時に自動呼び出し
  markReady: (numId) =>
    api.patch(`/api/orders/${numId}/ready`).then((r) => toFrontOrder(r.data)),

  // 提供完了（提供待ち → 完了）
  markServed: (numId) =>
    api.patch(`/api/orders/${numId}/served`).then((r) => toFrontOrder(r.data)),
}

// ── Seat API ──────────────────────────────────────────────

export const seatApi = {
  // 全座席取得
  getAll: () =>
    api.get('/api/seats').then((r) => r.data.map(toFrontSeat)),

  // 座席ステータスと利用人数を更新
  // frontStatus をここでバックエンド形式に変換して送信する
  updateStatus: (numId, frontStatus, customerCount) =>
    api.patch(`/api/seats/${numId}/status`, {
      status: toBackendSeatStatus(frontStatus),
      customerCount,
    }).then((r) => toFrontSeat(r.data)),

  // QRコードを新規発行（再発行）する。トークンと有効期限はサーバー側で生成される
  issueQr: (numId) =>
    api.post(`/api/seats/${numId}/qr`).then((r) => toFrontSeat(r.data)),
}
