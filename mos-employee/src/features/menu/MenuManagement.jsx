/**
 * メニュー管理画面（業務用途 - 管理者向け）
 *
 * メニュー商品の追加・編集・有効化/無効化・削除、
 * およびタグの管理を行う画面。
 *
 * タブ構成:
 *   active   → 有効商品一覧（営業中のメニュー）
 *   inactive → 無効商品一覧（非表示にした商品。削除より無効化を推奨）
 *   soldout  → 売切商品一覧（stock が 0 の有効商品）
 *   tags     → タグ管理（タグの追加・削除）
 *
 * 商品のライフサイクル:
 *   追加 → 有効(active) → [無効化] → 無効(inactive) → [再有効化 or 削除]
 *
 * タグの扱い:
 *   タグはメニュー商品に付属して保存される。
 *   タグを削除すると、そのタグを持つ全商品が自動更新される。
 */
import { useEffect, useMemo, useState } from 'react'
import './MenuManagement.css'

import {
  loadMenus,
  isSoldOut,
  searchMenus,
} from '../../domain/menu/menuDb'
import { menuApi } from '../../services/api.js'
import {
  loadTags,
  addTagLocally,
  removeTagLocally,
} from '../../domain/menu/tagDb'

// 価格をフォーマットするユーティリティ（例: 1000 → ¥1,000）
const yen = (n) => `¥${Number(n || 0).toLocaleString('ja-JP')}`

export default function MenuManagement({ onBack }) {
  // タブの選択状態（'active' | 'inactive' | 'soldout' | 'tags'）
  const [tab, setTab] = useState('active')
  const [menus, setMenus] = useState([])    // 全メニュー商品リスト
  const [tags, setTags] = useState([])      // タグリスト
  const [categories, setCategories] = useState([]) // カテゴリ一覧（客側の表示先）
  const [query, setQuery] = useState('')    // 検索ワード
  const [loading, setLoading] = useState(true)

  // 商品追加/編集モーダルの状態
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('add')   // 'add' | 'edit'
  const [form, setForm] = useState({
    id: null,        // null = 新規（サーバーが採番）
    name: '',
    price: 0,
    useStock: false, // 残数管理を使うかどうか（false なら stock は null で送る）
    stock: '',
    active: true,
    tags: [],
    categoryId: null, // 客側メニューでどのカテゴリページに表示するか
    imageUrl: '',      // 客側メニューに表示する商品画像のURL
  })
  const [error, setError] = useState('')

  // 削除確認モーダルの対象商品（null = 非表示）
  const [deleteTarget, setDeleteTarget] = useState(null)

  // タグ管理エリアの入力値とエラー
  const [tagInput, setTagInput] = useState('')
  const [tagError, setTagError] = useState('')

  // メニュー・タグ・カテゴリを並行して取得（Promise.all で3つまとめて待つ）
  useEffect(() => {
    Promise.all([loadMenus(), loadTags(), menuApi.getCategories()])
      .then(([m, t, c]) => {
        setMenus(m)
        setTags(t)
        setCategories(c)
      })
      .catch((e) => console.error('メニュー取得エラー:', e))
      .finally(() => setLoading(false))
  }, [])

  // 検索ワードで絞り込んだメニューリスト（タブへの振り分けはこれを元に行う）
  const filteredMenus = useMemo(() => {
    return searchMenus(menus, query)
  }, [menus, query])

  // 有効商品を五十音順でソート（localeCompare の 'ja' オプションで日本語ソート）
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

  const openAdd = () => {
    setMode('add')
    setForm({
      id: null,
      name: '',
      price: 0,
      useStock: false,
      stock: '',
      active: true,
      tags: [],
      categoryId: categories[0]?.id ?? null,
      imageUrl: '',
    })
    setError('')
    setOpen(true)
  }

  // 「編集」ボタン: 既存商品の情報を form に入れてモーダルを開く
  // useStock: stock が null でなければ残数管理「する」に設定する
  const openEdit = (menu) => {
    setMode('edit')
    setForm({
      id:         menu.id,
      name:       menu.name,
      price:      Number(menu.price || 0),
      useStock:   menu.stock !== null,
      stock:      menu.stock === null ? '' : String(menu.stock),
      active:     !!menu.active,
      tags:       Array.isArray(menu.tags) ? menu.tags : [],
      categoryId: menu.categoryId ?? categories[0]?.id ?? null,
      imageUrl:   menu.imageUrl || '',
    })
    setError('')
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    setError('')
  }

  if (loading) {
    return <section className="menuPage"><p style={{ padding: '2rem' }}>読み込み中…</p></section>
  }

  // 価格を delta だけ増減する（0未満にはならない）
  const adjustPrice = (delta) => {
    setForm((prev) => ({
      ...prev,
      price: Math.max(0, Number(prev.price || 0) + delta),
    }))
  }

  // フォームのタグリストに対してトグル操作を行う（追加 or 除外）
  const toggleTagOnForm = (tag) => {
    setForm((prev) => {
      const exists = prev.tags.includes(tag)
      return {
        ...prev,
        // 既にあれば filter で除外、なければスプレッドで追加（イミュータブル）
        tags: exists
          ? prev.tags.filter((t) => t !== tag)
          : [...prev.tags, tag],
      }
    })
  }

  /**
   * フォームの内容を検証してバックエンドに保存する
   *
   * 検証順序:
   *   1. 商品名が空でないか
   *   2. 価格が有効な非負数か
   *   3. 残数管理「する」の場合、残数が有効な非負数か
   * 全て通過したら API を呼ぶ（add: POST / edit: PUT）
   */
  const save = async () => {
    const name  = String(form.name || '').trim()
    const price = Number(form.price)

    if (!name) {
      setError('商品名を入力してください')
      return
    }

    if (!Number.isFinite(price) || price < 0) {
      setError('価格が不正です')
      return
    }

    // useStock が false なら stock は null（バックエンドが「管理なし」と解釈）
    let stockValue = null
    if (form.useStock) {
      const stockNum = Number(form.stock)
      if (!Number.isFinite(stockNum) || stockNum < 0) {
        setError('残数が不正です')
        return
      }
      stockValue = stockNum
    }

    if (!form.categoryId) {
      setError('カテゴリを選択してください')
      return
    }

    const payload = {
      name,
      price,
      stock: stockValue,
      active: !!form.active,
      tags: form.tags,
      categoryId: form.categoryId,
      imageUrl: String(form.imageUrl || '').trim() || null,
    }

    try {
      if (mode === 'add') {
        // 新規作成: 返ってきた商品をリストの先頭に追加
        const created = await menuApi.create(payload)
        setMenus((prev) => [created, ...prev])
      } else {
        // 編集: 対象IDの商品だけ置き換える（イミュータブル更新）
        const updated = await menuApi.update(form.id, { ...payload })
        setMenus((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
      }
      closeModal()
    } catch {
      setError('保存に失敗しました')
    }
  }

  // 有効商品を無効化する（削除ではなく active: false に更新）
  const disableMenu = async (menu) => {
    try {
      const updated = await menuApi.update(menu.id, { ...menu, active: false })
      setMenus((prev) => prev.map((x) => (x.id === menu.id ? updated : x)))
    } catch (e) {
      console.error('無効化エラー:', e)
    }
  }

  // 無効商品を再有効化する（active: true に更新）
  const enableMenu = async (menu) => {
    try {
      const updated = await menuApi.update(menu.id, { ...menu, active: true })
      setMenus((prev) => prev.map((x) => (x.id === menu.id ? updated : x)))
    } catch (e) {
      console.error('有効化エラー:', e)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await menuApi.delete(deleteTarget.id)
      setMenus((prev) => prev.filter((m) => m.id !== deleteTarget.id))
    } catch (e) {
      console.error('削除エラー:', e)
    }
    setDeleteTarget(null)
  }

  // タグを追加する（重複チェックは addTagLocally が担当）
  const handleAddTag = () => {
    const result = addTagLocally(tags, tagInput)
    if (!result.ok) {
      setTagError(result.reason)
      return
    }
    setTags(result.tags)
    setTagInput('')
    setTagError('')
  }

  /**
   * タグを削除する
   *
   * タグには独立した削除 API がないため、以下の手順で対応する:
   *   1. ローカルのタグリストから即座に削除（画面上は消える）
   *   2. そのタグを持つ全商品に対して PUT リクエストを送り、タグを除いて保存
   *
   * for...of で順番に処理している理由:
   *   Promise.all で並列実行すると多数のリクエストが同時に飛ぶため、
   *   サーバー負荷を考慮して順次処理している
   */
  const handleRemoveTag = async (tag) => {
    // ローカルのタグリストから削除
    setTags((prev) => removeTagLocally(prev, tag))
    // そのタグを持つ全メニュー商品を更新（タグを除いて保存）
    const affected = menus.filter((m) => (m.tags || []).includes(tag))
    for (const menu of affected) {
      const updated = { ...menu, tags: menu.tags.filter((t) => t !== tag) }
      try {
        const saved = await menuApi.update(menu.id, updated)
        setMenus((prev) => prev.map((m) => (m.id === saved.id ? saved : m)))
      } catch (e) {
        console.error('タグ削除更新エラー:', e)
      }
    }
  }

  // 現在のタブに対応する商品リストを選択する（tags タブは別区画に描画するため空配列）
  const list =
    tab === 'active'   ? activeMenus   :
    tab === 'inactive' ? inactiveMenus :
    tab === 'soldout'  ? soldOutMenus  : []

  return (
    <section className="menuPage">
      <div className="menuHeader">
        <div>
          <button className="btn ghost" type="button" onClick={onBack}>
            戻る
          </button>
          <h2 className="menuTitle">メニュー管理</h2>
          <div className="menuSub">商品管理 / 在庫管理 / タグ管理</div>
        </div>

        <div className="menuHeaderActions">

          {tab !== 'tags' && (
            <button className="btn primary" type="button" onClick={openAdd}>
              ＋ 追加
            </button>
          )}
        </div>
      </div>

      {/* タブ切り替え: active/inactive/soldout/tags */}
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

      {/* 検索ボックス: タグ一覧タブでは不要なため非表示 */}
      {tab !== 'tags' && (
        <input
          className="input"
          placeholder="検索（商品名・タグ・ID）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {/* 商品リスト（タグタブ以外） */}
      {tab !== 'tags' && (
        <div className="list">
          {list.map((m) => (
            <div key={m.id} className="row">
              <div className="main">
                <div className="nameLine">
                  <span className="name">{m.name}</span>
                  {/* タグを横並びでバッジ表示 */}
                  <div className="tags">
                    {(m.tags || []).map((t) => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                </div>

                <div className="meta">
                  <span className="chip">{m.id}</span>
                  <span className="chip">
                    {categories.find((c) => c.id === m.categoryId)?.displayName || '未分類'}
                  </span>
                  <span className="chip">{yen(m.price)}</span>
                  {/* stock が null でないときのみ残数を表示（残数 0 は赤色） */}
                  {m.stock !== null && (
                    <span className={`chip ${Number(m.stock) === 0 ? 'dangerChip' : ''}`}>
                      残り {m.stock}
                    </span>
                  )}
                  {/* isSoldOut(m): active かつ stock=0 のときに売切バッジを表示 */}
                  {isSoldOut(m) && <span className="badge">売切</span>}
                </div>
              </div>

              <div className="actions">
                <button className="btn small" type="button" onClick={() => openEdit(m)}>
                  編集
                </button>

                {/* 有効一覧タブのみ「無効化」を表示（active: false に更新） */}
                {tab === 'active' && (
                  <button className="btn small warn" type="button" onClick={() => disableMenu(m)}>
                    無効化
                  </button>
                )}

                {/* 無効一覧タブのみ「再有効化」と「削除」を表示 */}
                {tab === 'inactive' && (
                  <>
                    <button className="btn small primary" type="button" onClick={() => enableMenu(m)}>
                      再有効化
                    </button>
                    {/* 削除はsetDeleteTargetで確認モーダルを開く（直接削除しない） */}
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

      {/* タグ管理タブ: タグの追加と削除 */}
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
                {/* タグ削除: ローカルリストから除去 + そのタグを持つ全商品も更新 */}
                <button className="btn small warn" type="button" onClick={() => handleRemoveTag(tag)}>
                  削除
                </button>
              </div>
            ))}

            {tags.length === 0 && <div className="empty">タグがありません。</div>}
          </div>
        </div>
      )}

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
                <input className="input" value={form.id ?? '(自動採番)'} disabled />
              </label>

              <label className="label">
                カテゴリ（客側メニューの表示先）
                <select
                  className="input"
                  value={form.categoryId ?? ''}
                  onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.displayName}</option>
                  ))}
                </select>
              </label>

              <label className="label">
                商品画像URL（任意）
                <input
                  className="input"
                  placeholder="https://... または /images/xxx.jpg"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
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
