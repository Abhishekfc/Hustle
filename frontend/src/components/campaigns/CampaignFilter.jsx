import { FILTER_ICONS, FILTER_OPTIONS } from '../../constants/cards'

function CampaignFilter({ activeFilter, setActiveFilter }) {
  return (
    <>
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
    </>
  )
}

export default CampaignFilter
