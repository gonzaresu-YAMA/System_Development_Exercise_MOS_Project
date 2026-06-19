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

function getHeaderTitle(useCase) {
  if (!useCase) return '用途選択'
  if (useCase === 'hall') return 'ホール（座席管理）'
  if (useCase === 'kitchen') return '厨房（注文管理）'
  return '業務（店舗管理）'
}

function getInitialScreen(useCase) {
  if (useCase === 'hall') return 'seats'
  if (useCase === 'kitchen') return 'orders'
  if (useCase === 'admin') return 'adminHub'
  return 'usecase'
}

export default function AppShell() {
  const navigate = useNavigate()
  const session = useSessionUser()
  const user = session.getUser()

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const allowedUseCases = useMemo(() => {
    if (!user) return []
    return normalizeAllowedUseCases(user.role, user.allowedUseCases)
  }, [user])

  const storedUseCase = session.getUseCase()

  // 初期値の決定
  const [useCaseState, setUseCaseState] = useState(() => {
    if(storedUseCase) return storedUseCase
    if(allowedUseCases.length === 1) return allowedUseCases[0]
  })

  const [logoutOpen,setLogoutOpen] = useState(false)

  useEffect(() => {
    if(!user) return
    if(!useCaseState) return
    if(!storedUseCase){
      session.setUseCase(useCaseState)
    }
  },[user, useCaseState, storedUseCase, session])

  const initialScreen = useMemo(() => getInitialScreen(useCaseState), [useCaseState])
  const nav = useNavStack(initialScreen)

  useEffect(() => {
    nav.reset(initialScreen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScreen])

  useEffect(() => {
    if (!logoutOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLogoutOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [logoutOpen])

  if (!user) return null

  const screen = nav.current
  const headerTitle = getHeaderTitle(useCaseState)

  const requestLogout = () => setLogoutOpen(true)
  const cancelLogout = () => setLogoutOpen(false)
  const confirmLogout = () => {
    setLogoutOpen(false)
    session.clearUser()
    navigate('/', { replace: true })
  }

  const changeUseCase = () => {
    session.clearUseCase()
    setUseCaseState(null)
    nav.reset('usecase')
  }

  const selectUseCase = (next) => {
    session.setUseCase(next)
    setUseCaseState(next)
  }

  let body = null
  let showBackButton = false

  if (!useCaseState) {
    body = <UseCaseSelect allowed={allowedUseCases} onSelect={selectUseCase} />
  } else if (useCaseState === 'hall') {
    body = <Seats />
  } else if (useCaseState === 'kitchen') {
    body = <Orders />
  } else if (useCaseState === 'admin') {
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
        onChangeUseCase={useCaseState ? changeUseCase : null}
        onLogout={requestLogout}
      />

      <main className="shellContent">{body}</main>

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
