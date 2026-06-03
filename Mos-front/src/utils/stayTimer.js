const defaultRemainingSeconds = 90 * 60
const countdownStorageKey = 'mosRemainingUntil'
const selectedCourseKey = 'selectedCourse'

const getInitialRemainingSeconds = () => {
  const selectedCourse = sessionStorage.getItem(selectedCourseKey)

  if (selectedCourse === 'drink-2h') return 120 * 60
  if (selectedCourse === 'drink-3h') return 180 * 60
  if (selectedCourse === 'normal') return 90 * 60

  return defaultRemainingSeconds
}

export const startStayTimer = () => {
  const initialUntil = Date.now() + getInitialRemainingSeconds() * 1000
  sessionStorage.setItem(countdownStorageKey, String(initialUntil))
  return initialUntil
}

export const resetStayTimer = () => startStayTimer()

export const getStayUntil = () => {
  const storedUntil = Number(sessionStorage.getItem(countdownStorageKey))

  if (storedUntil) {
    return storedUntil
  }

  return Date.now()
}

export const getRemainingSeconds = () => {
  const until = getStayUntil()
  const diffSeconds = Math.ceil((until - Date.now()) / 1000)
  return Math.max(0, diffSeconds)
}

export const isStayExpired = () => getRemainingSeconds() <= 0
