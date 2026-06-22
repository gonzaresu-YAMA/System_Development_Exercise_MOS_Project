// タグ一覧の永続化を担当するファイル
// 役割：
// - メニュー用タグの一覧を sessionStorage に保存する
// - タグの追加 / 削除を一元管理する
// 将来 API 化する時は、このファイルの関数を fetch / client に置き換える想定

const TAG_STORAGE_KEY = 'menuTags_v3'

// 初期タグ
const defaultTags = ['定番', '人気', '季節物', '期間限定']

// タグ一覧を読み込む
export function loadTags() {
  const raw = sessionStorage.getItem(TAG_STORAGE_KEY)

  // 初回起動時は既定タグを保存して返す
  if (!raw) {
    sessionStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(defaultTags))
    return defaultTags
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : defaultTags
  } catch {
    return defaultTags
  }
}

// タグ一覧を保存する
export function saveTags(tags) {
  sessionStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(tags))
}

// タグ追加
// 戻り値を { ok, reason, tags } 形式にして、UI 側でエラーハンドリングしやすくしている
export function addTag(name) {
  const value = String(name || '').trim()
  const tags = loadTags()

  if (!value) return { ok: false, reason: 'タグ名を入力してください' }

  // 大文字小文字を無視して重複判定する
  if (tags.some((t) => String(t).toLowerCase() === value.toLowerCase())) {
    return { ok: false, reason: '同じタグがすでにあります' }
  }

  const next = [...tags, value]
  saveTags(next)
  return { ok: true, tags: next }
}

// タグ削除
// ※ 商品側のタグ参照解除は feature 側で同時に行う
export function removeTag(name) {
  const tags = loadTags().filter((t) => t !== name)
  saveTags(tags)
  return tags
}
