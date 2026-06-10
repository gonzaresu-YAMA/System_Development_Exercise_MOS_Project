import { useEffect, useMemo, useState } from 'react'
import './MenuManagement.css'

const MENU_STORAGE_KEY = 'menuList_v4'
const TAG_STORAGE_KEY = 'menuTags_v2'

const defaultMenus = [
  {
    id: 'M001',
    name: '枝豆',
    price: 380,
    stock: null, // null = 残数管理しない
    active: true,
    tags: ['定番'],
  },
  {
    id: 'M002',
    name: '唐揚げ',
    price: 580,
    stock: 5,
    active: true,
    tags: ['人気'],
  },
  {
    id: 'M003',
    name: 'ハイボール',
    price: 450,
    stock: 0,
    active: true,
    tags: ['定番'],
  },
]

const defaultTags = ['定番', '人気', '季節物', '期間限定']

function loadMenus() {
  const raw = sessionStorage.getItem(MENU_STORAGE_KEY)
  if (!raw) return defaultMenus
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : defaultMenus
  } catch {
    return defaultMenus
  }
}

function saveMenus(list) {
  sessionStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(list))
}

function loadTags() {
  const raw = sessionStorage.getItem(TAG_STORAGE_KEY)
  if (!raw) return defaultTags
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : defaultTags
  } catch {
    return defaultTags
  }
}

function saveTags(list) {
  sessionStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(list))
}

const yen = (n) => `¥${Number(n || 0).toLocaleString('ja-JP')}`

function isSoldOut(menu) {
  return menu.active && menu.stock !== null && Number(menu.stock) === 0
}

export default function MenuManagement({ onBack }) {
  const [tab, setTab] = useState('active') // active | inactive | soldout | tags
  const [menus, setMenus] = useState(() => loadMenus())
  const [tags, setTags] = useState(() => loadTags())
  const [query, setQuery] = useState('')

  // 商品追加/編集
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('add') // add | edit
  const [form, setForm] = useState({
    id: '',
    name: '',
    price: 0,
    useStock: false,
    stock: '',
    active: true,
    tags: [],
  })
  const [error, setError] = useState('')

  // 無効一覧からの完全削除
  const [deleteTarget, setDeleteTarget] = useState(null)

  // タグ追加
  const [tagInput, setTagInput] = useState('')
  const [tagError, setTagError] = useState('')

  useEffect(() => {
    saveMenus(menus)
  }, [menus])

  useEffect(() => {
    saveTags(tags)
  }, [tags])

  const filteredMenus = useMemo(() => {
    const q = query.trim().toLowerCase()

    return menus.filter((m) => {
      if (!q) return true
      return (
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        (m.tags || []).some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [menus, query])

  const activeMenus = useMemo(
    () =>
      filteredMenus
        .filter((m) => m.active)
        .sort((a, b) => a.name.localeCompare(b.name, 'ja')),
    [filteredMenus]
  )

  const inactiveMenus = useMemo(
    () =>
      filteredMenus
        .filter((m) => !m.active)
        .sort((a, b) => a.name.localeCompare(b.name, 'ja')),
    [filteredMenus]
  )

  const soldOutMenus = useMemo(
    () =>
      filteredMenus
        .filter((m) => isSoldOut(m))
        .sort((a, b) => a.name.localeCompare(b.name, 'ja')),
    [filteredMenus]
  )

  const openAdd = () => {
    setMode('add')
    setForm({
      id: makeNextId(menus),
      name: '',
      price: 0,
      useStock: false,
      stock: '',
      active: true,
      tags: [],
    })
    setError('')
    setOpen(true)
  }

  const openEdit = (m) => {
    setMode('edit')
    setForm({
      id: m.id,
      name: m.name,
      price: Number(m.price || 0),
      useStock: m.stock !== null,
      stock: m.stock === null ? '' : String(m.stock),
      active: !!m.active,
      tags: Array.isArray(m.tags) ? m.tags : [],
    })
    setError('')
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    setError('')
  }

  const adjustPrice = (delta) => {
    setForm((prev) => ({
      ...prev,
      price: Math.max(0, Number(prev.price || 0) + delta),
    }))
  }

  const save = () => {
    const name = form.name.trim()
    const price = Number(form.price)

    if (!name) {
      setError('商品名を入力してください')
      return
    }

    if (!Number.isFinite(price) || price < 0) {
      setError('価格が不正です')
      return
    }

    let stockValue = null

    if (form.useStock) {
      const stockNum = Number(form.stock)
      if (!Number.isFinite(stockNum) || stockNum < 0) {
        setError('残数が不正です')
        return
      }
      stockValue = stockNum
    }

    const payload = {
      id: form.id,
      name,
      price,
      stock: stockValue,
      active: !!form.active,
      tags: form.tags,
    }

    if (mode === 'add') {
      setMenus((prev) => [payload, ...prev])
    } else {
      setMenus((prev) =>
        prev.map((m) => (m.id === payload.id ? payload : m))
      )
    }

    closeModal()
  }

  const disableMenu = (m) => {
    setMenus((prev) =>
      prev.map((x) =>
        x.id === m.id
          ? {
              ...x,
              active: false,
            }
          : x
      )
    )
  }

  const enableMenu = (m) => {
    setMenus((prev) =>
      prev.map((x) =>
        x.id === m.id
          ? {
              ...x,
              active: true,
            }
          : x
      )
    )
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setMenus((prev) => prev.filter((m) => m.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const addTag = () => {
    const value = tagInput.trim()
    if (!value) {
      setTagError('タグ名を入力してください')
      return
    }

    const exists = tags.some((t) => t.toLowerCase() === value.toLowerCase())
    if (exists) {
      setTagError('同じタグがすでにあります')
      return
    }

    setTags((prev) => [...prev, value])
    setTagInput('')
    setTagError('')
  }

  const removeTag = (tag) => {
    setTags((prev) => prev.filter((t) => t !== tag))
    setMenus((prev) =>
      prev.map((m) => ({
        ...m,
        tags: (m.tags || []).filter((t) => t !== tag),
      }))
    )
  }

  const toggleTagOnForm = (tag) => {
    setForm((prev) => {
      const exists = prev.tags.includes(tag)
      return {
        ...prev,
        tags: exists
          ? prev.tags.filter((t) => t !== tag)
          : [...prev.tags, tag],
      }
    })
  }

  const list =
    tab === 'active'
      ? activeMenus
      : tab === 'inactive'
      ? inactiveMenus
      : tab === 'soldout'
      ? soldOutMenus
      : []

  return (
    <section className="menuPage">
      <div className="menuHeader">
        <h2 className="menuTitle">メニュー管理</h2>
        <div className="menuHeaderActions">
          <button className="btn ghost" type="button" onClick={onBack}>
            戻る
          </button>
          {tab !== 'tags' && (
            <button className="btn primary" type="button" onClick={openAdd}>
              ＋ 追加
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        <button
          className={tab === 'active' ? 'tab active' : 'tab'}
          onClick={() => setTab('active')}
          type="button"
        >
          有効一覧
        </button>
        <button
          className={tab === 'inactive' ? 'tab active' : 'tab'}
          onClick={() => setTab('inactive')}
          type="button"
        >
          無効一覧
        </button>
        <button
          className={tab === 'soldout' ? 'tab active' : 'tab'}
          onClick={() => setTab('soldout')}
          type="button"
        >
          売切一覧
        </button>
        <button
          className={tab === 'tags' ? 'tab active' : 'tab'}
          onClick={() => setTab('tags')}
          type="button"
        >
          タグ一覧
        </button>
      </div>

      {tab !== 'tags' && (
        <input
          className="input"
          placeholder="検索（商品名・タグ・ID）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {/* 商品一覧系 */}
      {tab !== 'tags' && (
        <div className="list">
          {list.map((m) => (
            <div key={m.id} className="row">
              <div className="main">
                <div className="nameLine">
                  <span className="name">{m.name}</span>

                  <div className="tags">
                    {(m.tags || []).map((t, i) => (
                      <span key={i} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="meta">
                  <span className="chip">{m.id}</span>
                  <span className="chip">{yen(m.price)}</span>

                  {m.stock !== null && (
                    <span className={`chip ${Number(m.stock) === 0 ? 'dangerChip' : ''}`}>
                      残り {m.stock}
                    </span>
                  )}

                  {isSoldOut(m) && <span className="badge">売切</span>}
                </div>
              </div>

              <div className="actions">
                <button className="btn small" type="button" onClick={() => openEdit(m)}>
                  編集
                </button>

                {tab === 'active' && (
                  <button className="btn small warn" type="button" onClick={() => disableMenu(m)}>
                    無効化
                  </button>
                )}

                {tab === 'inactive' && (
                  <>
                    <button className="btn small primary" type="button" onClick={() => enableMenu(m)}>
                      再有効化
                    </button>
                    <button className="btn small warn" type="button" onClick={() => setDeleteTarget(m)}>
                      削除
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {list.length === 0 && (
            <div className="empty">該当する商品がありません。</div>
          )}
        </div>
      )}

      {/* タグ一覧 */}
      {tab === 'tags' && (
        <div className="tagManager">
          <div className="tagAddBox">
            <input
              className="input"
              placeholder="新しいタグ名"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
            <button className="btn primary" type="button" onClick={addTag}>
              追加
            </button>
          </div>

          {tagError && <div className="error">{tagError}</div>}

          <div className="tagList">
            {tags.map((tag) => (
              <div key={tag} className="tagRow">
                <span className="tag">{tag}</span>
                <button className="btn small warn" type="button" onClick={() => removeTag(tag)}>
                  削除
                </button>
              </div>
            ))}

            {tags.length === 0 && (
              <div className="empty">タグがありません。</div>
            )}
          </div>
        </div>
      )}

      {/* 商品追加 / 編集モーダル */}
      {open && (
        <>
          <div className="overlay" onClick={closeModal} />
          <div className="modal" role="dialog" aria-modal="true">
            <h3 className="modalTitle">{mode === 'add' ? '商品追加' : '商品編集'}</h3>

            <div className="form">
              <label className="label">
                商品名
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>

              <label className="label">
                商品ID
                <input className="input" value={form.id} disabled />
              </label>

              <label className="label">
                価格
                <div className="priceEditor">
                  <button className="priceBtn" type="button" onClick={() => adjustPrice(-100)}>-100</button>
                  <button className="priceBtn" type="button" onClick={() => adjustPrice(-10)}>-10</button>

                  <input
                    className="input priceInput"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />

                  <button className="priceBtn" type="button" onClick={() => adjustPrice(10)}>+10</button>
                  <button className="priceBtn" type="button" onClick={() => adjustPrice(100)}>+100</button>
                </div>
              </label>

              <label className="label">
                残数管理
                <div className="stockMode">
                  <button
                    type="button"
                    className={form.useStock ? 'stockModeBtn' : 'stockModeBtn active'}
                    onClick={() => setForm((prev) => ({ ...prev, useStock: false, stock: '' }))}
                  >
                    しない
                  </button>
                  <button
                    type="button"
                    className={form.useStock ? 'stockModeBtn active' : 'stockModeBtn'}
                    onClick={() => setForm((prev) => ({ ...prev, useStock: true, stock: prev.stock || '0' }))}
                  >
                    する
                  </button>
                </div>
              </label>

              {form.useStock && (
                <label className="label">
                  残数
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </label>
              )}

              <div className="label">
                タグ
                <div className="tagSelector">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={form.tags.includes(tag) ? 'tagPick active' : 'tagPick'}
                      onClick={() => toggleTagOnForm(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {tags.length === 0 && (
                  <div className="hint">タグ一覧で先にタグを作成してください</div>
                )}
              </div>

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

      {/* 無効一覧からの完全削除 */}
      {deleteTarget && (
        <>
          <div className="overlay" onClick={() => setDeleteTarget(null)} />
          <div className="modal" role="dialog" aria-modal="true">
            <p className="confirmText">
              <strong>{deleteTarget.name}</strong> を完全に削除しますか？
            </p>

            <div className="modalActions">
              <button className="btn ghost" type="button" onClick={() => setDeleteTarget(null)}>
                キャンセル
              </button>
              <button className="btn warn" type="button" onClick={confirmDelete}>
                削除
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function makeNextId(list) {
  const nums = list
    .map((m) => m.id)
    .filter((id) => /^M\d+$/.test(id))
    .map((id) => Number(id.slice(1)))
    .filter((n) => Number.isFinite(n))

  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `M${String(next).padStart(3, '0')}`
}