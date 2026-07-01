/**
 * 管理用途（admin）のハブ画面
 *
 * 「業務」用途を選んだスタッフが最初に見る画面。
 * メニュー管理・従業員管理へのナビゲーションカードを表示する。
 *
 * 役割によるアクセス制御:
 *   - 従業員管理は店長（manager）のみ表示される
 *   - 社員・アルバイトは「メニュー管理」だけが見える
 *
 * Props:
 *   user: object             - ログイン中のスタッフ情報（role を参照）
 *   onSelect: (key) => void  - 'menu' または 'staff' が渡される
 *                              AppShell の nav.push() が呼ばれて画面が切り替わる
 */
import './AdminHub.css'

export default function AdminHub({ user, onSelect }) {
  // 役職が manager の場合のみ従業員管理ボタンを表示する
  const canManageStaff = user?.role === 'manager'

  return (
    <section className="adminHubPage">
      <div>
        <h2 className="adminHubTitle">店舗管理</h2>
        <div className="adminHubSub">管理したい項目を選択してください。</div>
      </div>

      <div className="adminHubGrid">
        {/* メニュー管理: 全ロールがアクセス可能 */}
        <button className="adminHubCard" type="button" onClick={() => onSelect('menu')}>
          <div className="adminHubBig">メニュー管理</div>
          <div className="adminHubMeta">商品一覧 / 売切 / 価格 / タグ</div>
        </button>

        {/* 従業員管理: 店長のみ表示（条件付きレンダリング） */}
        {canManageStaff && (
          <button className="adminHubCard" type="button" onClick={() => onSelect('staff')}>
            <div className="adminHubBig">従業員管理</div>
            <div className="adminHubMeta">追加 / 編集 / 無効化</div>
          </button>
        )}
      </div>
    </section>
  )
}
