// ログイン後の共通シェル
// このファイルの役割：
// 1. 現在ユーザーの取得
// 2. 用途選択（hall / kitchen / admin）
// 3. 画面ごとの振り分け
// 4. 共通ヘッダー（戻る / 用途変更 / ログアウト）
//
// 重要ポイント：
// - useEffect の中で直接 setState しすぎない
// - 用途が1つしかない時の自動選択は「派生値」として扱う
// - effect では sessionStorage への同期だけを行う

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

// 用途に応じたヘッダータイトルを返す
function getHeaderTitle(useCase) {
  if (!useCase) return '用途選択'
  if (useCase === 'hall') return 'ホール（座席管理）'
  if (useCase === 'kitchen') return '厨房（注文管理）'
  return '業務（店舗管理）'
}

// 用途に応じた初期画面名を返す
function getInitialScreen(useCase) {
  if (useCase === 'hall') return 'seats'
  if (useCase === 'kitchen') return 'orders'
  if (useCase === 'admin') return 'adminHub'
  return 'usecase'
}

export default function AppShell() {
  const navigate = useNavigate()

  // ---------------------------------------------
  // セッション操作
  // ---------------------------------------------
  // useSessionUser は sessionStorage 操作の窓口
  // UI 側はここ経由でユーザー情報や用途を扱う
  const {
    getUser,
    getUseCase,
    setUseCase,
    clearUseCase,
    clearUser,
  } = useSessionUser()

  // 現在ログイン中のユーザー
  const user = getUser()

  // sessionStorage に保存済みの用途
  const storedUseCase = getUseCase()

  // ---------------------------------------------
  // 画面内 state
  // ---------------------------------------------
  // selectedUseCase は「ユーザーが明示的に選んだ用途」だけを持つ
  // 自動選択はここに直接入れず、下で派生値として扱う
  const [selectedUseCase, setSelectedUseCase] = useState(storedUseCase)

  // ログアウト確認モーダル
  const [logoutOpen, setLogoutOpen] = useState(false)

  // ---------------------------------------------
  // 未ログインならログイン画面へ戻す
  // ---------------------------------------------
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  // ---------------------------------------------
  // role から許可用途を計算する
  // ---------------------------------------------
  const allowedUseCases = useMemo(() => {
    if (!user) return []
    return normalizeAllowedUseCases(user.role, user.allowedUseCases)
  }, [user])

  // ---------------------------------------------
  // 実際に使う用途を派生値として決める
  // ---------------------------------------------
  // 優先順位：
  // 1. 画面内 state に選択済み用途がある
  // 2. sessionStorage に保存済み用途がある
  // 3. 許可用途が1つだけなら自動的にその用途
  // 4. それ以外は null（用途選択画面を出す）
  const effectiveUseCase = useMemo(() => {
    if (selectedUseCase) return selectedUseCase
    if (storedUseCase) return storedUseCase
    if (allowedUseCases.length === 1) return allowedUseCases[0]
    return null
  }, [selectedUseCase, storedUseCase, allowedUseCases])

  // ---------------------------------------------
  // 自動選択された用途を sessionStorage に同期する
  // ---------------------------------------------
  // ここでは setState はしない
  // 外部システム（sessionStorage）への同期だけを行う
  useEffect(() => {
    if (!user) return
    if (!effectiveUseCase) return

    // まだ sessionStorage に用途が保存されていない時だけ保存する
    if (!storedUseCase) {
      setUseCase(effectiveUseCase)
    }
  }, [user, effectiveUseCase, storedUseCase, setUseCase])

  // ---------------------------------------------
  // 現在用途から初期画面を決める
  // ---------------------------------------------
  const initialScreen = useMemo(() => getInitialScreen(effectiveUseCase), [effectiveUseCase])

  // 戻る履歴管理
  const nav = useNavStack(initialScreen)

  // 用途が変わった時は履歴をリセットする
  useEffect(() => {
    nav.reset(initialScreen)
    // nav は custom hook の安定関数として扱う
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScreen])

  // ---------------------------------------------
  // ログアウト確認モーダルが開いている時だけ ESC で閉じる
  // ---------------------------------------------
  useEffect(() => {
    if (!logoutOpen) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLogoutOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [logoutOpen])

  // ガード
  if (!user) return null

  const screen = nav.current
  const headerTitle = getHeaderTitle(effectiveUseCase)

  // ---------------------------------------------
  // 共通操作
  // ---------------------------------------------
  const requestLogout = () => setLogoutOpen(true)

  const cancelLogout = () => setLogoutOpen(false)

  const confirmLogout = () => {
    setLogoutOpen(false)
    clearUser()
    navigate('/', { replace: true })
  }

  // 用途変更：
  // sessionStorage の用途を消し、画面内の選択も消して、用途選択へ戻す
  const changeUseCase = () => {
    clearUseCase()
    setSelectedUseCase(null)
    nav.reset('usecase')
  }

  // 用途選択画面から用途が選ばれた時
  const selectUseCase = (next) => {
    setUseCase(next)
    setSelectedUseCase(next)
  }

  // ---------------------------------------------
  // 画面の振り分け
  // ---------------------------------------------
  let body = null
  let showBackButton = false

  if (!effectiveUseCase) {
    // 用途未選択なら用途選択画面
    body = <UseCaseSelect allowed={allowedUseCases} onSelect={selectUseCase} />
  } else if (effectiveUseCase === 'hall') {
    // ホール用途
    body = <Seats />
  } else if (effectiveUseCase === 'kitchen') {
    // 厨房用途
    body = <Orders />
  } else if (effectiveUseCase === 'admin') {
    // 業務用途
    if (screen === 'adminHub') {
      body = (
        <AdminHub
          user={user}
          onSelect={(next) => {
            if (next === 'menu') nav.push('menu')
            if (next === 'staff') nav.push('staff')
          }}
        />
      )
    } else if (screen === 'menu') {
      body = <MenuManagement onBack={() => nav.back()} />
      showBackButton = true
    } else if (screen === 'staff') {
      // 店長以外が従業員管理に来た場合の安全ガード
      if (user.role !== 'manager') {
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
      // 予期しない screen 値の時もメニュー管理へ逃がす
      body = <MenuManagement onBack={() => nav.back()} />
      showBackButton = true
    }
  }

  return (
    <div className="shellPage">
      <ShellHeader
        title={headerTitle}
        userLabel={`${ROLE_LABEL[user.role]}：${user.name}`}
        showBackButton={showBackButton && nav.canBack}
        onBack={nav.back}
        onChangeUseCase={effectiveUseCase ? changeUseCase : null}
        onLogout={requestLogout}
      />

      <main className="shellContent">{body}</main>

      {/* ログアウト確認モーダル */}
      {logoutOpen && (
        <>
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

// 共通ヘッダー
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
          {showBackButton ? (
            <button className="appBtn appBtnGhost" type="button" onClick={onBack}>
              ← 戻る
            </button>
          ) : (
            <div className="shellHeaderGap" />
          )}
        </div>

        <div className="shellHeaderCenter">
          <div className="shellShopName">居酒屋みどり亭</div>
          <div className="shellScreenName">{title}</div>
        </div>

        <div className="shellHeaderRight">
          {onChangeUseCase && (
            <button className="appBtn appBtnGhost" type="button" onClick={onChangeUseCase}>
              用途変更
            </button>
          )}
          <button className="appBtn appBtnWarn" type="button" onClick={onLogout}>
            ログアウト
          </button>
        </div>
      </div>
      <div className="shellUserLine">{userLabel}</div>
    </header>
  )
}