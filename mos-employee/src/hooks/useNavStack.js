// 画面履歴をスタックとして管理するカスタムフック
// - push : 次の画面へ進む
// - back : ひとつ前に戻る
// - reset: 履歴を初期化する

import { useState } from 'react'

export function useNavStack(initial) {
  const [stack, setStack] = useState([initial])

  // 現在表示中の画面名
  const current = stack[stack.length - 1]

  // 同じ画面を連続で push しないようにしている
  const push = (next) => {
    setStack((s) => (s[s.length - 1] === next ? s : [...s, next]))
  }

  // 1つ前の画面へ戻る。先頭ならそのまま
  const back = () => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  }

  // 用途変更などで履歴をリセットする
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
