import { useState } from 'react'

export function useNavStack(initial) {
  const [stack, setStack] = useState([initial])

  const current = stack[stack.length - 1]

  const push = (next) => {
    setStack((s) => (s[s.length - 1] === next ? s : [...s, next]))
  }

  const back = () => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  }

  const reset = (next) => {
    setStack([next])
  }

  return {
    current,
    push,
    back,
    reset,
    canBack: stack.length > 1,
  }
}