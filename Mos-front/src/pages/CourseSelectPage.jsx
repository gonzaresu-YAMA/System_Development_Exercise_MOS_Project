/**
 * CourseSelectPage.jsx — コース選択ページ
 *
 * アクセス URL: /course
 *
 * 役割:
 *   お客様がどのプランで利用するかを選択する画面。
 *   選択結果は sessionStorage に保存され、以降の画面で参照される。
 *
 * 画面遷移のステップ（2段階選択 UI）:
 *   Step 1 (step='root'):  「通常プラン」か「飲み放題プラン」を選ぶ
 *     → 「通常プラン」を選んだ場合: 確認モーダル表示 → 確定で /menu へ
 *     → 「飲み放題プラン」を選んだ場合: Step 2 に進む
 *
 *   Step 2 (step='drink'): 「2時間コース」か「3時間コース」を選ぶ
 *     → どちらかを選ぶと確認モーダル表示 → 確定で /menu へ
 *     → 「プランを選びなおす」で Step 1 に戻る
 *
 * 「なぜ2段階にするのか?」
 *   一画面に全選択肢を並べると複雑になる。
 *   Step 1 で大まかな分類（通常 or 飲み放題）を選んでから
 *   Step 2 で詳細（時間コース）を選ぶことでシンプルに見せる。
 *
 * sessionStorage に保存するデータ:
 *   selectedCourse:      選択されたコースID ('normal', 'drink-2h', 'drink-3h')
 *   selectedCourseLabel: 表示用ラベル（例: '2時間コース'）
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resetStayTimer } from '../utils/stayTimer'
import '../App.css'
import '../menu.css'

// Step 1 で表示するプラン選択肢（通常 or 飲み放題）
const rootPlans = [
  { id: 'normal', label: '通常プラン',   description: '通常の注文を利用します' },
  { id: 'drink',  label: '飲み放題プラン', description: '時間コースを選択します' }
]

// Step 2 で表示する飲み放題コース選択肢（2時間 or 3時間）
const drinkPlans = [
  { id: 'drink-2h', label: '2時間コース' },
  { id: 'drink-3h', label: '3時間コース' }
]

export default function CourseSelectPage() {
  // step: 現在どのステップを表示しているか
  //   'root'  → Step 1（通常 or 飲み放題を選ぶ）
  //   'drink' → Step 2（2時間 or 3時間を選ぶ）
  const [step, setStep] = useState('root')

  // isConfirmOpen: 確認モーダルを表示するかどうかのフラグ
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // pendingCourse: 確認待ち中のコース選択肢。モーダルで表示するプラン名に使う。
  // null の場合はまだ選択していない状態
  const [pendingCourse, setPendingCourse] = useState(null)

  // useNavigate: プログラムから画面遷移するための関数を取得する
  const navigate = useNavigate()

  /**
   * コースを選んで確認モーダルを開く
   * @param {{ id: string, label: string }} course - 選択されたコース
   */
  const openConfirm = (course) => {
    setPendingCourse(course)  // 確認モーダルに表示するコースをセット
    setIsConfirmOpen(true)    // モーダルを表示する
  }

  /** 確認モーダルを閉じてコース選択をキャンセルする */
  const closeConfirm = () => {
    setIsConfirmOpen(false)
    setPendingCourse(null) // 選択中コースをリセット
  }

  /**
   * コース選択を確定してメニューページへ遷移する
   *
   * 処理の流れ:
   *   1. sessionStorage に選択コースを保存する（全ページで参照できるようにする）
   *   2. 滞在タイマーをリセット・スタートする（飲み放題のカウントダウン開始）
   *   3. /menu に遷移する
   */
  const finalizeCourse = () => {
    if (!pendingCourse) return // 選択中コースがない場合は何もしない（安全ガード）

    // sessionStorage に保存することで、ページをまたいでコース情報を参照できる
    sessionStorage.setItem('selectedCourse', pendingCourse.id)
    sessionStorage.setItem('selectedCourseLabel', pendingCourse.label)

    // タイマーリセット: 選択したコースの制限時間でカウントダウンを開始する
    // 通常プランでは resetStayTimer() を呼んでも実質無制限（1年後）にセットされるだけ
    resetStayTimer()

    // メニューページへ遷移
    navigate('/menu')
  }

  return (
    <div className="course-screen">
      <div className="course-card">
        <p className="course-eyebrow">COURSE SELECT</p>
        <h1 className="course-title">コース選択</h1>
        <div className="course-divider" />

        {/* ステップに応じてサブタイトルを切り替える */}
        <p className="course-subtitle">
          {step === 'root'
            ? '通常プランか飲み放題プランを選択してください'
            : '飲み放題の時間コースを選択してください'}
        </p>

        {/* ── Step 1: 通常プラン or 飲み放題プランを選ぶ ── */}
        {step === 'root' && (
          <div className="course-options">
            {rootPlans.map((course) => (
              <button
                key={course.id}    // key: Reactがリストの要素を追跡するために必要
                type="button"
                className="course-option"
                onClick={() => {
                  if (course.id === 'drink') {
                    // 「飲み放題プラン」を選んだ場合は Step 2 へ進む
                    setStep('drink')
                    return
                  }
                  // 「通常プラン」を選んだ場合は確認モーダルを開く
                  openConfirm({ id: course.id, label: course.label })
                }}
              >
                <span className="course-label">{course.label}</span>
                <span className="course-desc">{course.description}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 2: 2時間コース or 3時間コースを選ぶ ── */}
        {step === 'drink' && (
          <div className="course-actions">
            {drinkPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                className="course-action"
                onClick={() => openConfirm({ id: plan.id, label: plan.label })}
              >
                {plan.label}
              </button>
            ))}

            {/* 選びなおしボタン: Step 1 に戻る */}
            <button
              type="button"
              className="course-action is-secondary"
              onClick={() => setStep('root')}
            >
              プランを選びなおす
            </button>
          </div>
        )}
      </div>

      {/*
        確認モーダル
        isConfirmOpen と pendingCourse の両方が true のときだけ表示する
        （&& 演算子を使った条件付きレンダリング）
      */}
      {isConfirmOpen && pendingCourse && (
        <div className="modal-overlay">
          <div className="modal-card">
            {/* テンプレートリテラルでコース名を動的に表示 */}
            <p>{`${pendingCourse.label}でよろしいですか？`}</p>
            <div className="modal-actions">
              {/* 確定ボタン: finalizeCourse を呼んでメニューへ遷移 */}
              <button type="button" className="modal-button" onClick={finalizeCourse}>
                確定する
              </button>
              {/* キャンセルボタン: モーダルを閉じて選択に戻る */}
              <button type="button" className="modal-button is-dark" onClick={closeConfirm}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
