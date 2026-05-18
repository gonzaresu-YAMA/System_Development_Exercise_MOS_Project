import { useMemo, useState, useEffect } from 'react'
import './Seats.css'

const STATUS_LIST = [
  { key: 'empty', label: '空席', color: 'green' },
  { key: 'paid', label: '会計済', color: 'yellow' },
  { key: 'using', label: '使用中', color: 'red' },
  { key: 'stop', label: '停止中', color: 'black' },
]
const statusByKey = Object.fromEntries(STATUS_LIST.map(s => [s.key, s]))

const makeSeats = (floor) => {
  const start = floor === 1 ? 101 : 201
  const count = 12 // 必要なら席数をここで増減
  return Array.from({ length: count }, (_, i) => ({
    id: `T${start + i}`,
    status: 'empty',
    people: 0,
  }))
}

function Seats() {
  // フロア選択：null=未選択 / 1=1階 / 2=2階
  const [floor, setFloor] = useState(null)

  // 座席データ（階ごとに持つ）
  const [seats1F, setSeats1F] = useState(() => makeSeats(1))
  const [seats2F, setSeats2F] = useState(() => makeSeats(2))

  const seats = useMemo(() => {
    if (floor === 1) return seats1F
    if (floor === 2) return seats2F
    return []
  }, [floor, seats1F, seats2F])

  // 確認ポップ：空席→使用中（QR）/ 使用中→会計済
  // confirm: { mode: 'start'|'pay', seat }
  const [confirm, setConfirm] = useState(null)

  // 編集モーダル（編集ボタン押下時のみ）
  const [draft, setDraft] = useState(null)
  const [dropOpen, setDropOpen] = useState(false)

  // ESCで閉じる
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setConfirm(null)
        setDraft(null)
        setDropOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const updateSeat = (nextSeat) => {
    if (!floor) return
    const updater = (prev) => prev.map(s => (s.id === nextSeat.id ? nextSeat : s))
    if (floor === 1) setSeats1F(updater)
    if (floor === 2) setSeats2F(updater)
  }

  // 座席カードタップ（編集画面は出さない）
  const handleSeatTap = (seat) => {
    if (seat.status === 'empty') {
      setConfirm({ mode: 'start', seat })
      return
    }
    if (seat.status === 'using') {
      setConfirm({ mode: 'pay', seat })
      return
    }
    // paid/stop は何もしない（必要ならここを編集へ変更してもOK）
  }

  // 編集（編集ボタンのみ）
  const openEdit = (seat) => {
    setDraft({ ...seat })
    setDropOpen(false)
    setConfirm(null)
  }
  const closeEdit = () => {
    setDraft(null)
    setDropOpen(false)
  }
  const applyEdit = () => {
    if (!draft) return
    updateSeat(draft)
    closeEdit()
  }

  const changeStatusInEdit = (newStatus) => {
    setDraft((prev) => (prev ? { ...prev, status: newStatus } : prev))
    setDropOpen(false)
  }

  // 確認ポップ：OK
  const confirmOK = () => {
    if (!confirm) return
    const { mode, seat } = confirm

    if (mode === 'start') {
      // 空席 → 使用中
      updateSeat({ ...seat, status: 'using' })
    }

    if (mode === 'pay') {
      // 使用中 → 会計済
      updateSeat({ ...seat, status: 'paid' })
    }

    setConfirm(null)
  }

  const confirmCancel = () => setConfirm(null)

  // バッシング完了：会計済 → 空席（人数0）
  const bashingDone = (seat) => {
    updateSeat({ ...seat, status: 'empty', people: 0 })
  }

  // ------- ① フロア選択画面 -------
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

  // ------- ② 座席一覧画面 -------
  return (
    <section className="seats">
      <div className="seatsHeader">
        <h2 className="seatsTitle">座席管理</h2>
        <div className="floorBadge">
          {floor === 1 ? '1階' : '2階'}
          <button className="floorChange" onClick={() => setFloor(null)} type="button">
            変更
          </button>
        </div>
      </div>

      <div className="seatList">
        {seats.map((seat) => (
          <button
            key={seat.id}
            className="seatCard"
            onClick={() => handleSeatTap(seat)}
            type="button"
          >
            <div className={`seatStatus ${statusByKey[seat.status].color}`} />

            <div className="seatMain">
              <div className="seatId">{seat.id}</div>
              <div className="seatMeta">
                {statusByKey[seat.status].label} / {seat.people}名
              </div>
            </div>

            {/* 右：編集 + （会計済のみ）バッシング完了 */}
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

              {seat.status === 'paid' && (
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
          </button>
        ))}
      </div>

      {/* ===== 確認ポップ（空席/使用中） ===== */}
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

            <div className="confirmActions">
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
            </div>
          </div>
        </>
      )}

      {/* ===== 座席詳細（編集モーダル）※編集ボタンのみで表示 ===== */}
      {draft && (
        <>
          <div className="seatOverlay" onClick={closeEdit} />

          <div className="seatModal" role="dialog" aria-modal="true">
            <div className="modalTitle">座席管理</div>

            {/* 入店/退店は出さない → 席番号だけ */}
            <div className="seatIdBar">{draft.id}</div>

            {/* 利用人数 */}
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

            {/* ステータス変更（編集でのみ） */}
            <div className="statusBlock">
              <button
                className="arrowBtn"
                onClick={() => setDropOpen((v) => !v)}
                type="button"
                aria-label="ステータスを開く"
              >
                {dropOpen ? '▲' : '▼'}
              </button>

              <div className={`colorBox ${statusByKey[draft.status].color}`} />

              <div className="statusArea">
                <div className="statusRow">
                  <div className="statusText">{statusByKey[draft.status].label}</div>
                </div>

                {dropOpen && (
                  <div className="statusMenu">
                    {STATUS_LIST.map((s) => (
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

            {/* QR発行ボタンは出さない（要望どおり） */}

            
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
    </section>
  )
}

export default Seats