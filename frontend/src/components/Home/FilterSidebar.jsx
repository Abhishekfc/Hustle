import { FILTER_ICONS, FILTER_OPTIONS } from '../../constants/cards'

function FilterSidebar({ activeFilter, setActiveFilter }) {
  return (
    <aside className="filter-sidebar" aria-label="Filters">
      <div className="filter-sidebar-inner">
        {FILTER_OPTIONS.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`filter-sidebar-btn ${activeFilter === cat ? 'active' : ''}`}
            onClick={() => setActiveFilter(cat)}
            title={cat}
            aria-label={cat}
            aria-pressed={activeFilter === cat}
          >
            <span className="filter-sidebar-icon">{FILTER_ICONS[cat]}</span>
            <span className="filter-sidebar-label">{cat}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

export default FilterSidebar

