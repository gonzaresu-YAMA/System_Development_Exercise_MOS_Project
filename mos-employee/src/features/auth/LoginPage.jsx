import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authenticate } from '../../domain/staff/staffDb'
import { setUser, clearUseCase } from '../../app/auth/auth'
import '../../styles/app.css'

function LoginPage() {
  const navigate = useNavigate()

  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(() => id.trim() && pw.trim() && !loading, [id, pw, loading])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await authenticate(id.trim(), pw)
      if (!result.ok) {
        setError(result.reason)
        return
      }
      setUser(result.user)
      clearUseCase()
      navigate('/employee', { replace: true })
    } catch {
      setError('サーバーに接続できません')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="blackBanner">
        <h1>居酒屋みどり亭</h1>
      </div>

      <form className="loginCard" onSubmit={handleLogin}>
        <div className="loginTitle">ログイン</div>

        <div className="inputGroup">
          <input
            type="text"
            placeholder="ID（例：S000001 / A000001）"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="inputGroup">
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="errorBanner">
            {error}
          </div>
        )}

        <button className="primaryBtn" type="submit" disabled={!canSubmit}>
          ログイン
        </button>

        <div className="helpText">※役職はIDに紐づいて自動判定されます</div>
      </form>
    </>
  )
}

export default LoginPage
