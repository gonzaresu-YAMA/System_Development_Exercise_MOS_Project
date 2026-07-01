/**
 * ログイン画面（スタッフ向け）
 *
 * 画面構成:
 *   [黒バナー] 居酒屋みどり亭
 *   [ログインカード]
 *     - スタッフID入力（例: S000001 / A000001）
 *     - パスワード入力
 *     - エラーメッセージ表示エリア
 *     - ログインボタン（ID・PW 両方入力済みかつ非送信中のみ押せる）
 *
 * ログインフロー:
 *   1. ユーザーが ID と PW を入力
 *   2. ログインボタン押下 → handleLogin が発火
 *   3. authenticate(id, pw) でバックエンド認証
 *   4. 成功: setUser でセッションに保存 → /employee へ遷移
 *   5. 失敗: エラーメッセージをフォームに表示
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authenticate } from '../../domain/staff/staffDb'
import { setUser, clearUseCase } from '../../app/auth/auth'
import '../../styles/app.css'

function LoginPage() {
  const navigate = useNavigate()

  // フォーム入力値
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  // エラーメッセージ（空文字 = エラーなし）
  const [error, setError] = useState('')
  // 送信中フラグ（二重送信防止）
  const [loading, setLoading] = useState(false)

  // ボタンの活性/非活性を計算
  // useMemo を使って id/pw/loading が変わったときだけ再計算する
  const canSubmit = useMemo(() => id.trim() && pw.trim() && !loading, [id, pw, loading])

  const handleLogin = async (e) => {
    // フォームのデフォルト送信（ページリロード）を止める
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // バックエンドに認証リクエストを送信
      const result = await authenticate(id.trim(), pw)
      if (!result.ok) {
        // 認証失敗（ID/PW 不一致など）: サーバーが返したメッセージを表示
        setError(result.reason)
        return
      }
      // 認証成功: セッションにユーザー情報を保存
      setUser(result.user)
      // 用途（hall/kitchen/admin）は再選択させるためクリア
      clearUseCase()
      // 業務メイン画面へ遷移（replace: true でブラウザの戻るボタンでログイン画面に戻れないようにする）
      navigate('/employee', { replace: true })
    } catch {
      // ネットワークエラーなど予期しない例外
      setError('サーバーに接続できません')
    } finally {
      // 成功・失敗どちらでも送信中フラグを解除
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
            // autoComplete でブラウザのパスワードマネージャが補完できるようにする
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

        {/* エラーメッセージ: error が空文字でないときだけ描画される */}
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
