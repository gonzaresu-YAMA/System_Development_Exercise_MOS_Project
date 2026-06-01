const initialRemainingSeconds = 11 * 60
const countdownStorageKey = 'mosRemainingUntil'

export const startStayTimer = () => {
  const initialUntil = Date.now() + initialRemainingSeconds * 1000
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
