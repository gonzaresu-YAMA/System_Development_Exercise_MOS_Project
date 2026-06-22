import { menuApi } from '../../services/api.js'

export async function loadTags() {
  return menuApi.getTags()
}

// タグは メニュー商品に付属して保存されるため、単独の save/add/remove は
// MenuManagement 側でメニュー商品を更新することで実現する。

/** ローカル状態のタグリストに新しいタグを追加（重複チェック）
 *  APIへの保存は行わない（メニュー商品保存時に反映される）  */
export function addTagLocally(tags, name) {
  const value = String(name || '').trim()
  if (!value) return { ok: false, reason: 'タグ名を入力してください' }
  if (tags.some((t) => String(t).toLowerCase() === value.toLowerCase())) {
    return { ok: false, reason: '同じタグがすでにあります' }
  }
  return { ok: true, tags: [...tags, value] }
}

/** ローカル状態のタグリストからタグを削除 */
export function removeTagLocally(tags, name) {
  return tags.filter((t) => t !== name)
}

