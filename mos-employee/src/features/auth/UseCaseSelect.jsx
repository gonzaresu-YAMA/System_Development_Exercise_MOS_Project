import { USECASE_LABEL } from '../../domain/staff/staffMapper'
import './usecase.css'

export default function UseCaseSelect({ allowed, onSelect }) {
  return (
    <section className="usecasePage">
      <h2 className="usecaseTitle">用途を選択</h2>

      <div className="usecaseGrid">
        {allowed.map((k) => (
          <button
            key={k}
            className="usecaseCard"
            onClick={() => onSelect(k)}
            type="button"
          >
            <div className="usecaseBig">{USECASE_LABEL[k]}</div>
            <div className="usecaseSub">
              {k === 'hall' && '座席管理'}
              {k === 'kitchen' && '注文管理'}
              {k === 'admin' && '店舗管理'}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
