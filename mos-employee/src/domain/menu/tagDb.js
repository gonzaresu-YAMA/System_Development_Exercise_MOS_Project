const TAG_STORAGE_KEY = 'menuTags_v3'

const defaultTags = ['定番', '人気', '季節物', '期間限定']

export function loadTags() {
  const raw = sessionStorage.getItem(TAG_STORAGE_KEY)
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

export function saveTags(tags) {
  sessionStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(tags))
}

export function addTag(name) {
  const value = String(name || '').trim()
  const tags = loadTags()

  if (!value) return { ok: false, reason: 'タグ名を入力してください' }
  if (tags.some((t) => String(t).toLowerCase() === value.toLowerCase())) {
    return { ok: false, reason: '同じタグがすでにあります' }
  }

  const next = [...tags, value]
  saveTags(next)
  return { ok: true, tags: next }
}

export function removeTag(name) {
  const tags = loadTags().filter((t) => t !== name)
  saveTags(tags)
  return tags
}
