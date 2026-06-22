import { useEffect, useState } from 'react'
import { getRemainingSeconds, isNormalPlan } from '../utils/stayTimer'

export default function useStayRemaining() {
  const unlimited = isNormalPlan()
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    unlimited ? Infinity : getRemainingSeconds()
  )

  useEffect(() => {
    if (unlimited) return
    const id = setInterval(() => {
      setRemainingSeconds(getRemainingSeconds())
    }, 1000)
    return () => clearInterval(id)
  }, [unlimited])

  return {
    remainingSeconds,
    isExpired: unlimited ? false : remainingSeconds <= 0,
    isUnlimited: unlimited
  }
}
