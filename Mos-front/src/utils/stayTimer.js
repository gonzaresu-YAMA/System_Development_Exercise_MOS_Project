/**
 * stayTimer.js — 滞在時間タイマーのユーティリティ
 *
 * 「なぜこのファイルが必要か?」
 *   飲み放題プランには「2時間コース」「3時間コース」があり、
 *   制限時間を超えると注文ができなくなる仕様がある。
 *   このファイルはタイマーの開始・残り時間計算・時間切れ判定を一元管理する。
 *
 * 「なぜ sessionStorage を使うのか?」
 *   - localStorage と違い、ブラウザタブを閉じると自動的に消える
 *   - ページをリロードしてもタイマーが継続する（URLを入力し直しても時間が戻らない）
 *   - 「1回の来店セッション（タブを開いている間）」に限定したい今回の用途に最適
 *
 * sessionStorage に保存するデータ:
 *   - "mosRemainingUntil":  タイマーが終了する時刻（Unix ミリ秒）
 *   - "selectedCourse":     選択されたコース ('normal' / 'drink-2h' / 'drink-3h')
 *
 * タイマーの動作イメージ:
 *   コース選択確定 → startStayTimer() → "現在時刻 + コース時間" を保存
 *   毎秒カウント   → getRemainingSeconds() → "保存した終了時刻 - 現在時刻" を計算
 *   時間切れ判定   → isStayExpired() → 残り秒数 <= 0 かどうかチェック
 */

// sessionStorage のキー名を定数で管理する
// 文字列リテラルを直接使うとタイポ（typo）のミスが起きやすいため定数にしている
const countdownStorageKey = 'mosRemainingUntil'
const selectedCourseKey = 'selectedCourse'

// 通常プランは「時間制限なし」を表す大きな数値（1年 = 実質無制限）
// Infinity は sessionStorage に保存できない（文字列に変換すると "Infinity" になって
// Number() で戻したときに NaN になる恐れがある）ため、大きな数値で代用する
const FAR_FUTURE = 365 * 24 * 60 * 60 * 1000  // 単位: ミリ秒

/**
 * 選択されたコースに応じた制限時間（ミリ秒）を返す内部関数
 *
 * @returns {number} コースの制限時間（ミリ秒）
 */
const getDurationMs = () => {
  const course = sessionStorage.getItem(selectedCourseKey)
  if (course === 'drink-2h') return 120 * 60 * 1000  // 2時間 = 7,200,000 ms
  if (course === 'drink-3h') return 180 * 60 * 1000  // 3時間 = 10,800,000 ms
  return FAR_FUTURE  // 'normal' または未選択 → 実質無制限
}

/**
 * 現在のプランが「通常プラン」（時間制限なし）かどうかを返す
 *
 * コースが未選択（null）または 'normal' の場合は通常プランとみなす
 * → アプリ起動直後（コース選択前）は通常プラン扱いにして注文を可能にする
 *
 * @returns {boolean} 通常プランなら true、飲み放題プランなら false
 */
export const isNormalPlan = () => {
  const course = sessionStorage.getItem(selectedCourseKey)
  // !course → sessionStorage に値がない（null）場合も true になる
  return !course || course === 'normal'
}

/**
 * 滞在タイマーを開始する（コース選択確定時に呼ばれる）
 *
 * 「現在時刻 + コースの制限時間」を「タイマー終了時刻」として sessionStorage に保存する
 * → ページをリロードしても終了時刻は変わらないので、タイマーが継続される
 *
 * @returns {number} タイマーの終了時刻（Unix ミリ秒）
 */
export const startStayTimer = () => {
  const until = Date.now() + getDurationMs()
  // Number → String に変換して保存（sessionStorage は文字列しか保存できない）
  sessionStorage.setItem(countdownStorageKey, String(until))
  return until
}

/**
 * タイマーをリセットして再スタートする
 * startStayTimer と同じ動作（現在時刻からカウントをやり直す）
 * CourseSelectPage でコース選択確定時に呼ばれる
 */
export const resetStayTimer = () => startStayTimer()

/**
 * sessionStorage からタイマーの終了時刻（Unix ミリ秒）を取得する
 *
 * タイマーが未設定の場合は現在時刻を返す
 * → 「残り 0 秒」扱いになり、注文不可になるのを避けるためのフォールバック
 *
 * @returns {number} 終了時刻（Unix ミリ秒）
 */
export const getStayUntil = () => {
  // sessionStorage の値は文字列なので Number() で数値に変換する
  const stored = Number(sessionStorage.getItem(countdownStorageKey))
  // stored が 0（値なし・NaN など）の場合は Date.now() を返す
  return stored || Date.now()
}

/**
 * 滞在の残り時間を「秒」で返す
 *
 * 通常プランなら時間切れにならないよう FAR_FUTURE を秒換算した値を返す
 * 飲み放題プランなら「終了時刻 - 現在時刻」を秒に換算して返す
 *
 * Math.ceil: 小数点以下を切り上げる（0.5秒でも残っていれば1秒と表示する）
 * Math.max(0, ...): 負の値にならないようにする（時間切れ後は常に 0）
 *
 * @returns {number} 残り秒数（最小値は 0）
 */
export const getRemainingSeconds = () => {
  if (isNormalPlan()) return FAR_FUTURE / 1000
  const diff = Math.ceil((getStayUntil() - Date.now()) / 1000)
  return Math.max(0, diff)
}

/**
 * 滞在時間が終了しているかどうかを返す
 *
 * addToCart や confirmOrder の先頭で呼ばれ、
 * 時間切れ後の注文操作を禁止するためのガードとして使われる
 *
 * @returns {boolean} 時間切れなら true、まだ時間があるなら false
 */
export const isStayExpired = () => {
  if (isNormalPlan()) return false  // 通常プランは絶対に時間切れにならない
  return getRemainingSeconds() <= 0
}
