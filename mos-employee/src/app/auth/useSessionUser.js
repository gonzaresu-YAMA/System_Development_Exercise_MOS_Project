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
