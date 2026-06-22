// メニュー管理画面
// 役割：
// - 有効一覧 / 無効一覧 / 売切一覧 / タグ一覧を切り替える
// - 商品追加 / 編集
// - 無効化 / 再有効化 / 削除
// - タグ作成 / 削除
//
// 重要：
// - データの正本は domain/menu/menuDb.js と tagDb.js
// - stock = null は「残数管理しない」商品
// - stock = 0 は売切扱い

import { useEffect, useMemo, useState } from 'react'
import './MenuManagement.css'

import {
  loadMenus,
  saveMenus,
  makeNextMenuId,
  isSoldOut,
  searchMenus,
} from '../../domain/menu/menuDb'
import {
  loadTags,
  addTag,
  removeTag,
} from '../../domain/menu/tagDb'

const yen = (n) => `¥${Number(n || 0).toLocaleString('ja-JP')}`

export default function MenuManagement({ onBack }) {
  // =========================
  // state
  // =========================

  const [tab, setTab] = useState('active')
  const [menus, setMenus] = useState(() => loadMenus())
  const [tags, setTags] = useState(() => loadTags())
  const [query, setQuery] = useState('')

  // 商品追加 / 編集
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('add')
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

  // 無効一覧からの完全削除確認
  const [deleteTarget, setDeleteTarget] = useState(null)

  // タグ追加フォーム
  const [tagInput, setTagInput] = useState('')
  const [tagError, setTagError] = useState('')

  // =========================
  // effect
  // =========================

  useEffect(() => {
    saveMenus(menus)
  }, [menus])

  // =========================
  // 一覧加工
  // =========================

  const filteredMenus = useMemo(() => {
    return searchMenus(menus, query)
  }, [menus, query])

  const activeMenus = useMemo(
    () => filteredMenus.filter((m) => m.active).sort((a, b) => a.name.localeCompare(b.name, 'ja')),
    [filteredMenus]
  )

  const inactiveMenus = useMemo(
    () => filteredMenus.filter((m) => !m.active).sort((a, b) => a.name.localeCompare(b.name, 'ja')),
    [filteredMenus]
  )

  const soldOutMenus = useMemo(
    () => filteredMenus.filter((m) => isSoldOut(m)).sort((a, b) => a.name.localeCompare(b.name, 'ja')),
    [filteredMenus]
  )

  // =========================
  // モーダル操作
  // =========================

  const openAdd = () => {
    setMode('add')
    setForm({
      id: makeNextMenuId(menus),
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

  const openEdit = (menu) => {
    setMode('edit')
    setForm({
      id: menu.id,
      name: menu.name,
      price: Number(menu.price || 0),
      useStock: menu.stock !== null,
      stock: menu.stock === null ? '' : String(menu.stock),
      active: !!menu.active,
      tags: Array.isArray(menu.tags) ? menu.tags : [],
    })
    setError('')
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    setError('')
  }

  // 価格を素早く調整するための補助ボタン用関数
  const adjustPrice = (delta) => {
    setForm((prev) => ({
      ...prev,
      price: Math.max(0, Number(prev.price || 0) + delta),
    }))
  }

  // フォーム上でタグ選択を切り替える
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

  // =========================
  // 保存処理
  // =========================

  const save = () => {
    const name = String(form.name || '').trim()
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

    // 残数管理 ON の時だけ stock を数値として扱う
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
      setMenus((prev) => prev.map((m) => (m.id === payload.id ? payload : m)))
    }

    closeModal()
  }

  // =========================
  // 状態変更
  // =========================

  const disableMenu = (menu) => {
    setMenus((prev) => prev.map((x) => (x.id === menu.id ? { ...x, active: false } : x)))
  }

  const enableMenu = (menu) => {
    setMenus((prev) => prev.map((x) => (x.id === menu.id ? { ...x, active: true } : x)))
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setMenus((prev) => prev.filter((m) => m.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  // =========================
  // タグ操作
  // =========================

  const handleAddTag = () => {
    const result = addTag(tagInput)
    if (!result.ok) {
      setTagError(result.reason)
      return
    }

    setTags(result.tags)
    setTagInput('')
    setTagError('')
  }

  const handleRemoveTag = (tag) => {
    const nextTags = removeTag(tag)
    setTags(nextTags)

    // 商品側からも削除したタグを外す
    setMenus((prev) =>
      prev.map((m) => ({
        ...m,
        tags: (m.tags || []).filter((t) => t !== tag),
      }))
    )
  }

  // 現在タブに応じて表示一覧を切り替える
  const list =
    tab === 'active'
      ? activeMenus
      : tab === 'inactive'
      ? inactiveMenus
      : tab === 'soldout'
      ? soldOutMenus
      : []

  // =========================
  // render
  // =========================

  return (
    <section className="menuPage">
      <div className="menuHeader">
        <div>
          <h2 className="menuTitle">メニュー管理</h2>
          <div className="menuSub">商品管理 / 在庫管理 / タグ管理</div>
        </div>

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

      {/* タブ切り替え */}
      <div className="tabs">
        <button className={tab === 'active' ? 'tab active' : 'tab'} type="button" onClick={() => setTab('active')}>
          有効一覧
        </button>
        <button className={tab === 'inactive' ? 'tab active' : 'tab'} type="button" onClick={() => setTab('inactive')}>
          無効一覧
        </button>
        <button className={tab === 'soldout' ? 'tab active' : 'tab'} type="button" onClick={() => setTab('soldout')}>
          売切一覧
        </button>
        <button className={tab === 'tags' ? 'tab active' : 'tab'} type="button" onClick={() => setTab('tags')}>
          タグ一覧
        </button>
      </div>

      {/* 商品検索 */}
      {tab !== 'tags' && (
        <input
          className="input"
          placeholder="検索（商品名・タグ・ID）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {/* 商品一覧系タブ */}
      {tab !== 'tags' && (
        <div className="list">
          {list.map((m) => (
            <div key={m.id} className="row">
              <div className="main">
                <div className="nameLine">
                  <span className="name">{m.name}</span>
                  <div className="tags">
                    {(m.tags || []).map((t) => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                </div>

                <div className="meta">
                  <span className="chip">{m.id}</span>
                  <span className="chip">{yen(m.price)}</span>

                  {/* 残数管理している商品だけ残数を表示 */}
                  {m.stock !== null && (
                    <span className={`chip ${Number(m.stock) === 0 ? 'dangerChip' : ''}`}>
                      残り {m.stock}
                    </span>
                  )}

                  {/* stock = 0 なら売切バッジ */}
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

          {list.length === 0 && <div className="empty">該当する商品がありません。</div>}
        </div>
      )}

      {/* タグ一覧タブ */}
      {tab === 'tags' && (
        <div className="tagManager">
          <div className="tagAddBox">
            <input
              className="input"
              placeholder="新しいタグ名"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
            <button className="btn primary" type="button" onClick={handleAddTag}>
              追加
            </button>
          </div>

          {tagError && <div className="error">{tagError}</div>}

          <div className="tagList">
            {tags.map((tag) => (
              <div key={tag} className="tagRow">
                <span className="tag">{tag}</span>
                <button className="btn small warn" type="button" onClick={() => handleRemoveTag(tag)}>
                  削除
                </button>
              </div>
            ))}

            {tags.length === 0 && <div className="empty">タグがありません。</div>}
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
                  <button className="priceBtn" type="button" onClick={() => adjustPrice(-100)}>
                    -100
                  </button>
                  <button className="priceBtn" type="button" onClick={() => adjustPrice(-10)}>
                    -10
                  </button>
                  <input
                    className="input priceInput"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                  <button className="priceBtn" type="button" onClick={() => adjustPrice(10)}>
                    +10
                  </button>
                  <button className="priceBtn" type="button" onClick={() => adjustPrice(100)}>
                    +100
                  </button>
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

              {/* 残数管理 ON のときだけ数値入力を出す */}
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
                {tags.length === 0 && <div className="hint">タグ一覧で先にタグを作成してください</div>}
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

      {/* 無効一覧からの完全削除確認 */}
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
