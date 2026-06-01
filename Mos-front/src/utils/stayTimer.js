const initialRemainingSeconds = 1 * 60
const countdownStorageKey = 'mosRemainingUntil'

export const getStayUntil = () => {
  const storedUntil = Number(sessionStorage.getItem(countdownStorageKey))
  const now = Date.now()

  if (storedUntil) {
    return storedUntil
  }

  const initialUntil = now + initialRemainingSeconds * 1000
  sessionStorage.setItem(countdownStorageKey, String(initialUntil))
  return initialUntil
}

export const getRemainingSeconds = () => {
  const until = getStayUntil()
  const diffSeconds = Math.ceil((until - Date.now()) / 1000)
  return Math.max(0, diffSeconds)
}

export const isStayExpired = () => getRemainingSeconds() <= 0
