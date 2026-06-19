import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import { CartContext } from '../CartContext'
import useStayRemaining from '../hooks/useStayRemaining'
import '../App.css'
import '../menu.css'

export default function OrderSendPage() {
  const { cartItems, confirmOrder, orderHistory } = useContext(CartContext)
  const navigate = useNavigate()
  const [isSent, setIsSent] = useState(false)
  const [warningType, setWarningType] = useState(null)
  const [pendingConfirm, setPendingConfirm] = useState(false)
  const { isExpired } = useStayRemaining()

  useEffect(() => {
    if (cartItems.length === 0 && !isSent) navigate('/menu')
  }, [cartItems, isSent, navigate])

  useEffect(() => {
    if (!isSent) return
    const id = setTimeout(() => navigate('/menu'), 2300)
    return () => clearTimeout(id)
  }, [isSent, navigate])

  useEffect(() => {
    if (cartItems.length === 0) {
      setWarningType(null)
      setPendingConfirm(false)
    }
  }, [cartItems])

  const proceedConfirm = async () => {
    const didConfirm = await confirmOrder()
    if (!didConfirm) {
      navigate('/menu')
      return
    }
    setIsSent(true)
  }

  const handleWarningContinue = () => {
    setWarningType(null)
    if (pendingConfirm) {
      setPendingConfirm(false)
      sessionStorage.setItem('lastOrderAttemptAt', String(Date.now()))
      proceedConfirm()
    }
  }

  const handleConfirm = () => {
    if (isExpired || cartItems.length === 0) {
      navigate('/menu')
      return
    }

    const buildSig = (items) =>
      Object.entries(
        items.reduce((acc, i) => { acc[i.name] = (acc[i.name] || 0) + 1; return acc }, {})
      ).sort(([a], [b]) => a.localeCompare(b)).map(([n, q]) => `${n}:${q}`).join('|')

    const currentSig = buildSig(cartItems)
    const hasDuplicate = orderHistory.slice(0, 5).some((o) => buildSig(o.items) === currentSig)
    const lastAttempt = Number(sessionStorage.getItem('lastOrderAttemptAt'))
    const hasRapid = Boolean(lastAttempt && Date.now() - lastAttempt < 1000)

    if (hasDuplicate || hasRapid) {
      setWarningType(hasRapid ? 'rapid' : 'history')
      setPendingConfirm(true)
      return
    }

    sessionStorage.setItem('lastOrderAttemptAt', String(Date.now()))
    proceedConfirm()
  }

  return (
    <MenuLayout activeTab="send">
      {!isSent && !warningType && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p>注文を確定して送信しますか？</p>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-button"
                onClick={handleConfirm}
                disabled={cartItems.length === 0 || isExpired}
              >
                送信する
              </button>
              <Link to="/menu" className="modal-button is-dark">キャンセル</Link>
            </div>
          </div>
        </div>
      )}

      {warningType && !isSent && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p>
              注文が重複している可能性があります。
              {warningType === 'history' && <><br />過去5件以内に同じ注文があります。</>}
              {warningType === 'rapid' && <><br />1秒以内に同じ操作が行われています。</>}
              <br />続行しますか？
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-button" onClick={handleWarningContinue}>
                続行する
              </button>
              <Link
                to="/menu"
                className="modal-button is-dark"
                onClick={() => { setWarningType(null); setPendingConfirm(false) }}
              >
                キャンセル
              </Link>
            </div>
          </div>
        </div>
      )}

      {isSent && (
        <div className="toast-overlay" role="status" aria-live="polite">
          <div className="toast-card">
            ご注文を承りました
            <br />
            メニュー画面へ戻ります
          </div>
        </div>
      )}
    </MenuLayout>
  )
}
