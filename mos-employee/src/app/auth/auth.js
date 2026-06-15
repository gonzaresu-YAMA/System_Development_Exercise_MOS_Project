const USER_KEY = 'currentUser_v1'
const USECASE_KEY = 'currentUseCase_v1'

export function getUser() {
  const raw = sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setUser(user) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearUser() {
  sessionStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(USECASE_KEY)
}

export function getUseCase() {
  return sessionStorage.getItem(USECASE_KEY) || null
}

export function setUseCase(useCase) {
  sessionStorage.setItem(USECASE_KEY, useCase)
}

export function clearUseCase() {
  sessionStorage.removeItem(USECASE_KEY)
}
