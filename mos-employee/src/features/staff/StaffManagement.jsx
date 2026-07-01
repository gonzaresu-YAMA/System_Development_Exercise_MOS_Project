/**
 * 従業員管理画面（業務用途 - 店長専用）
 *
 * 従業員の追加・編集・有効化/無効化を行う画面。
 * AdminHub から store されている（role === 'manager' のみアクセス可能）。
 *
 * 重要な設計方針（削除しない）:
 *   従業員はシステム上から完全削除せず「無効化」で管理する。
 *   理由: 過去の注文履歴に担当者情報が残るため。
 *
 * パスワード変更フロー:
 *   1. 編集モーダルで「現在のパスワード + 新しいパスワード + 確認」を入力
 *   2. save() が validate() でチェック
 *   3. パスワード変更時は passwordConfirmTarget を設定して二重確認モーダルを表示
 *   4. confirmPasswordChange() で commitSave() を実行
 */
import { useEffect, useMemo, useState } from 'react'
import './StaffManagement.css'

import {
  loadStaff,
  generateIdByRole,
  getDefaultUseCasesFromRole,
} from '../../domain/staff/staffDb'
import { staffApi } from '../../services/api.js'
import {
  ROLE_LABEL,
  ROLE_OPTIONS,
} from '../../domain/staff/staffMapper'

function StaffManagement({ onBack }) {
  const [staff, setStaff] = useState([])         // 全従業員リスト
  const [query, setQuery] = useState('')          // 検索ワード
  const [filter, setFilter] = useState('active')  // 'all' | 'active' | 'inactive'
  const [loading, setLoading] = useState(true)

  // 追加/編集モーダルの状態
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('add')  // 'add' | 'edit'
  const [form, setForm] = useState({
    id:             '',
    name:           '',
    role:           'employee',
    active:         true,
    currentPassword: '',   // 編集時のパスワード変更に必要（本人確認）
    password:        '',   // 新しいパスワード（空文字 = 変更しない）
    passwordConfirm: '',
    allowedUseCases: ['hall', 'kitchen', 'admin'],
  })
  const [error, setError] = useState('')

  // 有効化/無効化の確認モーダル対象（null = 非表示）
  const [confirmTarget, setConfirmTarget] = useState(null)
  // パスワード変更の二重確認モーダル対象（null = 非表示）
  const [passwordConfirmTarget, setPasswordConfirmTarget] = useState(null)

  // 初回マウント時に全従業員データを取得
  useEffect(() => {
    loadStaff()
      .then(setStaff)
      .catch((e) => console.error('従業員取得エラー:', e))
      .finally(() => setLoading(false))
  }, [])

  // Escape キーで全モーダルを閉じる
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setConfirmTarget(null)
        setPasswordConfirmTarget(null)
        setError('')
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return staff
      .filter((s) => {
        if (filter === 'active') return s.active
        if (filter === 'inactive') return !s.active
        return true
      })
      .filter((s) => {
        if (!q) return true
        return (
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          ROLE_LABEL[s.role].toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1
        if (a.role !== b.role) return a.role === 'manager' ? -1 : 1
        return a.id.localeCompare(b.id)
      })
  }, [staff, query, filter])

  const openAdd = () => {
    const defaultRole = 'employee'
    setMode('add')
    setForm({
      id: generateIdByRole(defaultRole, staff),
      name: '',
      role: defaultRole,
      active: true,
      currentPassword: '',
      password: '',
      passwordConfirm: '',
      allowedUseCases: getDefaultUseCasesFromRole(defaultRole),
    })
    setError('')
    setOpen(true)
  }

  // 「編集」ボタン: 既存スタッフの情報を form に入れてモーダルを開く
  // パスワードフィールドは空にしておく（変更しない場合は空のまま送る）
  const openEdit = (s) => {
    setMode('edit')
    setForm({
      ...s,
      currentPassword: '',  // セキュリティ上、現在のパスワードはフォームに入れない
      password: '',
      passwordConfirm: '',
    })
    setError('')
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    setError('')
  }

  /**
   * 役職変更時に ID と allowedUseCases も自動更新する
   *
   * 新規追加（add）モード: 役職が変わったら ID のプレフィックスも変わるため採番し直す
   * 編集（edit）モード: ID は固定のまま、allowedUseCases だけ役職に合わせて更新
   */
  const handleRoleChange = (role) => {
    setForm((prev) => {
      if (mode === 'add') {
        return {
          ...prev,
          role,
          id:              generateIdByRole(role, staff),
          allowedUseCases: getDefaultUseCasesFromRole(role),
        }
      }
      return {
        ...prev,
        role,
        allowedUseCases: getDefaultUseCasesFromRole(role),
      }
    })
  }

  /**
   * フォームの入力値を検証する
   *
   * 検証ルール:
   *   共通: ID と名前が空でないか
   *   新規追加: パスワードが必須、4文字以上、確認と一致
   *   編集でパスワード変更: 現在のPW必須・正しいか確認、新PW 4文字以上、確認と一致
   *   編集でパスワード変更なし: パスワード検証をスキップ
   *
   * @returns {string} エラーメッセージ（空文字 = 検証通過）
   */
  const validate = () => {
    const id   = form.id.trim()
    const name = form.name.trim()

    if (!id)   return 'IDが空です'
    if (!name) return '名前を入力してください'

    if (mode === 'add') {
      if (!form.password)                              return 'パスワードを入力してください'
      if (form.password.length < 4)                   return 'パスワードは4文字以上にしてください'
      if (form.password !== form.passwordConfirm)      return '確認用パスワードが一致しません'
    }

    if (mode === 'edit' && form.password) {
      // パスワードを変更する場合のみ検証
      if (!form.currentPassword) return '現在のパスワードを入力してください'

      const currentStaff = staff.find((s) => s.id === form.id)
      if (!currentStaff) return '従業員情報が見つかりません'

      // フロント側でも現在のパスワードが正しいかチェック（バックエンドでも検証する）
      if (currentStaff.password !== form.currentPassword) {
        return '現在のパスワードが違います'
      }

      if (form.password.length < 4)               return '新しいパスワードは4文字以上にしてください'
      if (form.password !== form.passwordConfirm)  return '確認用パスワードが一致しません'
    }

    return ''  // 全検証通過
  }

  // API に送るペイロードを組み立てる
  // 新規追加時は必ず active: true（開始直後から有効）
  const buildPayload = () => {
    return {
      id:              form.id.trim(),
      name:            form.name.trim(),
      role:            form.role,
      active:          mode === 'add' ? true : !!form.active,
      password:        form.password,
      allowedUseCases: getDefaultUseCasesFromRole(form.role),
    }
  }

  const save = () => {
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }

    const payload = buildPayload()

    // パスワード変更を伴う編集の場合は二重確認モーダルを挟む
    if (mode === 'edit' && form.password) {
      setPasswordConfirmTarget({ payload })
      return
    }

    // パスワード変更なし（または新規追加）はそのまま保存
    commitSave(payload)
  }

  /**
   * 実際に API を呼んで保存する
   *
   * allowedUseCases をカンマ区切り文字列で送る理由:
   *   バックエンドの API が文字列形式で受け付けるため（DB保存形式に合わせている）
   *   フロント側では配列で管理し、API 送信直前に join(',') で変換する
   *
   * password が空文字の場合 undefined にする理由:
   *   バックエンドが undefined キーは無視するが、空文字は「パスワードを空にする」と解釈するため
   */
  const commitSave = async (payload) => {
    try {
      if (mode === 'add') {
        const staffData = {
          id:              payload.id,
          name:            payload.name,
          role:            payload.role,
          active:          true,
          password:        payload.password,
          allowedUseCases: payload.allowedUseCases.join(','),
        }
        const created = await staffApi.create(staffData)
        setStaff((prev) => [{ ...created, allowedUseCases: created.allowedUseCases || payload.allowedUseCases }, ...prev])
      } else {
        const staffData = {
          id:              payload.id,
          name:            payload.name,
          role:            payload.role,
          active:          payload.active,
          password:        payload.password || undefined,  // 空文字なら送らない
          allowedUseCases: payload.allowedUseCases.join(','),
        }
        const updated = await staffApi.update(payload.id, staffData)
        setStaff((prev) =>
          prev.map((s) => s.id === payload.id ? { ...updated, allowedUseCases: updated.allowedUseCases || payload.allowedUseCases } : s)
        )
      }
    } catch (e) {
      console.error('従業員保存エラー:', e)
      setError('保存に失敗しました')
      return  // ここで return してモーダルを閉じない（エラーを画面に表示する）
    }

    setPasswordConfirmTarget(null)
    closeModal()
  }

  // 有効化/無効化ボタン: 確認モーダルを開く（誤操作防止）
  const requestToggleActive = (s) => {
    setConfirmTarget({ id: s.id, name: s.name, nextActive: !s.active })
  }

  const cancelToggle = () => setConfirmTarget(null)

  // 有効化/無効化の確認モーダルで「OK」を押したときの処理
  const confirmToggle = async () => {
    if (!confirmTarget) return
    const { id, nextActive } = confirmTarget
    const target = staff.find((s) => s.id === id)
    if (!target) return

    try {
      await staffApi.update(id, {
        ...target,
        active: nextActive,
        allowedUseCases: Array.isArray(target.allowedUseCases)
          ? target.allowedUseCases.join(',')
          : (target.allowedUseCases || ''),
      })
      setStaff((prev) =>
        prev.map((s) => s.id === id ? { ...s, active: nextActive } : s)
      )
    } catch (e) {
      console.error('有効化/無効化エラー:', e)
    }

    setConfirmTarget(null)
  }

  const cancelPasswordConfirm = () => setPasswordConfirmTarget(null)

  // パスワード変更二重確認モーダルで「はい」を押したときに実際に保存する
  const confirmPasswordChange = () => {
    if (!passwordConfirmTarget) return
    commitSave(passwordConfirmTarget.payload)
  }

  if (loading) {
    return <section className="staffPage"><p style={{ padding: '2rem' }}>読み込み中…</p></section>
  }

  return (
    <section className="staffPage">
      <div className="staffHeader">
        <div>
          <h2 className="staffTitle">従業員管理</h2>
          <div className="staffSub">削除はせず「無効化」で管理します</div>
        </div>
        <div className="staffHeaderActions">
          <button className="btn ghost" type="button" onClick={onBack}>
            戻る
          </button>
          <button className="btn primary" type="button" onClick={openAdd}>
            ＋ 追加
          </button>
        </div>
      </div>

      <div className="staffControls">
        <input
          className="input"
          value={query}
          placeholder="検索（名前 / ID / 役職）"
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="seg">
          <button
            className={`segBtn ${filter === 'all' ? 'active' : ''}`}
            type="button"
            onClick={() => setFilter('all')}
          >
            全件
          </button>
          <button
            className={`segBtn ${filter === 'active' ? 'active' : ''}`}
            type="button"
            onClick={() => setFilter('active')}
          >
            有効
          </button>
          <button
            className={`segBtn ${filter === 'inactive' ? 'active' : ''}`}
            type="button"
            onClick={() => setFilter('inactive')}
          >
            無効
          </button>
        </div>
      </div>

      {/* 従業員リスト: フィルタ・検索後の結果を表示 */}
      <div className="staffList">
        {filtered.map((s) => (
          // 無効スタッフは 'inactive' クラスを追加してスタイルを暗くする
          <div key={s.id} className={`staffRow ${s.active ? '' : 'inactive'}`}>
            <div className="staffMain">
              <div className="staffName">{s.name}</div>
              <div className="staffMeta">
                <span className="chip">{s.id}</span>
                <span className={`chip role ${s.role}`}>{ROLE_LABEL[s.role]}</span>
                <span className={`chip status ${s.active ? 'ok' : 'ng'}`}>
                  {s.active ? '有効' : '無効'}
                </span>
              </div>
            </div>

            <div className="staffActions">
              <button className="btn small" type="button" onClick={() => openEdit(s)}>
                編集
              </button>

              {/* 有効なら「無効化」ボタン、無効なら「有効化」ボタンを表示 */}
              <button
                className={`btn small ${s.active ? 'warn' : 'primary'}`}
                type="button"
                onClick={() => requestToggleActive(s)}
              >
                {s.active ? '無効化' : '有効化'}
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="empty">
            <p>該当する従業員がいません。</p>
          </div>
        )}
      </div>

      {/* 追加・編集モーダル */}
      {open && (
        <>
          {/* オーバーレイをクリックで閉じる */}
          <div className="overlay" onClick={closeModal} />
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modalTitle">
              {mode === 'add' ? '従業員追加' : '従業員編集'}
            </div>

            <div className="form">
              <label className="label">
                名前
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="例：山田 太郎"
                />
              </label>

              <label className="label">
                役職
                {/* handleRoleChange が ID と allowedUseCases も同時に更新する */}
                <select
                  className="input"
                  value={form.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="label">
                従業員ID
                {/* ID は自動採番のため disabled（手動入力不可） */}
                <input className="input" value={form.id} disabled />
              </label>

              {/* 有効/無効の切り替えは編集モードのみ（追加時は常に有効） */}
              {mode === 'edit' && (
                <label className="label row">
                  状態
                  <div className="toggle">
                    <button
                      type="button"
                      className={`toggleBtn ${form.active ? 'active' : ''}`}
                      onClick={() => setForm((p) => ({ ...p, active: true }))}
                    >
                      有効
                    </button>
                    <button
                      type="button"
                      className={`toggleBtn ${!form.active ? 'active' : ''}`}
                      onClick={() => setForm((p) => ({ ...p, active: false }))}
                    >
                      無効
                    </button>
                  </div>
                </label>
              )}

              {/* 新規追加時のパスワード入力 */}
              {mode === 'add' && (
                <>
                  <label className="label">
                    パスワード
                    <input
                      className="input"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="4文字以上"
                    />
                  </label>

                  <label className="label">
                    パスワード（確認）
                    <input
                      className="input"
                      type="password"
                      value={form.passwordConfirm}
                      onChange={(e) => setForm((p) => ({ ...p, passwordConfirm: e.target.value }))}
                      placeholder="再入力"
                    />
                  </label>
                </>
              )}

              {/* 編集時のパスワード変更フォーム（全フィールド空欄 = 変更しない） */}
              {mode === 'edit' && (
                <>
                  <label className="label">
                    現在のパスワード（変更時のみ）
                    <input
                      className="input"
                      type="password"
                      value={form.currentPassword}
                      onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
                      placeholder="現在のパスワード"
                    />
                  </label>

                  <label className="label">
                    新しいパスワード（変更時のみ）
                    <input
                      className="input"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="空欄なら変更しない"
                    />
                  </label>

                  <label className="label">
                    新しいパスワード（確認）
                    <input
                      className="input"
                      type="password"
                      value={form.passwordConfirm}
                      onChange={(e) => setForm((p) => ({ ...p, passwordConfirm: e.target.value }))}
                      placeholder="再入力"
                    />
                  </label>

                  <div className="hint">
                    ※ パスワードを変更する時だけ、現在のパスワードを入力してください
                  </div>
                </>
              )}

              {/* バリデーションエラーメッセージ */}
              {error && <div className="error">{error}</div>}
            </div>

            <div className="modalActions">
              <button className="btn ghost" type="button" onClick={closeModal}>
                キャンセル
              </button>
              <button className="btn primary" type="button" onClick={save}>
                保存
              </button>
            </div>
          </div>
        </>
      )}

      {/* 有効化/無効化 確認モーダル */}
      {confirmTarget && (
        <>
          <div className="overlay" onClick={cancelToggle} />
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modalTitle">確認</div>

            <p className="confirmText">
              <strong>{confirmTarget.name}</strong> を
              {confirmTarget.nextActive ? '有効化' : '無効化'}しますか？
            </p>

            <div className="modalActions">
              <button className="btn ghost" type="button" onClick={cancelToggle}>
                キャンセル
              </button>
              <button
                className={`btn ${confirmTarget.nextActive ? 'primary' : 'warn'}`}
                type="button"
                onClick={confirmToggle}
              >
                OK
              </button>
            </div>
          </div>
        </>
      )}

      {/* パスワード変更 二重確認モーダル（誤操作防止） */}
      {passwordConfirmTarget && (
        <>
          <div className="overlay" onClick={cancelPasswordConfirm} />
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modalTitle">確認</div>

            <p className="confirmText">
              <strong>{form.name}</strong> のパスワードを変更しますか？
            </p>

            <div className="modalActions">
              <button className="btn ghost" type="button" onClick={cancelPasswordConfirm}>
                キャンセル
              </button>
              <button className="btn warn" type="button" onClick={confirmPasswordChange}>
                変更する
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default StaffManagement
