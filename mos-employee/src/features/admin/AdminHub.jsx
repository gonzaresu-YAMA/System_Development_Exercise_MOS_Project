// 業務（admin）のトップ画面
// - 店長は「メニュー管理」と「従業員管理」を両方表示
// - 社員は「メニュー管理」だけ表示

import './AdminHub.css'

export default function AdminHub({ user, onSelect }) {
  const canManageStaff = user?.role === 'manager'

  return (
    <section className="adminHubPage">
      <div>
        <h2 className="adminHubTitle">店舗管理</h2>
        <div className="adminHubSub">管理したい項目を選択してください。</div>
      </div>

      <div className="adminHubGrid">
        <button className="adminHubCard" type="button" onClick={() => onSelect('menu')}>
          <div className="adminHubBig">メニュー管理</div>
          <div className="adminHubMeta">商品一覧 / 売切 / 価格 / タグ</div>
        </button>

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
