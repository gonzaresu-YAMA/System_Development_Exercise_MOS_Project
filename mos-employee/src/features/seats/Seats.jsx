import { useEffect, useMemo, useState } from 'react'

import QRCode from 'qrcode'

import './Seats.css'

import {
  loadSeatStore,
  getSeatsByFloor,
  updateSeatInStore,
  SEAT_STATUS,
  SEAT_STATUS_LIST,
  SEAT_STATUS_LABEL,
  SEAT_STATUS_COLOR,
} from '../../domain/seats/seatDb'
import { seatApi } from '../../services/api.js'

// お客様用アプリ（Mos-front）の公開URL。QRコードの飛び先として使う
const CUSTOMER_APP_URL = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5174'

// QRコードに埋め込むURLを組み立てる（お客様がスキャンするとMos-frontが開き、codeパラメータで座席を特定する）
function buildQrUrl(qrCode) {
  return `${CUSTOMER_APP_URL}/?code=${encodeURIComponent(qrCode)}`
}

const FILTERS = [
  { key: 'all', label: '全件' },
  { key: SEAT_STATUS.empty, label: '空席' },
  { key: SEAT_STATUS.using, label: '使用中' },
  { key: SEAT_STATUS.paid, label: '会計済' },
  { key: SEAT_STATUS.stop, label: '停止中' },
]

function Seats() {
  const [seatStore, setSeatStore] = useState({ floors: { 1: [], 2: [] } })
  const [floor, setFloor] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const [confirm, setConfirm] = useState(null)
  const [draft, setDraft] = useState(null)
  const [dropOpen, setDropOpen] = useState(false)
  const [toast, setToast] = useState('')

  /** QRコードセット */
  const [activeQrValue,setActiveQrValue] = useState(null);
  /** QRコードの有効期限 */
  const [qrCountdown,setQrCountdown] = useState(0);
  /** 表示部分 */
  const [qrImageUrl,setQrImageUrl] = useState('');

  useEffect(() => {
    loadSeatStore()
      .then(setSeatStore)
      .catch((e) => console.error('座席取得エラー:', e))
      .finally(() => setLoading(false))
  }, [])

  // activeQrValueが更新されたら、QRコードの画像データを生成
  useEffect(() => {
    if(activeQrValue){
      QRCode.toDataURL(activeQrValue,{width: 160},(err,url) => {
        if(!err)setQrImageUrl(url)
      })
    }else{
      setQrImageUrl('')
    }
  }, [activeQrValue])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const seats = useMemo(() => {
    if (!floor) return []
    return getSeatsByFloor(seatStore, floor)
  }, [seatStore, floor])

  const filteredSeats = useMemo(() => {
    if (statusFilter === 'all') return seats
    return seats.filter((seat) => seat.status === statusFilter)
  }, [seats, statusFilter])

  const updateSeat = async (nextSeat) => {
    if (!floor) return
    // ローカル状態を楽観的に更新
    setSeatStore((prev) => updateSeatInStore(prev, floor, nextSeat))
    // バックエンドを同期
    try {
      const saved = await seatApi.updateStatus(nextSeat._numId, nextSeat.status, nextSeat.people)
      setSeatStore((prev) => updateSeatInStore(prev, floor, saved))
    } catch (e) {
      console.error('座席更新エラー:', e)
    }
  }

  // QRコード関連の状態をまとめてリセット
  const resetQr = () => {
    setActiveQrValue(null)
    setQrCountdown(0)
  }

  const handleSeatTap = (seat) => {
    if (seat.status === SEAT_STATUS.empty) {
      resetQr()
      setConfirm({ mode: 'start', seat })
      return
    }

    if (seat.status === SEAT_STATUS.using) {
      resetQr()
      setConfirm({ mode: 'pay', seat })
      return
    }
  }

  const openEdit = (seat) => {
    resetQr()
    setDraft({ ...seat })
    setDropOpen(false)
    setConfirm(null)
  }

  const closeEdit = () => {
    setDraft(null)
    setDropOpen(false)
    resetQr()
  }

  const applyEdit = () => {
    if (!draft) return
    updateSeat({
      ...draft,
      people: Math.max(0, Number(draft.people || 0)),
    })
    closeEdit()
  }

  const changeStatusInEdit = (nextStatus) => {
    setDraft((prev) => (prev ? { ...prev, status: nextStatus } : prev))
    setDropOpen(false)
  }

  // 席選択後
  const confirmOK = async () => {
    if (!confirm) return
    const { mode, seat } = confirm

    if (mode === 'start') {
      // バックエンドでトークンと有効期限を発行してもらう
      try {
        const issued = await seatApi.issueQr(seat._numId)
        const remainingSec = Math.max(
          0,
          Math.round((new Date(issued.qrExpiresAt).getTime() - Date.now()) / 1000)
        )
        setActiveQrValue(buildQrUrl(issued.qrCode))
        setQrCountdown(remainingSec)
        setToast(`${seat.id} のQRコードを発行しました`)
        updateSeat({...seat,status:SEAT_STATUS.using})

        setConfirm({mode:'qr',seat})
      } catch (e) {
        console.error('QR発行エラー:', e)
        setToast('QRコードの発行に失敗しました')
        setConfirm(null)
      }
      return
    }

    if (mode === 'pay') {
      updateSeat({ ...seat, status: SEAT_STATUS.paid })
    }

    setConfirm(null)
  }

  const confirmCancel = () => {
    setConfirm(null)
    resetQr()
  }

  const bashingDone = (seat) => {
    updateSeat({ ...seat, status: SEAT_STATUS.empty, people: 0 })
  }

  // QRコード再発行（バックエンドで新しいトークンと有効期限を発行してもらう）
  const reissueQR = async (seat) => {
    try {
      const issued = await seatApi.issueQr(seat._numId)
      const remainingSec = Math.max(
        0,
        Math.round((new Date(issued.qrExpiresAt).getTime() - Date.now()) / 1000)
      )
      setActiveQrValue(buildQrUrl(issued.qrCode))
      setQrCountdown(remainingSec)
      setToast(`${seat.id} のQRコードを再発行しました`)
    } catch (e) {
      console.error('QR再発行エラー:', e)
      setToast('QRコードの再発行に失敗しました')
    }
  }

  const backToFloorSelect = () => {
    setFloor(null)
    setStatusFilter('all')
    setConfirm(null)
    setDraft(null)
    setDropOpen(false)
  }

  if (loading) {
    return <section className="seats"><p style={{ padding: '2rem' }}>読み込み中…</p></section>
  }

  if (floor == null) {
    return (
      <section className="seats">
        <h2 className="seatsTitle">座席管理</h2>

        <div className="floorSelect">
          <button className="floorCard" onClick={() => setFloor(1)} type="button">
            <div className="floorBig">1階</div>
            <div className="floorSub">T101 〜</div>
          </button>

          <button className="floorCard" onClick={() => setFloor(2)} type="button">
            <div className="floorBig">2階</div>
            <div className="floorSub">T201 〜</div>
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="seats">
      <div className="seatsHeader">
        <div className="seatsHeaderLeft">
          <button className="floorBackBtn" onClick={backToFloorSelect} type="button">
            戻る
          </button>
          <h2 className="seatsTitle">座席管理</h2>
        </div>

        <div className="floorBadge">{floor === 1 ? '1階' : '2階'}</div>
      </div>

      <div className="seatTools">
        <div className="seatFilters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`seatFilterBtn ${statusFilter === f.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="seatCount">
          表示 {filteredSeats.length} 件 / 全 {seats.length} 件
        </div>
      </div>

      <div className="seatList">
        {filteredSeats.map((seat) => (
          <div
            key={seat.id}
            className="seatCard"
            onClick={() => handleSeatTap(seat)}
            type="button"
          >
            <div className={`seatStatus ${SEAT_STATUS_COLOR[seat.status]}`} />

            <div className="seatMain">
              <div className="seatId">{seat.id}</div>
              <div className="seatMeta">
                {SEAT_STATUS_LABEL[seat.status]} / {seat.people}名
              </div>
            </div>

            <div className="seatRight">
              <button
                className="editBtn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  openEdit(seat)
                }}
              >
                編集
              </button>

              {seat.status === SEAT_STATUS.paid && (
                <button
                  className="bashBtn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    bashingDone(seat)
                  }}
                >
                  バッシング完了
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredSeats.length === 0 && <div className="seatEmpty">該当する座席がありません。</div>}
      </div>

      {confirm && (
        <>
          <div className="seatOverlay" onClick={confirmCancel} />
          <div className="confirmModal" role="dialog" aria-modal="true">
            <h3 className="confirmTitle">確認</h3>

            {confirm.mode === 'start' && (
              <p className="confirmText">
                ほんとに <strong>{confirm.seat.id}</strong> であっていますか？
                <br />
                OKで「使用中」にします。
              </p>
            )}

            {confirm.mode === 'pay' && (
              <p className="confirmText">
                <strong>{confirm.seat.id}</strong> を会計済みにしますか？
              </p>
            )}

            {confirm.mode === 'qr' &&(
              <p className="confirmText">
                <strong>{confirm.seat.id}</strong>のQRコードを発行しました。
                <br />
                お客様に読み取ってもらってください。
              </p>
            )}

            <div className = "confirmWapper">

              {/* 確認ボタンの上のQRコードの表示エリア */}
                  {qrImageUrl && (
                    <div className = "qrCodeArea" style = {{display: 'flex',flexDirection: 'colum',alignItems:'center',marginBottom:'20px'}}>
                      <img src={qrImageUrl} alt="QRコード" />
                    </div>
                  )}

              <div className="confirmActions">
                {confirm.mode === 'qr'?(
                  <button
                    className='primaryBtn2'
                    onClick={confirmCancel}
                    type="button"
                    style={{gridColumn:'1/-1'}}
                  >
                    閉じる
                  </button>
                ):(
                  <>
                    <button className="ghostBtn2" onClick={confirmCancel} type="button">
                      キャンセル
                    </button>

                    {confirm.mode === 'start' ? (
                    <button className="primaryBtn2" onClick={confirmOK} type="button">
                      QRコードを発行する
                    </button>
                    ) : (
                    <button className="primaryBtn2" onClick={confirmOK} type="button">
                      確認
                    </button>
                    )}
                  </>
                )}
              </div> 
            </div>
          </div>
        </>
      )}

      {draft && (
        <>
          <div className="seatOverlay" onClick={closeEdit} />

          <div className="seatModal" role="dialog" aria-modal="true">
            <div className="modalTitle">座席管理</div>
            <div className="seatIdBar">{draft.id}</div>

            <div className="gridPeople">
              <div className="cell peopleLabel">利用人数</div>
              <div className="cell peopleValue">
                <input
                  className="peopleInput"
                  type="number"
                  min="0"
                  max="30"
                  value={draft.people}
                  onChange={(e) =>
                    setDraft((p) => (p ? { ...p, people: Number(e.target.value) } : p))
                  }
                />
              </div>
              <div className="cell peopleUnit">名</div>
            </div>

            <div className="statusBlock">
              <button
                className="arrowBtn"
                onClick={() => setDropOpen((v) => !v)}
                type="button"
                aria-label="ステータスを開く"
              >
                {dropOpen ? '▲' : '▼'}
              </button>

              <div className={`colorBox ${SEAT_STATUS_COLOR[draft.status]}`} />

              <div className="statusArea">
                <div className="statusRow">
                  <div className="statusText">{SEAT_STATUS_LABEL[draft.status]}</div>
                </div>

                {dropOpen && (
                  <div className="statusMenu">
                    {SEAT_STATUS_LIST.map((s) => (
                      <button
                        key={s.key}
                        className="statusOption"
                        onClick={() => changeStatusInEdit(s.key)}
                        type="button"
                      >
                        <span className={`optColor ${s.color}`} />
                        <span className="optText">{s.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 再発行ボタンを押した後のQRコード表示エリア*/}
            {qrImageUrl && (
              <div 
                className="qrCodeArea"
                style={{display: 'flex',flexDirection: 'column',alignItems:'center',padding:'14px 0'}}
              >
                <img src={qrImageUrl} alt="QRコード"/>
              </div>
            )}

            <div className="modalActions three">
              <button
                className="qrReissueBtn"
                type="button"
                onClick={() => reissueQR(draft)}
              >
                QRコードを再発行する
              </button>
              <button className="confirmBtn" onClick={applyEdit} type="button">
                確定
              </button>
              <button className="backBtn" onClick={closeEdit} type="button">
                戻る
              </button>
            </div>
          </div>
        </>
      )}

      {toast && <div className="seatToast">{toast}</div>}
    </section>
  )
}

export default Seats
