/**
 * 用途選択画面
 *
 * ログイン後に最初に表示される画面（用途が1つしかない場合はスキップされる）。
 * スタッフの役職によって表示できる用途が絞られている（allowed で受け取る）。
 *
 * 用途の種類:
 *   hall    → ホール（座席管理）
 *   kitchen → 厨房（注文管理）
 *   admin   → 業務（メニュー管理・従業員管理） ※ アルバイトは選択不可
 *
 * Props:
 *   allowed: string[]            - このスタッフが選択できる用途キーの配列
 *   onSelect: (key: string) => void - 用途が選ばれたときのコールバック
 *                                    AppShell で useCaseState が更新される
 */
import { USECASE_LABEL } from '../../domain/staff/staffMapper'
import './usecase.css'

export default function UseCaseSelect({ allowed, onSelect }) {
  return (
    <section className="usecasePage">
      <h2 className="usecaseTitle">用途を選択</h2>

      <div className="usecaseGrid">
        {/* allowed 配列の各キーをカードボタンとして並べる */}
        {allowed.map((k) => (
          <button
            key={k}
            className="usecaseCard"
            onClick={() => onSelect(k)}
            type="button"
          >
            {/* USECASE_LABEL: staffMapper から取得した日本語ラベル（例: 'hall' → 'ホール'） */}
            <div className="usecaseBig">{USECASE_LABEL[k]}</div>
            {/* 各用途のサブテキスト（何を管理するかの説明） */}
            <div className="usecaseSub">
              {k === 'hall'    && '座席管理'}
              {k === 'kitchen' && '注文管理'}
              {k === 'admin'   && '店舗管理'}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
