/**
 * セッション認証ユーティリティ
 *
 * ログイン情報（ユーザー情報・ユースケース選択）を sessionStorage に保存する。
 *
 * sessionStorage を使う理由:
 *   - ブラウザタブを閉じると自動的にクリアされる（セキュリティ上安全）
 *   - ページリロードをまたいで情報を保持できる
 *   - localStorage と異なり、タブ間で共有されない（別タブで別スタッフが使える）
 *
 * キーに "_v1" サフィックスを付けている理由:
 *   データ構造を変更した際に古いキーと衝突しないようにするため
 */
const USER_KEY = 'currentUser_v1'
const USECASE_KEY = 'currentUseCase_v1'

/** ログイン中のユーザーオブジェクトを取得。未ログインなら null を返す */
export function getUser() {
  const raw = sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    // JSON.parse が失敗した場合（データが壊れた場合）も null を返してクラッシュを防ぐ
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** ログインユーザーを sessionStorage に保存（オブジェクトを JSON 文字列に変換して保存） */
export function setUser(user) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

/** ログアウト: ユーザーとユースケースを両方クリア */
export function clearUser() {
  sessionStorage.removeItem(USER_KEY)
  // ユースケース（hall/kitchen/admin）もセットでリセットする
  sessionStorage.removeItem(USECASE_KEY)
}

/** 現在選択中のユースケース（'hall' | 'kitchen' | 'admin'）を取得 */
export function getUseCase() {
  return sessionStorage.getItem(USECASE_KEY) || null
}

/** ユースケースを保存（用途選択画面で選んだ後に呼ばれる） */
export function setUseCase(useCase) {
  sessionStorage.setItem(USECASE_KEY, useCase)
}

/** ユースケースのみリセット（「用途変更」ボタン押下時に使用） */
export function clearUseCase() {
  sessionStorage.removeItem(USECASE_KEY)
}
