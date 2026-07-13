/**
 * AppShell - 業務メイン画面のシェル（全体制御コンポーネント）
 *
 * ログイン後の全ての業務画面を管理する中心コンポーネント。
 * 以下を担当する:
 *   - 用途（useCase）の選択・管理
 *   - 画面スタック（useNavStack）によるナビゲーション
 *   - ヘッダーの共通表示（タイトル・戻るボタン・ログアウト）
 *   - ログアウト確認モーダル
 *   - 各機能画面のルーティング（Seats / Orders / AdminHub / MenuManagement / StaffManagement）
 *
 * 画面遷移フロー（admin 用途の例）:
 *   ログイン → [用途選択] → 'admin' 選択 → AdminHub → menu/staff を push
 *   → MenuManagement or StaffManagement → nav.back() → AdminHub
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { normalizeAllowedUseCases } from '../../domain/staff/staffDb'
import { ROLE_LABEL } from '../../domain/staff/staffMapper'
import { useNavStack } from '../../hooks/useNavStack'
import { useSessionUser } from '../auth/useSessionUser'

import UseCaseSelect from '../../features/auth/UseCaseSelect'
import AdminHub from '../../features/admin/AdminHub'
import Orders from '../../features/orders/Orders'
import Seats from '../../features/seats/Seats'
import MenuManagement from '../../features/menu/MenuManagement'
import StaffManagement from '../../features/staff/StaffManagement'
import '../../styles/app.css'

// 用途に応じたヘッダータイトルを返す（画面上部中央に表示）
function getHeaderTitle(useCase) {
  if (!useCase) return '用途選択'
  if (useCase === 'hall') return 'ホール（座席管理）'
  if (useCase === 'kitchen') return '厨房（注文管理）'
  return '業務（店舗管理）'
}

// 用途に応じた最初に表示する画面キーを返す
// useNavStack の初期値として渡す
function getInitialScreen(useCase) {
  if (useCase === 'hall') return 'seats'
  if (useCase === 'kitchen') return 'orders'
  if (useCase === 'admin') return 'adminHub'
  return 'usecase'  // 用途未選択の場合
}

export default function AppShell() {
  const navigate = useNavigate()
  const session = useSessionUser()
  const user = session.getUser()

  // ログインチェック: user が null なら（手動で sessionStorage を削除された場合など）ログイン画面へ
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  // 役職に応じて許可されているユースケースを計算（メモ化）
  const allowedUseCases = useMemo(() => {
    if (!user) return []
    return normalizeAllowedUseCases(user.role, user.allowedUseCases)
  }, [user])

  // sessionStorage に保存済みの用途を取得（リロードしても選択が維持される）
  const storedUseCase = session.getUseCase()

  // 用途の初期値を決定:
  //   1. sessionStorage に保存済みがあればそれを使う
  //   2. 許可用途が1つしかない場合はその用途を自動選択（選択画面をスキップ）
  //   3. どちらでもなければ undefined（用途選択画面を表示）
  const [useCaseState, setUseCaseState] = useState(() => {
    if (storedUseCase) return storedUseCase
    if (allowedUseCases.length === 1) return allowedUseCases[0]
  })

  const [logoutOpen, setLogoutOpen] = useState(false)

  // useCaseState が決まったら sessionStorage に保存（まだ保存されていない場合）
  useEffect(() => {
    if (!user) return
    if (!useCaseState) return
    if (!storedUseCase) {
      session.setUseCase(useCaseState)
    }
  }, [user, useCaseState, storedUseCase, session])

  // 用途が変わったら画面スタックを初期画面にリセットする
  const initialScreen = useMemo(() => getInitialScreen(useCaseState), [useCaseState])
  const nav = useNavStack(initialScreen)

  useEffect(() => {
    nav.reset(initialScreen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScreen])

  // ログアウトモーダルが開いているとき Escape キーで閉じる
  // モーダルが閉じているときはリスナーを登録しない（パフォーマンス最適化）
  useEffect(() => {
    if (!logoutOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLogoutOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [logoutOpen])

  // user が null の間は何も描画しない（useEffect のリダイレクト待ち）
  if (!user) return null

  const screen = nav.current
  const headerTitle = getHeaderTitle(useCaseState)

  // ── ログアウト処理 ──────────────────────────────────────
  const requestLogout = () => setLogoutOpen(true)
  const cancelLogout  = () => setLogoutOpen(false)
  const confirmLogout = () => {
    setLogoutOpen(false)
    session.clearUser()  // sessionStorage のユーザー情報を消去
    navigate('/', { replace: true })  // ログイン画面へ（戻るボタンで戻れないよう replace）
  }

  // ── 用途切り替え ────────────────────────────────────────
  // changeUseCase: sessionStorage の用途をクリアして用途選択画面に戻る
  const changeUseCase = () => {
    session.clearUseCase()
    setUseCaseState(null)
    nav.reset('usecase')
  }

  // selectUseCase: 用途選択画面で選ばれたときに呼ばれる
  const selectUseCase = (next) => {
    session.setUseCase(next)
    setUseCaseState(next)
  }

  // ── 表示するコンポーネントの決定 ───────────────────────
  // 用途と現在のナビスタック画面に応じて body を決定する
  let body = null
  let showBackButton = false

  if (!useCaseState) {
    // 用途未選択 → 用途選択画面
    body = <UseCaseSelect allowed={allowedUseCases} onSelect={selectUseCase} />
  } else if (useCaseState === 'hall') {
    // ホール用途 → 座席管理
    body = <Seats />
  } else if (useCaseState === 'kitchen') {
    // 厨房用途 → 注文管理
    body = <Orders />
  } else if (useCaseState === 'admin') {
    // 業務用途 → 画面スタックで管理
    if (screen === 'adminHub') {
      body = (
        <AdminHub
          user={user}
          onSelect={(next) => {
            // メニュー管理・従業員管理へ画面をスタックに積む
            if (next === 'menu')  nav.push('menu')
            if (next === 'staff') nav.push('staff')
          }}
        />
      )
    } else if (screen === 'menu') {
      body = <MenuManagement onBack={() => nav.back()} />
      showBackButton = true
    } else if (screen === 'staff') {
      if (user.role !== 'manager') {
        // URL 直打ちや不正な操作で staff 画面に来た場合の権限エラー表示
        body = (
          <section className="pageSection">
            <h2 className="sectionTitle">権限がありません</h2>
            <p className="sectionText">従業員管理は店長のみ利用できます。</p>
          </section>
        )
      } else {
        body = <StaffManagement onBack={() => nav.back()} />
      }
      showBackButton = true
    } else {
      // 不明なスクリーンキーへのフォールバック
      body = <MenuManagement onBack={() => nav.back()} />
      showBackButton = true
    }
  }

  return (
    <div className="shellPage">
      {/* 全画面共通ヘッダー */}
      <ShellHeader
        title={headerTitle}
        userLabel={`${ROLE_LABEL[user.role]}：${user.name}`}
        showBackButton={showBackButton && nav.canBack}
        onBack={nav.back}
        onChangeUseCase={useCaseState ? changeUseCase : null}
        onLogout={requestLogout}
      />

      {/* 業務画面本体 */}
      <main className="shellContent">{body}</main>

      {/* ログアウト確認モーダル */}
      {logoutOpen && (
        <>
          {/* オーバーレイをクリックでも閉じられる */}
          <div className="appOverlay" onClick={cancelLogout} />
          <div className="appModal" role="dialog" aria-modal="true">
            <div className="appModalTitle">ログアウトしますか？</div>
            <p className="appModalText">現在の作業画面からログアウトします。</p>
            <div className="appModalActions twoCols">
              <button className="appBtn appBtnGhost" type="button" onClick={cancelLogout}>
                キャンセル
              </button>
              <button className="appBtn appBtnWarn" type="button" onClick={confirmLogout}>
                ログアウト
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * ShellHeader - 業務画面共通ヘッダー
 *
 * 3カラム構成:
 *   左: 戻るボタン（showBackButton が true のときのみ表示）
 *   中: 店舗名 + 現在の画面名
 *   右: 「ホーム」ボタン（用途選択後のみ）+ 「ログアウト」ボタン
 */
function ShellHeader({
  title,
  userLabel,
  showBackButton,
  onBack,
  onChangeUseCase,
  onLogout,
}) {
  return (
    <header className="shellHeader">
      <div className="shellHeaderRow">
        <div className="shellHeaderLeft">
          {/* ホームボタン: 用途選択中（useCaseState が null）のときは非表示 */}
          {onChangeUseCase && (
            <button className="appBtn appBtnGhost" type="button" onClick={onChangeUseCase}>
              ホーム
            </button>
          )}
          {/* {showBackButton ? (
            <button className="appBtn appBtnGhost" type="button" onClick={onBack}>
              ← 戻る
            </button>
          ) : (
            // 戻るボタンがないときも中央のタイトルが中央に来るようスペースを確保
            <div className="shellHeaderGap" />
          )} */}
        </div>

        <div className="shellHeaderCenter">
          <div className="shellShopName">居酒屋みどり亭</div>
          <div className="shellScreenName">{title}</div>
        </div>

        <div className="shellHeaderRight">
          <button className="appBtn appBtnWarn" type="button" onClick={onLogout}>
            ログアウト
          </button>
        </div>
      </div>
      {/* ログイン中のスタッフ名と役職を表示 */}
      <div className="shellUserLine">{userLabel}</div>
    </header>
  )
}
