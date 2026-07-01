/**
 * スタック型のナビゲーション管理カスタムフック
 *
 * React Router の useNavigate とは異なり、URL を変えずに
 * コンポーネント内部で「どの画面を表示するか」を管理する。
 *
 * AppShell が 'admin' 用途に切り替えた後、
 * adminHub → menu → staff と画面をスタックで積み上げ、
 * 「戻る」ボタンで一つ前の画面に戻れるようにしている。
 *
 * スタック操作のイメージ:
 *   初期状態: ['adminHub']  ← current = 'adminHub'
 *   push('menu')  → ['adminHub', 'menu']           current = 'menu'
 *   push('staff') → ['adminHub', 'menu', 'staff']  current = 'staff'
 *   back()        → ['adminHub', 'menu']            current = 'menu'
 *   reset('adminHub') → ['adminHub']               current = 'adminHub'
 *
 * @param {string} initial - 初期画面のキー
 */
import { useState } from 'react'

export function useNavStack(initial) {
  // スタック配列。最後の要素が現在表示中の画面
  const [stack, setStack] = useState([initial])

  // 配列の末尾が現在の画面
  const current = stack[stack.length - 1]

  // 新しい画面をスタックに積む（同じ画面を二重に積まない）
  const push = (next) => {
    setStack((s) => (s[s.length - 1] === next ? s : [...s, next]))
  }

  // 一つ前の画面に戻る（スタックが1件しかなければ何もしない）
  const back = () => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  }

  // スタックを完全にリセットして特定画面から再スタート
  const reset = (next) => {
    setStack([next])
  }

  return {
    current,             // 現在表示すべき画面のキー
    push,                // 画面を追加
    back,                // 一つ戻る
    reset,               // 全リセット
    canBack: stack.length > 1,  // 「戻る」ボタンを表示するかどうか
  }
}