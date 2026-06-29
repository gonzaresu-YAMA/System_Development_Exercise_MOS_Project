/**
 * useStayRemaining.js — 滞在残り時間を管理するカスタムフック
 *
 * 「カスタムフック」とは?
 *   useState・useEffect などの React フックを組み合わせて、
 *   複数のコンポーネントで使い回せるロジックにまとめたものです。
 *   名前が use〇〇 で始まるのが慣習です。
 *
 * このフックを使う理由:
 *   飲み放題プランでは「残り時間が0になったら注文ボタンを無効化」する必要がある。
 *   この判定ロジックを MenuLayout・CategoryMenu・MenuPage などで毎回書くのは冗長なので、
 *   このカスタムフックにまとめて一か所で管理する。
 *
 * 使用例:
 *   const { isExpired, remainingSeconds, isUnlimited } = useStayRemaining()
 *   → isExpired が true になったら注文ボタンを disabled にする
 *
 * 使われているファイル:
 *   - components/MenuLayout.jsx
 *   - pages/CategoryMenu.jsx
 *   - pages/MenuPage.jsx
 *   - pages/ProductDetail.jsx
 *   - pages/OrderConfirmPage.jsx
 *   - pages/OrderSendPage.jsx
 */

import { useEffect, useState } from 'react'
import { getRemainingSeconds, isNormalPlan } from '../utils/stayTimer'

/**
 * 滞在残り時間を返すカスタムフック
 *
 * @returns {{
 *   remainingSeconds: number,  残り秒数（通常プランは Infinity）
 *   isExpired: boolean,        時間切れかどうか
 *   isUnlimited: boolean       無制限プラン（通常プラン）かどうか
 * }}
 */
export default function useStayRemaining() {
  // 通常プランかどうかを確認する（sessionStorage の selectedCourse を参照）
  const unlimited = isNormalPlan()

  // 残り秒数の状態を定義
  // useState の引数に「関数」を渡すと、初期値を遅延評価（初回レンダー時のみ実行）できる
  // → コンポーネントが何度再描画されても初期値の計算は1回だけ走る
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    unlimited
      ? Infinity             // 通常プランは「無限大」= 時間切れにならない
      : getRemainingSeconds() // 飲み放題プランは実際の残り秒数
  )

  // 1秒ごとに残り時間を更新するタイマーをセット
  useEffect(() => {
    // 通常プランならタイマーは不要（Infinity のまま変わらないため）
    if (unlimited) return

    // setInterval: 第2引数のミリ秒ごとに、第1引数の関数を繰り返し実行する
    // ここでは 1000ms (1秒) ごとに残り秒数を再計算して状態を更新する
    const id = setInterval(() => {
      setRemainingSeconds(getRemainingSeconds())
    }, 1000)

    // クリーンアップ関数: このエフェクトが再実行される前またはコンポーネント破棄時に呼ばれる
    // clearInterval でタイマーを止めないと、コンポーネントがなくなっても
    // タイマーが動き続けてメモリリークが発生する
    return () => clearInterval(id)
  }, [unlimited])
  // 依存配列 [unlimited] → unlimited の値が変わったときだけエフェクトを再実行
  // ※ unlimited はコース選択後に変わることはないため、実質的に初回のみ実行される

  return {
    remainingSeconds,

    // 通常プランは絶対に時間切れにならない（false 固定）
    // 飲み放題プランは残り秒数が 0 以下になったら時間切れ（true）
    isExpired: unlimited ? false : remainingSeconds <= 0,

    // 通常プランかどうかをそのまま返す（ヘッダーの表示切替などに使われる）
    isUnlimited: unlimited
  }
}
