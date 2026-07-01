/**
 * 座席管理画面（ホール用途）
 *
 * ホールスタッフが使う画面。全座席の状態を一覧表示し、
 * 「空席 → 使用中 → 会計済 → 空席」の流れを管理する。
 *
 * 座席ステータスの流れ:
 *   空席 → [カードタップ] → 使用中（QR発行） → [タップ] → 会計済 → [バッシング完了] → 空席
 *
 * 主な機能:
 *   - フロア（1階/2階）選択
 *   - ステータスフィルタ
 *   - 楽観的更新（API 完了を待たずに画面を先に更新）
 *   - 確認モーダル（誤操作防止）
 *   - 詳細編集モーダル（人数変更・ステータス変更）
 *   - QRコード発行/再発行（トースト通知）
 *   - Escape キーで全モーダルを閉じる
 */
import { useEffect, useMemo, useState } from 'react'

import { QRCodeSVG } from 'qrcode.react'

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

// ステータスフィルタボタンの定義
const FILTERS = [
  { key: 'all',             label: '全件' },
  { key: SEAT_STATUS.empty, label: '空席' },
  { key: SEAT_STATUS.using, label: '使用中' },
  { key: SEAT_STATUS.paid,  label: '会計済' },
  { key: SEAT_STATUS.stop,  label: '停止中' },
]

function Seats() {
  // フロア別の座席データ（seatStore 構造は seatDb.js 参照）
  const [seatStore, setSeatStore] = useState({ floors: { 1: [], 2: [] } })
  // 選択中のフロア（null = フロア選択画面を表示）
  const [floor, setFloor] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  // confirm: null = 非表示、{ mode: 'start'|'pay', seat } = 確認モーダルを表示
  const [confirm, setConfirm] = useState(null)
  // draft: null = 非表示、座席オブジェクト = 詳細編集モーダルを表示
  const [draft, setDraft] = useState(null)
  // dropOpen: 編集モーダル内のステータスドロップダウンの開閉
  const [dropOpen, setDropOpen] = useState(false)
  // toast: 空文字 = 非表示、文字列 = 2.5秒間トースト表示
  const [toast, setToast] = useState('')

  // 初回マウント時に座席データを取得する
  useEffect(() => {
    loadSeatStore()
      .then(setSeatStore)
      .catch((e) => console.error('座席取得エラー:', e))
      .finally(() => setLoading(false))
  }, [])

  // Escape キーで全モーダル・ドロップダウンを閉じる
  // 依存配列が [] のため一度だけ登録され、アンマウント時に削除される
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setConfirm(null)
        setDraft(null)
        setDropOpen(false)
        setToast('')
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // トーストを 2.5秒後に自動非表示にする
  // toast が変わるたびに新しいタイマーを作り、前のタイマーをクリアする
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  // 選択中フロアの全座席（フロアが未選択なら空配列）
  const seats = useMemo(() => {
    if (!floor) return []
    return getSeatsByFloor(seatStore, floor)
  }, [seatStore, floor])

  // ステータスフィルタを適用した座席リスト
  const filteredSeats = useMemo(() => {
    if (statusFilter === 'all') return seats
    return seats.filter((seat) => seat.status === statusFilter)
  }, [seats, statusFilter])

  /**
   * 座席のステータス・人数を更新する（楽観的更新）
   *
   * 楽観的更新を使う理由:
   *   API 完了を待つと画面の反応が遅く感じるため、
   *   まずローカルを更新してから非同期でバックエンドと同期する
   */
  const updateSeat = async (nextSeat) => {
    if (!floor) return
    // 先にローカル状態を更新（楽観的更新）
    setSeatStore((prev) => updateSeatInStore(prev, floor, nextSeat))
    // バックエンドと同期し、サーバー返却値で再更新
    try {
      const saved = await seatApi.updateStatus(nextSeat._numId, nextSeat.status, nextSeat.people)
      setSeatStore((prev) => updateSeatInStore(prev, floor, saved))
    } catch (e) {
      console.error('座席更新エラー:', e)
    }
  }

  /**
   * 座席カードをタップしたときの処理
   *
   * 空席 → 「使用開始」確認モーダルを表示
   * 使用中 → 「会計済み」確認モーダルを表示
   * 会計済・停止中 → 何もしない（カードタップでは操作しない）
   */
  const handleSeatTap = (seat) => {
    if (seat.status === SEAT_STATUS.empty) {
      setConfirm({ mode: 'start', seat })
      return
    }
    if (seat.status === SEAT_STATUS.using) {
      setConfirm({ mode: 'pay', seat })
      return
    }
  }

  // 「編集」ボタン: 座席のコピーを draft に入れて編集モーダルを開く
  // スプレッドでコピーする理由: draft を編集しても元のデータが変わらないようにするため
  const openEdit = (seat) => {
    setDraft({ ...seat })
    setDropOpen(false)
    setConfirm(null)
  }

  const closeEdit = () => {
    setDraft(null)
    setDropOpen(false)
  }

  // 「確定」ボタン: draft の内容で座席を更新する
  const applyEdit = () => {
    if (!draft) return
    updateSeat({
      ...draft,
      // 人数は 0 未満にならないよう補正
      people: Math.max(0, Number(draft.people || 0)),
    })
    closeEdit()
  }

  // 編集モーダル内のドロップダウンでステータスを変更する
  const changeStatusInEdit = (nextStatus) => {
    setDraft((prev) => (prev ? { ...prev, status: nextStatus } : prev))
    setDropOpen(false)
  }

  // 確認モーダルで「OK」を押したときの処理
  // 席選択後
  const confirmOK = () => {
    if (!confirm) return
    const { mode, seat } = confirm

    if (mode === 'start') {
      // バックエンドAPIを叩き、サーバ側で暗号化・期限設定された値を取得

      // 一旦フロントエンドで実装
      const expireTime = Date.now() + 5 * 60 * 1000 // 5分間の期限
      const dummyQRData = JSON.stringify({
        seatId:seat.id,
        status:SEAT_STATUS.using,
        exp:expireTime  // 有効期限タイムスタンプ
      })

      // 状態にQRコードのデータをセット
      setActiveQrValue(dummyQrData)
      setQrCountdown(300) // 5分 = 300秒のカウントダウン開始

      // 空席 → 使用中 に変更してQRコードを発行（トーストで通知）
      updateSeat({ ...seat, status: SEAT_STATUS.using })
      setToast(`${seat.id} のQRコードを発行しました`)
    }

    if (mode === 'pay') {
      // 使用中 → 会計済み に変更
      updateSeat({ ...seat, status: SEAT_STATUS.paid })
    }

    setConfirm(null)
  }

  const confirmCancel = () => setConfirm(null)

  // 「バッシング完了」ボタン: 会計済み → 空席 に戻し人数もリセット
  const bashingDone = (seat) => {
    updateSeat({ ...seat, status: SEAT_STATUS.empty, people: 0 })
  }

  // QRコード再生成
  // 「QRコードを再発行する」ボタン（現在はトースト表示のみ）
  const reissueQR = (seat) => {
    setToast(`${seat.id} のQRコードを再発行しました`)
  }

  // フロア選択画面に戻る（全モーダルとフィルタをリセット）
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
            ← 戻る
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
          <button
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
          </button>
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
