/**
 * スタッフドメイン操作レイヤー
 *
 * API 呼び出しとビジネスロジック（ID採番・デフォルト権限・認証）を担当する。
 * コンポーネントからはこのレイヤーを通じてデータ操作を行うことで
 * UI とビジネスロジックを分離する（関心の分離）。
 */
import { staffApi } from '../../services/api.js'

/** 全スタッフをバックエンドから取得 */
export async function loadStaff() {
  return staffApi.getAll()
}

/**
 * 役職に応じた新しいスタッフIDを自動採番する
 *
 * IDの書式:
 *   - 社員/店長: S000001, S000002, ... （S + 6桁連番）
 *   - アルバイト: A000001, A000002, ... （A + 6桁連番）
 *
 * アルゴリズム:
 *   既存スタッフのIDから数値部分を抽出 → 最大値を見つける → +1 してゼロパディング
 *
 * @param {string} role - 役職 ('manager' | 'employee' | 'partTime')
 * @param {Array} staffList - 現在の全スタッフリスト（採番の重複防止に使用）
 */
export function generateIdByRole(role, staffList = []) {
  const list = staffList || []
  if (role === 'partTime') {
    // A000001 形式の既存IDから数値を取り出す
    const nums = list
      .map((x) => x.id)
      .filter((id) => /^A\d{6}$/i.test(String(id)))
      .map((id) => Number(String(id).slice(1)))  // 'A' を除いた数値部分
      .filter(Number.isFinite)
    const max = nums.length ? Math.max(...nums) : 0
    return `A${String(max + 1).padStart(6, '0')}`
  }
  // S000001 形式（manager / employee 共通）
  const nums = list
    .map((x) => x.id)
    .filter((id) => /^S\d{6}$/i.test(String(id)))
    .map((id) => Number(String(id).slice(1)))
    .filter(Number.isFinite)
  const max = nums.length ? Math.max(...nums) : 0
  return `S${String(max + 1).padStart(6, '0')}`
}

/**
 * 役職に対応するデフォルトのユースケース権限を返す
 *
 * 権限マトリクス:
 *   manager  : hall, kitchen, admin（全機能）
 *   employee : hall, kitchen, admin（店長と同じ）
 *   partTime : hall, kitchen のみ（管理画面にはアクセス不可）
 */
export function getDefaultUseCasesFromRole(role) {
  if (role === 'manager') return ['hall', 'kitchen', 'admin']
  if (role === 'employee') return ['hall', 'kitchen', 'admin']
  return ['hall', 'kitchen']  // partTime は admin 不可
}

/**
 * sessionStorage から読み込んだ allowedUseCases を正規化する
 *
 * アルバイトの場合は 'admin' を強制除外する。
 * サーバー側でも弾くが、フロント側でも念のため除外する二重チェック。
 *
 * @param {string} role - 役職
 * @param {string[]} allowedUseCases - API から取得した許可用途の配列
 */
export function normalizeAllowedUseCases(role, allowedUseCases) {
  const set = new Set(allowedUseCases || [])
  if (role === 'partTime') set.delete('admin')
  return Array.from(set)
}

/**
 * バックエンド認証を実行し、結果を統一フォーマットで返す
 *
 * @returns {{ ok: true, user: object } | { ok: false, reason: string }}
 *
 * エラーを throw せず ok フラグで成否を返す設計にしている理由:
 *   LoginPage 側で try/catch を重ねずに成功/失敗を一箇所で処理できるため。
 */
export async function authenticate(id, password) {
  try {
    const user = await staffApi.authenticate(id, password)
    return { ok: true, user }
  } catch (err) {
    // サーバーが返したエラー理由を取り出す。なければデフォルトメッセージ
    const reason = err?.response?.data?.reason || 'IDまたはパスワードが違います'
    return { ok: false, reason }
  }
}

