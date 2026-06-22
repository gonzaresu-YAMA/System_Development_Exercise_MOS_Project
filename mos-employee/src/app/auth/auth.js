// セッション管理専用ファイル
// - 現在ログイン中のユーザー情報を sessionStorage に保存する
// - 現在選択中の用途（hall / kitchen / admin）も保存する
// 将来 DB / API 接続する時も、UI 側はこの窓口だけ触ればよいようにしている

const USER_KEY = 'currentUser_v1'
const USECASE_KEY = 'currentUseCase_v1'

// 現在ユーザーを取得する
export function getUser() {
  const raw = sessionStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// 現在ユーザーを保存する
export function setUser(user) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

// ログアウト時にユーザー情報と用途を消す
export function clearUser() {
  sessionStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(USECASE_KEY)
}

// 現在選択中の用途を取得する
export function getUseCase() {
  return sessionStorage.getItem(USECASE_KEY) || null
}

// 現在選択中の用途を保存する
export function setUseCase(useCase) {
  sessionStorage.setItem(USECASE_KEY, useCase)
}

// 用途だけ消す（用途変更時に使う）
export function clearUseCase() {
  sessionStorage.removeItem(USECASE_KEY)
}
