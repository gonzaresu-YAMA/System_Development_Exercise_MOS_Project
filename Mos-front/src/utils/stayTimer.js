const countdownStorageKey = 'mosRemainingUntil'
const selectedCourseKey = 'selectedCourse'

const FAR_FUTURE = 365 * 24 * 60 * 60 * 1000  // 実質無制限 (1年)

const getDurationMs = () => {
  const course = sessionStorage.getItem(selectedCourseKey)
  if (course === 'drink-2h') return 120 * 60 * 1000
  if (course === 'drink-3h') return 180 * 60 * 1000
  return FAR_FUTURE  // normal または未選択 → 無制限
}

export const isNormalPlan = () => {
  const course = sessionStorage.getItem(selectedCourseKey)
  return !course || course === 'normal'
}

export const startStayTimer = () => {
  const until = Date.now() + getDurationMs()
  sessionStorage.setItem(countdownStorageKey, String(until))
  return until
}

export const resetStayTimer = () => startStayTimer()

export const getStayUntil = () => {
  const stored = Number(sessionStorage.getItem(countdownStorageKey))
  return stored || Date.now()
}

export const getRemainingSeconds = () => {
  if (isNormalPlan()) return FAR_FUTURE / 1000
  const diff = Math.ceil((getStayUntil() - Date.now()) / 1000)
  return Math.max(0, diff)
}

export const isStayExpired = () => {
  if (isNormalPlan()) return false
  return getRemainingSeconds() <= 0
}
