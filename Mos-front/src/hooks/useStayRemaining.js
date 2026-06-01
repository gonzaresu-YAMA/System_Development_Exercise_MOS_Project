import { useEffect, useState } from 'react'
import { getRemainingSeconds } from '../utils/stayTimer'

export default function useStayRemaining() {
  const [remainingSeconds, setRemainingSeconds] = useState(() => getRemainingSeconds())

  useEffect(() => {
    const timerId = setInterval(() => {
      setRemainingSeconds(getRemainingSeconds())
    }, 1000)

    return () => clearInterval(timerId)
  }, [])

  return {
    remainingSeconds,
    isExpired: remainingSeconds <= 0
  }
}
