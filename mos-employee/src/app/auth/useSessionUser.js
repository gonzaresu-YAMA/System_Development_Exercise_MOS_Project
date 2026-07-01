/**
 * セッション操作をまとめたカスタムフック
 *
 * auth.js の関数群をひとつのオブジェクトとして返す。
 * コンポーネントから `const session = useSessionUser()` と書くだけで
 * session.getUser(), session.setUser(...), session.clearUser() などが使えるようになる。
 *
 * なぜフックにするのか:
 *   auth.js をそのまま import しても同じ効果だが、
 *   useSessionUser としてまとめることでコンポーネント側の import が1行になり、
 *   将来 useState や useContext と組み合わせて拡張しやすくなる。
 */
import {
  getUser,
  setUser,
  clearUser,
  getUseCase,
  setUseCase,
  clearUseCase,
} from './auth'

export function useSessionUser() {
  return {
    getUser,
    setUser,
    clearUser,
    getUseCase,
    setUseCase,
    clearUseCase,
  }
}
