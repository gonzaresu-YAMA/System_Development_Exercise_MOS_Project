// 座席データの正本
// 役割：
// - フロアごとの座席一覧を保存 / 読み込みする
// - status と people を正規化する
// - 特定フロアの座席取得 / 座席更新を共通化する

const SEAT_STORAGE_KEY = 'seatStore_v2'

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

// フロアごとの初期座席を作る
function makeSeatsForFloor(floor) {
  const start = floor === 1 ? 101 : 201
  const count = 12

  return Array.from({ length: count }, (_, i) => ({
    id: `T${start + i}`,
    status: SEAT_STATUS.empty,
    people: 0,
  }))
}

// 保存データを正規化する
function normalizeSeat(seat, index, floor) {
  const fallbackId = `T${(floor === 1 ? 101 : 201) + index}`
  return {
    id: seat?.id || fallbackId,
    status: seat?.status || SEAT_STATUS.empty,
    people: Number.isFinite(Number(seat?.people)) ? Math.max(0, Number(seat.people)) : 0,
  }
}

function buildDefaultStore() {
  return {
    floors: {
      1: makeSeatsForFloor(1),
      2: makeSeatsForFloor(2),
    },
  }
}

// 座席ストアを読み込む
export function loadSeatStore() {
  const raw = sessionStorage.getItem(SEAT_STORAGE_KEY)
  const fallback = buildDefaultStore()

  if (!raw) {
    sessionStorage.setItem(SEAT_STORAGE_KEY, JSON.stringify(fallback))
    return fallback
  }

  try {
    const parsed = JSON.parse(raw)
    return {
      floors: {
        1: Array.isArray(parsed?.floors?.[1])
          ? parsed.floors[1].map((s, i) => normalizeSeat(s, i, 1))
          : makeSeatsForFloor(1),
        2: Array.isArray(parsed?.floors?.[2])
          ? parsed.floors[2].map((s, i) => normalizeSeat(s, i, 2))
          : makeSeatsForFloor(2),
      },
    }
  } catch {
    return fallback
  }
}

// 座席ストアを保存する
export function saveSeatStore(store) {
  sessionStorage.setItem(SEAT_STORAGE_KEY, JSON.stringify(store))
}

// 特定フロアの座席一覧を返す
export function getSeatsByFloor(store, floor) {
  return store?.floors?.[floor] || []
}

// 特定フロアの 1 席だけ更新した新しい store を返す
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
