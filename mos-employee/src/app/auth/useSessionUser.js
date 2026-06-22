// セッション操作を UI 側から使いやすくする薄いラッパー
// 画面コンポーネントが sessionStorage 実装に直接依存しないようにするための層

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
