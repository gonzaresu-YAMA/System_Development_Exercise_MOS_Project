import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      console.error('[API] Server error:', err.response.status, err.response.data)
    } else if (err.request) {
      console.error('[API] No response:', err.request)
    } else {
      console.error('[API] Request error:', err.message)
    }
    return Promise.reject(err)
  }
)

// ── ステータス変換ユーティリティ ───────────────────────

/** バックエンド Order.Status → フロントエンド表示ラベル */
export function toFrontStatus(backendStatus) {
  const map = {
    PENDING: '未確認',
    CONFIRMED: '未確認',
    COOKING: '調理中',
    READY: '提供待ち',
    COMPLETED: '完了',
    CANCELLED: '完了',
  }
  return map[backendStatus] || backendStatus
}

/** バックエンド Seat.Status → フロントエンド seatStatus キー */
export function toFrontSeatStatus(backendStatus) {
  const map = { EMPTY: 'empty', USING: 'using', PAID: 'paid', STOPPED: 'stop' }
  return map[backendStatus] || 'empty'
}

/** フロントエンド seatStatus キー → バックエンド Seat.Status */
export function toBackendSeatStatus(frontStatus) {
  const map = { empty: 'EMPTY', using: 'USING', paid: 'PAID', stop: 'STOPPED' }
  return map[frontStatus] || 'EMPTY'
}

/** MenuItem (backend) → mos-employee のメニューオブジェクトに変換 */
export function toFrontMenuItem(item) {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    stock: item.stock ?? null,
    active: item.active ?? true,
    tags: item.tags ? item.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    categoryId: item.category?.id ?? null,
  }
}

/** OrderResponse (backend) → mos-employee の order オブジェクトに変換 */
export function toFrontOrder(order) {
  const date = new Date(order.createdAt)
  const time = isNaN(date) ? '' : `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
  return {
    id: String(order.id),
    _numId: order.id,
    table: order.tableNumber || String(order.seatId || ''),
    time,
    status: toFrontStatus(order.status),
    items: (order.items || []).map((it) => ({
      name: it.itemName,
      qty: it.quantity,
      cooked: it.status === 'READY' || it.status === 'COMPLETED',
    })),
  }
}

/** Seat (backend) → mos-employee の seat オブジェクトに変換 */
export function toFrontSeat(seat) {
  return {
    _numId: seat.id,
    id: seat.seatNumber,
    status: toFrontSeatStatus(seat.status),
    people: seat.customerCount ?? 0,
    floor: seat.floor ?? 1,
  }
}

// ── Staff API ──────────────────────────────────────────

export const staffApi = {
  authenticate: (id, password) =>
    api.post('/api/staff/authenticate', { id, password }).then((r) => r.data),

  getAll: () =>
    api.get('/api/staff').then((r) => r.data),

  create: (staff) =>
    api.post('/api/staff', staff).then((r) => r.data),

  update: (id, staff) =>
    api.put(`/api/staff/${id}`, staff).then((r) => r.data),

  delete: (id) =>
    api.delete(`/api/staff/${id}`),
}

// ── Menu API ───────────────────────────────────────────

export const menuApi = {
  getAll: () =>
    api.get('/api/menu/items', { params: { all: true } }).then((r) => r.data.map(toFrontMenuItem)),

  getTags: () =>
    api.get('/api/menu/tags').then((r) => r.data),

  create: (item) =>
    api.post('/api/menu/items', toBackendMenuItemRequest(item)).then((r) => toFrontMenuItem(r.data)),

  update: (id, item) =>
    api.put(`/api/menu/items/${id}`, toBackendMenuItemRequest(item)).then((r) => toFrontMenuItem(r.data)),

  delete: (id) =>
    api.delete(`/api/menu/items/${id}`),
}

function toBackendMenuItemRequest(item) {
  return {
    name: item.name,
    price: item.price,
    stock: item.stock,
    active: item.active,
    tags: item.tags || [],
    categoryId: item.categoryId ?? null,
  }
}

// ── Order API ──────────────────────────────────────────

export const orderApi = {
  getTodayOrders: () =>
    api.get('/api/orders/today').then((r) => r.data.map(toFrontOrder)),

  startCooking: (numId) =>
    api.patch(`/api/orders/${numId}/cooking`).then((r) => toFrontOrder(r.data)),

  markReady: (numId) =>
    api.patch(`/api/orders/${numId}/ready`).then((r) => toFrontOrder(r.data)),

  markServed: (numId) =>
    api.patch(`/api/orders/${numId}/served`).then((r) => toFrontOrder(r.data)),
}

// ── Seat API ───────────────────────────────────────────

export const seatApi = {
  getAll: () =>
    api.get('/api/seats').then((r) => r.data.map(toFrontSeat)),

  updateStatus: (numId, frontStatus, customerCount) =>
    api.patch(`/api/seats/${numId}/status`, {
      status: toBackendSeatStatus(frontStatus),
      customerCount,
    }).then((r) => toFrontSeat(r.data)),
}
