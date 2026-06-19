import { useEffect, useMemo, useState } from 'react'
import './StaffManagement.css'

import {
  loadStaff,
  saveStaff,
  generateIdByRole,
  getDefaultUseCasesFromRole,
} from '../../domain/staff/staffDb'
import {
  ROLE_LABEL,
  ROLE_OPTIONS,
} from '../../domain/staff/staffMapper'

function StaffManagement({ onBack }) {
  const [staff, setStaff] = useState(() => loadStaff())
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('active')

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('add')
  const [form, setForm] = useState({
    id: '',
    name: '',
    role: 'employee',
    active: true,
    currentPassword: '',
    password: '',
    passwordConfirm: '',
    allowedUseCases: ['hall', 'kitchen', 'admin'],
  })
  const [error, setError] = useState('')

  const [confirmTarget, setConfirmTarget] = useState(null)
  const [passwordConfirmTarget, setPasswordConfirmTarget] = useState(null)

  useEffect(() => {
    saveStaff(staff)
  }, [staff])

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
      id: generateIdByRole(defaultRole),
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

  const openEdit = (s) => {
    setMode('edit')
    setForm({
      ...s,
      currentPassword: '',
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

  const handleRoleChange = (role) => {
    setForm((prev) => {
      if (mode === 'add') {
        return {
          ...prev,
          role,
          id: generateIdByRole(role),
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

  const validate = () => {
    const id = form.id.trim()
    const name = form.name.trim()

    if (!id) return 'IDが空です'
    if (!name) return '名前を入力してください'

    if (mode === 'add') {
      if (!form.password) return 'パスワードを入力してください'
      if (form.password.length < 4) return 'パスワードは4文字以上にしてください'
      if (form.password !== form.passwordConfirm) return '確認用パスワードが一致しません'
    }

    if (mode === 'edit' && form.password) {
      if (!form.currentPassword) return '現在のパスワードを入力してください'

      const currentStaff = staff.find((s) => s.id === form.id)
      if (!currentStaff) return '従業員情報が見つかりません'

      if (currentStaff.password !== form.currentPassword) {
        return '現在のパスワードが違います'
      }

      if (form.password.length < 4) return '新しいパスワードは4文字以上にしてください'
      if (form.password !== form.passwordConfirm) return '確認用パスワードが一致しません'
    }

    return ''
  }

  const buildPayload = () => {
    return {
      id: form.id.trim(),
      name: form.name.trim(),
      role: form.role,
      active: mode === 'add' ? true : !!form.active,
      password: form.password,
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

    if (mode === 'edit' && form.password) {
      setPasswordConfirmTarget({ payload })
      return
    }

    commitSave(payload)
  }

  const commitSave = (payload) => {
    if (mode === 'add') {
      setStaff((prev) => [
        {
          ...payload,
          active: true,
        },
        ...prev,
      ])
    } else {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === payload.id
            ? {
                ...s,
                name: payload.name,
                role: payload.role,
                active: payload.active,
                allowedUseCases: payload.allowedUseCases,
                password: payload.password ? payload.password : s.password,
              }
            : s
        )
      )
    }

    setPasswordConfirmTarget(null)
    closeModal()
  }

  const requestToggleActive = (s) => {
    setConfirmTarget({ id: s.id, name: s.name, nextActive: !s.active })
  }

  const cancelToggle = () => setConfirmTarget(null)

  const confirmToggle = () => {
    if (!confirmTarget) return
    const { id, nextActive } = confirmTarget

    setStaff((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, active: nextActive } : s
      )
    )

    setConfirmTarget(null)
  }

  const cancelPasswordConfirm = () => setPasswordConfirmTarget(null)

  const confirmPasswordChange = () => {
    if (!passwordConfirmTarget) return
    commitSave(passwordConfirmTarget.payload)
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

      <div className="staffList">
        {filtered.map((s) => (
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

      {open && (
        <>
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
                <input className="input" value={form.id} disabled />
              </label>

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
