/**
 * Home.jsx — ホーム画面（アプリの最初の画面）
 *
 * アクセス URL: /
 * アクセス URL（QRコード経由）: /?code=<座席のQRコード>
 *
 * 表示内容:
 *   - 居酒屋みどり亭のロゴ・店名
 *   - 「ご注文はこちら」→ /course（コース選択）へ遷移
 *   - 「スタッフ用」→ /staff（スタッフ画面）へ遷移
 *
 * QRコード経由でアクセスされた場合（?code= が付いている場合）:
 *   1. seatApi.getSeatByQrCode で座席を特定する
 *   2. 特定できたら座席IDを sessionStorage に保存し、/course へ自動遷移する
 *      （sessionStorage の 'seatId' は CartContext の confirmOrder が注文送信時に参照する）
 *   3. 特定できなければ（期限切れ・無効なQR）エラーメッセージを表示する
 */

// Link: <a> タグの代わりに React Router が提供するナビゲーション用コンポーネント
//       クリックするとページ全体をリロードせずに画面を切り替える（SPA の動作）
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { seatApi } from '../services/api'
import '../App.css' // スタイルシートを適用

export default function Home() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // QRコード読み取り直後の状態: 'idle'（通常表示）/ 'checking'（座席確認中）/ 'error'（無効・期限切れ）
  const [qrStatus, setQrStatus] = useState('idle')

  // 直前に処理したcodeを記録し、同じcodeに対する二重リクエストを防ぐ
  // （React.StrictModeの開発モードではuseEffectが2回実行されるため、ガードがないと
  //   customer_countが1回のスキャンで2回加算されてしまう）
  //
  // 注意: 「アンマウント時にPromiseの結果を破棄する」型のガード（activeフラグ）は
  // ここでは使わない。StrictModeはこのrefを保持したまま1回目のeffectをクリーンアップ→
  // 2回目のeffectを実行するため、activeフラグと組み合わせると「実際に発火したFetch
  // （1回目）の結果は握りつぶされ、2回目はrefガードで発火すらしない」という詰みが発生し、
  // sessionStorageへの保存とnavigateが永久に実行されなくなる。
  const processedCodeRef = useRef(null)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code || processedCodeRef.current === code) return
    processedCodeRef.current = code

    setQrStatus('checking')

    seatApi.getSeatByQrCode(code)
      .then((seat) => {
        // 座席が特定できたら sessionStorage に保存し、注文フローへ自動的に進む
        sessionStorage.setItem('seatId', String(seat.id))
        navigate('/course', { replace: true })
      })
      .catch((e) => {
        console.error('QRコードによる座席特定エラー:', e)
        setQrStatus('error')
      })
  }, [searchParams, navigate])

  return (
    <div className="home-root">
      <div className="home-content">

        {/* 店舗ロゴ・店名エリア */}
        <div className="home-logo">
          <p className="home-logo-en">IZAKAYA MIDORI-TEI</p>
          <h1 className="home-logo-ja">居酒屋みどり亭</h1>
        </div>

        {/* 区切り線（デザイン用のボーダーライン） */}
        <div className="home-divider" />

        {/* 歓迎メッセージ */}
        <div className="home-welcome">
          <p className="home-welcome-main">いらっしゃいませ</p>
          {qrStatus === 'checking' && (
            <p className="home-welcome-sub">座席を確認しています…</p>
          )}
          {qrStatus === 'error' && (
            <p className="home-welcome-sub home-qr-error">
              QRコードが無効か、有効期限が切れています。店員にお声がけください。
            </p>
          )}
          {qrStatus === 'idle' && (
            <p className="home-welcome-sub">ご利用方法をお選びください</p>
          )}
        </div>

        {/* ナビゲーションボタン群 */}
        <div className="home-actions">
          {/*
            to="/course": クリックすると /course（コース選択ページ）へ移動する
            お客様はここからコース選択 → メニュー → 注文という流れで進む
          */}
          <Link to="/course" className="home-btn home-btn-primary">
            ご注文はこちら
          </Link>

          {/*
            to="/staff": スタッフ用ページへ移動する
            お客様には関係のない管理画面への入口
          */}
          <Link to="/staff" className="home-btn home-btn-ghost">
            スタッフ用
          </Link>
        </div>
      </div>
    </div>
  )
}
