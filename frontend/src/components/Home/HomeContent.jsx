import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../../constants/api'
import { MOCK_CARDS } from '../../constants/cards'

function HomeContent({ activeFilter, setActiveFilter }) {
  const [cards, setCards] = useState([])
  const [sortBy] = useState('default')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (activeFilter !== 'All') params.append('category', activeFilter)
        if (sortBy !== 'default') params.append('sort', sortBy)
        const url = `${API_BASE}/cards${params.toString() ? '?' + params : ''}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('API not available')
        const data = await res.json()
        if (!cancelled) setCards(data)
      } catch (_) {
        let filtered = MOCK_CARDS
        if (activeFilter !== 'All') filtered = MOCK_CARDS.filter((c) => c.category === activeFilter)
        if (sortBy === 'az') filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title))
        else if (sortBy === 'za') filtered = [...filtered].sort((a, b) => b.title.localeCompare(a.title))
        if (!cancelled) setCards(filtered)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [activeFilter, sortBy])

  return (
    <main className="cards-section">
      {loading ? (
        <div className="loading">Loading cards...</div>
      ) : (
        <div className="card-grid">
          {cards.map((card) => (
            <Link key={card._id} to={`/campaign/${card._id}`} className="card card-clickable">
              <div className="card-image">
                <span className="card-letter">{card.letter}</span>
              </div>
              <div className="card-content">
                <h3 className="card-title">{card.title}</h3>
                <span className="card-category">{card.category}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {!loading && cards.length === 0 && (
        <div className="empty-state">
          <p>No campaigns found. Start the backend and seed the database.</p>
        </div>
      )}
    </main>
  )
}

export default HomeContent

