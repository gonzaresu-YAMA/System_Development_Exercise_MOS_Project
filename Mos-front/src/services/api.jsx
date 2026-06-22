import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('[API] Server error:', error.response.status, error.response.data)
    } else if (error.request) {
      console.error('[API] No response received:', error.request)
    } else {
      console.error('[API] Request setup error:', error.message)
    }
    return Promise.reject(error)
  }
)

// ── Menu API ──────────────────────────────────────────────

export const menuApi = {
  getCategories: () =>
    api.get('/api/menu/categories').then((r) => r.data),

  getItemsByCategory: (category) =>
    api.get('/api/menu/items', { params: { category } }).then((r) => r.data),

  getItemById: (id) =>
    api.get(`/api/menu/items/${id}`).then((r) => r.data),

  searchItems: (keyword) =>
    api.get('/api/menu/items/search', { params: { keyword } }).then((r) => r.data),

  getItemsByPriceRange: (min, max) =>
    api.get('/api/menu/items', { params: { minPrice: min, maxPrice: max } }).then((r) => r.data)
}

// ── Order API ─────────────────────────────────────────────

export const orderApi = {
  createOrder: (orderRequest) =>
    api.post('/api/orders', orderRequest).then((r) => r.data),

  getOrderById: (id) =>
    api.get(`/api/orders/${id}`).then((r) => r.data),

  getOrdersByTable: (tableId) =>
    api.get(`/api/orders/table/${tableId}`).then((r) => r.data),

  getTodayOrders: () =>
    api.get('/api/orders/today').then((r) => r.data),

  getActiveOrders: () =>
    api.get('/api/orders/active').then((r) => r.data),

  getKitchenOrders: () =>
    api.get('/api/orders/kitchen').then((r) => r.data),

  addItemsToOrder: (orderId, items) =>
    api.post(`/api/orders/${orderId}/items`, items).then((r) => r.data),

  updateOrderStatus: (orderId, status) =>
    api.patch(`/api/orders/${orderId}/status`, { status }).then((r) => r.data),

  confirmOrder: (orderId) =>
    api.patch(`/api/orders/${orderId}/confirm`).then((r) => r.data),

  startCooking: (orderId) =>
    api.patch(`/api/orders/${orderId}/cooking`).then((r) => r.data),

  markReady: (orderId) =>
    api.patch(`/api/orders/${orderId}/ready`).then((r) => r.data),

  markServed: (orderId) =>
    api.patch(`/api/orders/${orderId}/served`).then((r) => r.data),

  markPaid: (orderId) =>
    api.patch(`/api/orders/${orderId}/paid`).then((r) => r.data),

  cancelOrder: (orderId) =>
    api.patch(`/api/orders/${orderId}/cancel`).then((r) => r.data)
}

// ── Seat/Table API ────────────────────────────────────────

export const seatApi = {
  getAllSeats: () =>
    api.get('/api/seats').then((r) => r.data),

  getAvailableSeats: () =>
    api.get('/api/seats/available').then((r) => r.data),

  getSeatByNumber: (number) =>
    api.get(`/api/seats/${number}`).then((r) => r.data),

  getSeatByQrCode: (qrCode) =>
    api.get('/api/seats/qr', { params: { code: qrCode } }).then((r) => r.data),

  updateSeatStatus: (seatId, status) =>
    api.patch(`/api/seats/${seatId}/status`, { status }).then((r) => r.data)
}

// ── Receipt API ───────────────────────────────────────────

export const receiptApi = {
  getReceiptText: (orderId) =>
    api.get(`/api/receipts/${orderId}/text`).then((r) => r.data),

  getReceiptHtml: (orderId) =>
    api.get(`/api/receipts/${orderId}/html`).then((r) => r.data),

  downloadReceipt: (orderId) =>
    api.get(`/api/receipts/${orderId}/pdf`, { responseType: 'blob' }).then((r) => r.data)
}

export default api
