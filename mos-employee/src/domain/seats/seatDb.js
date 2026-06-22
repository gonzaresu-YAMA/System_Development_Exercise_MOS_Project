import { seatApi } from '../../services/api.js'

export const SEAT_STATUS = {
  empty: 'empty',
  using: 'using',
  paid: 'paid',
  stop: 'stop',
}

export const SEAT_STATUS_LIST = [
  { key: SEAT_STATUS.empty, label: '空席', color: 'green' },
  { key: SEAT_STATUS.using, label: '使用中', color: 'red' },
  { key: SEAT_STATUS.paid, label: '会計済', color: 'yellow' },
  { key: SEAT_STATUS.stop, label: '停止中', color: 'black' },
]

export const SEAT_STATUS_LABEL = Object.fromEntries(SEAT_STATUS_LIST.map((s) => [s.key, s.label]))
export const SEAT_STATUS_COLOR = Object.fromEntries(SEAT_STATUS_LIST.map((s) => [s.key, s.color]))

function buildEmptyStore() {
  return { floors: { 1: [], 2: [] } }
}

/** API から全座席を取得し、フロア別のストア構造に変換 */
export async function loadSeatStore() {
  const seats = await seatApi.getAll()
  const store = buildEmptyStore()
  for (const seat of seats) {
    const f = seat.floor ?? 1
    if (!store.floors[f]) store.floors[f] = []
    store.floors[f].push(seat)
  }
  return store
}

/** saveSeatStore は不要（各変更操作で直接 API を呼ぶ） */
export function saveSeatStore() {}

export function getSeatsByFloor(store, floor) {
  return store?.floors?.[floor] || []
}

export function updateSeatInStore(store, floor, nextSeat) {
  const floors = { ...store.floors }
  floors[floor] = (floors[floor] || []).map((s) =>
    s.id === nextSeat.id ? nextSeat : s
  )
  return { ...store, floors }
}


export function updateSeatInStore(store, floor, nextSeat) {
  const current = getSeatsByFloor(store, floor)
  return {
    ...store,
    floors: {
      ...store.floors,
      [floor]: current.map((seat) => (seat.id === nextSeat.id ? nextSeat : seat)),
    },
  }
}
