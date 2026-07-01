/**
 * タグドメイン操作レイヤー
 *
 * タグは独立したエンティティとして API から取得できるが、
 * 「タグを単体で追加・削除する」API エンドポイントは存在しない。
 * タグはメニュー商品に付属して保存されるため、
 * ローカル状態を更新した後、メニュー商品の更新時に一緒に送信される設計。
 *
 * addTagLocally / removeTagLocally がローカル状態操作のみを担当し、
 * 実際の API 呼び出しは MenuManagement の handleRemoveTag が行う。
 */
import { menuApi } from '../../services/api.js'

/** バックエンドからタグ一覧を取得 */
export async function loadTags() {
  return menuApi.getTags()
}

/**
 * ローカルのタグリストに新しいタグを追加する（重複チェック付き）
 *
 * API への保存は行わない（商品保存時に一緒に送られる）
 *
 * @param {string[]} tags - 現在のタグリスト
 * @param {string} name - 追加するタグ名
 * @returns {{ ok: true, tags: string[] } | { ok: false, reason: string }}
 *   ok フラグで成否を返す設計にしている理由: UI 側でエラーメッセージを表示しやすいため
 */
export function addTagLocally(tags, name) {
  const value = String(name || '').trim()
  if (!value) return { ok: false, reason: 'タグ名を入力してください' }
  // 大文字小文字を無視して重複チェック
  if (tags.some((t) => String(t).toLowerCase() === value.toLowerCase())) {
    return { ok: false, reason: '同じタグがすでにあります' }
  }
  // イミュータブルに新しい配列を返す（元の tags 配列は変更しない）
  return { ok: true, tags: [...tags, value] }
}

/**
 * ローカルのタグリストから指定タグを除外した新しい配列を返す
 *
 * filter を使ってイミュータブルに更新する（直接 splice しない）
 */
export function removeTagLocally(tags, name) {
  return tags.filter((t) => t !== name)
}

