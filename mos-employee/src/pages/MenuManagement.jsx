import { useEffect, useMemo, useState } from 'react'
import './MenuManagement.css'

const STORAGE_KEY = 'menuList_v1'

const defaultMenus = [
  { id: 'M001', name: '枝豆', price: 380, soldOut: false },
  { id: 'M002', name: '唐揚げ', price: 580, soldOut: false },
  { id: 'M003', name: 'ハイボール', price: 450, soldOut: true },
  { id: 'M004', name: 'レモンサワー', price: 480, soldOut: false },
]

function loadMenus() {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return defaultMenus
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : defaultMenus
  } catch {
    return defaultMenus
  }
}

function saveMenus(list) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const yen = (n) => `¥${Number(n || 0).toLocaleString('ja-JP')}`

export default function MenuManagement({ onBack }) {
  const [tab, setTab] = useState('list') // list | soldout | price
  const [menus, setMenus] = useState(() => loadMenus())

  // 検索（全タブ共通）
  const [query, setQuery] = useState('')

  // 売切タブの切替：売切のみ / 全件
  const [soldOutOnly, setSoldOutOnly] = useState(true)

  // 追加/編集モーダル
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('add') // add | edit
  const [form, setForm] = useState({ id: '', name: '', price: 0, soldOut: false })
  const [error, setError] = useState('')

  // 削除確認
  const [deleteTarget, setDeleteTarget] = useState(null)

  // ✅ 売切ON確認
  const [soldOutTarget, setSoldOutTarget] = useState(null)

  // ✅ 一括売切解除確認
  const [bulkResetOpen, setBulkResetOpen] = useState(false)

  useEffect(() => {
    saveMenus(menus)
  }, [menus])

  // ESCで閉じる
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setDeleteTarget(null)
        setSoldOutTarget(null)
        setBulkResetOpen(false)
        setError('')
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const filteredMenus = useMemo(() => {
    const q = query.trim().toLowerCase()

    return menus
      .filter((m) => {
        if (!q) return true
        return (
          m.id.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q)
        )
      })
      // 表示順：売切は下、名前順
      .sort((a, b) => {
        if (a.soldOut !== b.soldOut) return a.soldOut ? 1 : -1
        return a.name.localeCompare(b.name, 'ja')
      })
  }, [menus, query])

  const soldOutView = useMemo(() => {
    const base = filteredMenus
    return soldOutOnly ? base.filter((m) => m.soldOut) : base
  }, [filteredMenus, soldOutOnly])

  const soldOutCount = useMemo(() => {
    return menus.filter((m) => m.soldOut).length
  }, [menus])

  const openAdd = () => {
    const nextId = makeNextId(menus)
    setMode('add')
    setForm({ id: nextId, name: '', price: 0, soldOut: false })
    setError('')
    setOpen(true)
  }

  const openEdit = (m) => {
    setMode('edit')
    setForm({ ...m })
    setError('')
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    setError('')
  }

  const validate = () => {
    const id = form.id.trim()
    const name = form.name.trim()
    const price = Number(form.price)

    if (!id) return 'IDが空です'
    if (!name) return '商品名を入力してください'
    if (!Number.isFinite(price) || price < 0) return '価格が不正です'

    if (mode === 'add') {
      const exists = menus.some((m) => m.id.toLowerCase() === id.toLowerCase())
      if (exists) return '同じIDがすでに存在します'
    }

    return ''
  }

  const save = () => {
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }

    const payload = {
      id: form.id.trim(),
      name: form.name.trim(),
      price: Number(form.price),
      soldOut: !!form.soldOut,
    }

    if (mode === 'add') {
      setMenus((prev) => [payload, ...prev])
    } else {
      setMenus((prev) => prev.map((m) => (m.id === payload.id ? payload : m)))
    }

    closeModal()
  }

  // ✅ 売切トグル
  const requestToggleSoldOut = (menu) => {
    if (menu.soldOut) {
      // 売切解除は確認なし
      setMenus((prev) =>
        prev.map((m) => (m.id === menu.id ? { ...m, soldOut: false } : m))
      )
      return
    }

    // 売切ONは確認あり
    setSoldOutTarget(menu)
  }

  const confirmSoldOut = () => {
    if (!soldOutTarget) return
    setMenus((prev) =>
      prev.map((m) => (m.id === soldOutTarget.id ? { ...m, soldOut: true } : m))
    )
    setSoldOutTarget(null)
  }

  const cancelSoldOut = () => setSoldOutTarget(null)

  const updatePrice = (id, price) => {
    const p = Number(price)
    if (!Number.isFinite(p) || p < 0) return
    setMenus((prev) =>
      prev.map((m) => (m.id === id ? { ...m, price: p } : m))
    )
  }

  const bumpPrice = (id, delta) => {
    setMenus((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, price: Math.max(0, Number(m.price) + delta) } : m
      )
    )
  }

  const requestDelete = (m) => setDeleteTarget(m)
  const cancelDelete = () => setDeleteTarget(null)

  const confirmDelete = () => {
    if (!deleteTarget) return
    setMenus((prev) => prev.filter((m) => m.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  // ✅ 一括売切解除
  const requestBulkReset = () => setBulkResetOpen(true)
  const cancelBulkReset = () => setBulkResetOpen(false)

  const confirmBulkReset = () => {
    setMenus((prev) => prev.map((m) => ({ ...m, soldOut: false })))
    setBulkResetOpen(false)
  }

  return (
    <section className="menuPage">
      {/* ヘッダー */}
      <div className="menuHeader">
        <div>
          <h2 className="menuTitle">メニュー管理</h2>
          <div className="menuSub">売切でも表示（A1）／売切は注文不可の想定</div>
        </div>

        <div className="menuHeaderActions">
          <button className="btn ghost" type="button" onClick={onBack}>
            戻る
          </button>
          <button className="btn primary" type="button" onClick={openAdd}>
            ＋ 商品追加
          </button>
        </div>
      </div>

      {/* タブ */}
      <div className="tabs">
        <button
          className={`tab ${tab === 'list' ? 'active' : ''}`}
          onClick={() => setTab('list')}
          type="button"
        >
          商品一覧
        </button>
        <button
          className={`tab ${tab === 'soldout' ? 'active' : ''}`}
          onClick={() => setTab('soldout')}
          type="button"
        >
          売切
        </button>
        <button
          className={`tab ${tab === 'price' ? 'active' : ''}`}
          onClick={() => setTab('price')}
          type="button"
        >
          価格
        </button>
      </div>

      {/* 検索 */}
      <div className="controls">
        <input
          className="input"
          value={query}
          placeholder="検索（商品名 / ID）"
          onChange={(e) => setQuery(e.target.value)}
        />

        {tab === 'soldout' && (
          <div className="soldoutToolbar">
            <div className="seg2">
              <button
                type="button"
                className={`segBtn ${soldOutOnly ? 'active' : ''}`}
                onClick={() => setSoldOutOnly(true)}
              >
                売切のみ
              </button>
              <button
                type="button"
                className={`segBtn ${!soldOutOnly ? 'active' : ''}`}
                onClick={() => setSoldOutOnly(false)}
              >
                全件
              </button>
            </div>

            <button
              type="button"
              className="btn warn"
              onClick={requestBulkReset}
              disabled={soldOutCount === 0}
            >
              一括売切解除
            </button>
          </div>
        )}
      </div>

      {/* コンテンツ */}
      {tab === 'list' && (
        <div className="list">
          {filteredMenus.map((m) => (
            <div key={m.id} className={`row ${m.soldOut ? 'soldOut' : ''}`}>
              <div className="main">
                <div className="nameLine">
                  <span className="name">{m.name}</span>
                  {m.soldOut && <span className="badge">売切</span>}
                </div>
                <div className="meta">
                  <span className="chip">{m.id}</span>
                  <span className="chip">{yen(m.price)}</span>
                </div>
              </div>

              <div className="actions">
                <button
                  className={`btn small ${m.soldOut ? 'primary' : ''}`}
                  type="button"
                  onClick={() => requestToggleSoldOut(m)}
                >
                  {m.soldOut ? '売切解除' : '売切'}
                </button>
                <button className="btn small" type="button" onClick={() => openEdit(m)}>
                  編集
                </button>
                <button className="btn small warn" type="button" onClick={() => requestDelete(m)}>
                  削除
                </button>
              </div>
            </div>
          ))}

          {filteredMenus.length === 0 && (
            <div className="empty">該当する商品がありません。</div>
          )}
        </div>
      )}

      {tab === 'soldout' && (
        <div className="list">
          {soldOutView.map((m) => (
            <div key={m.id} className={`row ${m.soldOut ? 'soldOut' : ''}`}>
              <div className="main">
                <div className="nameLine">
                  <span className="name">{m.name}</span>
                  {m.soldOut && <span className="badge">売切</span>}
                </div>
                <div className="meta">
                  <span className="chip">{m.id}</span>
                  <span className="chip">{yen(m.price)}</span>
                </div>
              </div>

              <div className="actions">
                <button
                  className={`btn small ${m.soldOut ? 'primary' : ''}`}
                  type="button"
                  onClick={() => requestToggleSoldOut(m)}
                >
                  {m.soldOut ? '売切解除' : '売切'}
                </button>
              </div>
            </div>
          ))}

          {soldOutView.length === 0 && (
            <div className="empty">
              {soldOutOnly ? '売切の商品がありません。' : '該当する商品がありません。'}
            </div>
          )}
        </div>
      )}

      {tab === 'price' && (
        <div className="list">
          {filteredMenus.map((m) => (
            <div key={m.id} className={`row ${m.soldOut ? 'soldOut' : ''}`}>
              <div className="main">
                <div className="nameLine">
                  <span className="name">{m.name}</span>
                  {m.soldOut && <span className="badge">売切</span>}
                </div>
                <div className="meta">
                  <span className="chip">{m.id}</span>
                </div>
              </div>

              <div className="priceActions">
                <button className="btn small" type="button" onClick={() => bumpPrice(m.id, -100)}>
                  -100
                </button>
                <button className="btn small" type="button" onClick={() => bumpPrice(m.id, -50)}>
                  -50
                </button>

                <input
                  className="priceInput"
                  type="number"
                  min="0"
                  value={m.price}
                  onChange={(e) => updatePrice(m.id, e.target.value)}
                />

                <button className="btn small" type="button" onClick={() => bumpPrice(m.id, 50)}>
                  +50
                </button>
                <button className="btn small" type="button" onClick={() => bumpPrice(m.id, 100)}>
                  +100
                </button>
              </div>
            </div>
          ))}

          {filteredMenus.length === 0 && (
            <div className="empty">該当する商品がありません。</div>
          )}
        </div>
      )}

      {/* 追加/編集モーダル */}
      {open && (
        <>
          <div className="overlay" onClick={closeModal} />
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modalTitle">{mode === 'add' ? '商品追加' : '商品編集'}</div>

            <div className="form">
              <label className="label">
                商品名
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="例：唐揚げ"
                />
              </label>

              <label className="label">
                ID
                <input
                  className="input"
                  value={form.id}
                  onChange={(e) => setForm((p) => ({ ...p, id: e.target.value }))}
                  disabled={mode === 'edit'}
                />
              </label>

              <label className="label">
                価格（円）
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                />
              </label>

              <label className="label row">
                売切
                <div className="toggle">
                  <button
                    type="button"
                    className={`toggleBtn ${form.soldOut ? 'active' : ''}`}
                    onClick={() => setForm((p) => ({ ...p, soldOut: true }))}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    className={`toggleBtn ${!form.soldOut ? 'active' : ''}`}
                    onClick={() => setForm((p) => ({ ...p, soldOut: false }))}
                  >
                    OFF
                  </button>
                </div>
              </label>

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

      {/* 削除確認 */}
      {deleteTarget && (
        <>
          <div className="overlay" onClick={cancelDelete} />
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modalTitle">削除確認</div>
            <p className="confirmText">
              <strong>{deleteTarget.name}</strong>（{deleteTarget.id}）を削除しますか？
            </p>
            <div className="modalActions">
              <button className="btn ghost" type="button" onClick={cancelDelete}>
                キャンセル
              </button>
              <button className="btn warn" type="button" onClick={confirmDelete}>
                削除
              </button>
            </div>
          </div>
        </>
      )}

      {/* ✅ 売切ON確認 */}
      {soldOutTarget && (
        <>
          <div className="overlay" onClick={cancelSoldOut} />
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modalTitle">確認</div>
            <p className="confirmText">
              <strong>{soldOutTarget.name}</strong> を売切にしますか？
            </p>
            <div className="modalActions">
              <button className="btn ghost" type="button" onClick={cancelSoldOut}>
                キャンセル
              </button>
              <button className="btn warn" type="button" onClick={confirmSoldOut}>
                売切にする
              </button>
            </div>
          </div>
        </>
      )}

      {/* ✅ 一括売切解除確認 */}
      {bulkResetOpen && (
        <>
          <div className="overlay" onClick={cancelBulkReset} />
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modalTitle">確認</div>
            <p className="confirmText">
              売切中の商品をすべて解除しますか？
            </p>
            <div className="modalActions">
              <button className="btn ghost" type="button" onClick={cancelBulkReset}>
                キャンセル
              </button>
              <button className="btn primary" type="button" onClick={confirmBulkReset}>
                一括解除する
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function makeNextId(menus) {
  const nums = menus
    .map((m) => m.id)
    .filter((id) => /^M\d{3}$/i.test(id))
    .map((id) => Number(id.slice(1)))
    .filter((n) => Number.isFinite(n))

  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `M${String(next).padStart(3, '0')}`
}
