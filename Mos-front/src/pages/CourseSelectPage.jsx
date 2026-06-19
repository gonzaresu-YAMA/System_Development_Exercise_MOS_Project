import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resetStayTimer } from '../utils/stayTimer'
import '../App.css'
import '../menu.css'

const rootPlans = [
  { id: 'normal', label: '通常プラン', description: '通常の注文を利用します' },
  { id: 'drink', label: '飲み放題プラン', description: '時間コースを選択します' }
]

const drinkPlans = [
  { id: 'drink-2h', label: '2時間コース' },
  { id: 'drink-3h', label: '3時間コース' }
]

export default function CourseSelectPage() {
  const [step, setStep] = useState('root')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingCourse, setPendingCourse] = useState(null)
  const navigate = useNavigate()

  const openConfirm = (course) => {
    setPendingCourse(course)
    setIsConfirmOpen(true)
  }

  const closeConfirm = () => {
    setIsConfirmOpen(false)
    setPendingCourse(null)
  }

  const finalizeCourse = () => {
    if (!pendingCourse) return
    sessionStorage.setItem('selectedCourse', pendingCourse.id)
    sessionStorage.setItem('selectedCourseLabel', pendingCourse.label)
    resetStayTimer()
    navigate('/menu')
  }

  return (
    <div className="course-screen">
      <div className="course-card">
        <p className="course-eyebrow">COURSE SELECT</p>
        <h1 className="course-title">コース選択</h1>
        <div className="course-divider" />
        <p className="course-subtitle">
          {step === 'root'
            ? '通常プランか飲み放題プランを選択してください'
            : '飲み放題の時間コースを選択してください'}
        </p>

        {step === 'root' && (
          <div className="course-options">
            {rootPlans.map((course) => (
              <button
                key={course.id}
                type="button"
                className="course-option"
                onClick={() => {
                  if (course.id === 'drink') {
                    setStep('drink')
                    return
                  }
                  openConfirm({ id: course.id, label: course.label })
                }}
              >
                <span className="course-label">{course.label}</span>
                <span className="course-desc">{course.description}</span>
              </button>
            ))}
          </div>
        )}

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

      {isConfirmOpen && pendingCourse && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p>{`${pendingCourse.label}でよろしいですか？`}</p>
            <div className="modal-actions">
              <button type="button" className="modal-button" onClick={finalizeCourse}>
                確定する
              </button>
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
