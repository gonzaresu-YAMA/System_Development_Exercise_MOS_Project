/**
 * 座席ドメイン操作レイヤー
 *
 * 座席のステータス定数・バックエンドからの取得・ローカル状態更新を担当する。
 *
 * seatStore のデータ構造:
 *   {
 *     floors: {
 *       1: [{ id, status, people, floor, _numId }, ...],  // 1階の座席
 *       2: [...]                                          // 2階の座席
 *     }
 *   }
 *
 * フロア別に管理する理由:
 *   Seats.jsx で「1階」「2階」を切り替えて表示するため
 */
import { seatApi } from '../../services/api.js'

// ── ステータス定数 ─────────────────────────────────────────
// 英字キーで管理し、表示用ラベルと色は別途マッピングする（Magic String を避ける）
export const SEAT_STATUS = {
  empty: 'empty',  // 空席（使用可能）
  using: 'using',  // 使用中
  paid:  'paid',   // 会計済（バッシング待ち）
  stop:  'stop',   // 停止中（清掃・故障など）
}

// ステータスの表示用メタデータリスト（フィルタボタン生成などに使用）
export const SEAT_STATUS_LIST = [
  { key: SEAT_STATUS.empty, label: '空席',   color: 'green' },
  { key: SEAT_STATUS.using, label: '使用中', color: 'red' },
  { key: SEAT_STATUS.paid,  label: '会計済', color: 'yellow' },
  { key: SEAT_STATUS.stop,  label: '停止中', color: 'black' },
]

// Object.fromEntries で配列からオブジェクトに変換（例: { empty: '空席', using: '使用中', ... }）
export const SEAT_STATUS_LABEL = Object.fromEntries(SEAT_STATUS_LIST.map((s) => [s.key, s.label]))
export const SEAT_STATUS_COLOR = Object.fromEntries(SEAT_STATUS_LIST.map((s) => [s.key, s.color]))

// ストア構造の初期値（フロア1・2とも空配列）
function buildEmptyStore() {
  return { floors: { 1: [], 2: [] } }
}

/**
 * バックエンドから全座席を取得し、フロア別のストア構造に変換して返す
 *
 * seat.floor が null の場合は 1階として扱う（バックエンドのデフォルト対応）
 */
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

/** 座席保存は不要（変更のたびに直接 API を呼ぶため） */
export function saveSeatStore() {}

/** 指定フロアの座席配列を取得（store または floor が undefined の場合は空配列） */
export function getSeatsByFloor(store, floor) {
  return store?.floors?.[floor] || []
}

/**
 * ストア内の特定座席を新しい情報で置き換えた新しいストアを返す（イミュータブル更新）
 *
 * イミュータブルにする理由:
 *   React の状態は直接変更せず新しいオブジェクトを返すことで
 *   再レンダリングが正しく検知される（setState が変化を検知できる）
 */
export function updateSeatInStore(store, floor, nextSeat) {
  const floors = { ...store.floors }
  floors[floor] = (floors[floor] || []).map((s) =>
    s.id === nextSeat.id ? nextSeat : s
  )
  return { ...store, floors }
}
