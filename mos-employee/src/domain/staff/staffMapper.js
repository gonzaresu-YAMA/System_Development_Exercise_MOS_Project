/**
 * スタッフ関連の定数・マッピング定義
 *
 * DB/API に保存される英字キー（manager, employee, partTime, hall, kitchen, admin）と
 * 画面表示用の日本語ラベルを対応付ける。
 *
 * なぜコンポーネントではなくここに定義するか:
 *   StaffManagement, AppShell, LoginPage など複数箇所で同じラベルを使うため、
 *   一か所にまとめて重複を避けている（Single Source of Truth）。
 */

// 役職キー → 日本語ラベル
export const ROLE_LABEL = {
  manager:  '店長',
  employee: '社員',
  partTime: 'アルバイト',
}

// セレクトボックス用オプション配列（{ value, label } の形式）
export const ROLE_OPTIONS = [
  { value: 'manager',  label: '店長' },
  { value: 'employee', label: '社員' },
  { value: 'partTime', label: 'アルバイト' },
]

// ユースケースキー → 日本語ラベル
export const USECASE_LABEL = {
  hall:    'ホール',
  kitchen: '厨房',
  admin:   '業務',
}

/** 役職キーから日本語ラベルを取得（存在しないキーはそのまま返す） */
export function getRoleLabel(role) {
  return ROLE_LABEL[role] || role
}

/** ユースケースキーから日本語ラベルを取得 */
export function getUseCaseLabel(useCase) {
  return USECASE_LABEL[useCase] || useCase
}
