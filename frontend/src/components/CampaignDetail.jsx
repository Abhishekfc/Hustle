import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { API_BASE } from '../constants/api'
import { MOCK_CARDS } from '../constants/cards'

function CampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(undefined)
  const swipeStartRef = useRef({ x: 0, y: 0 })
  const isMouseDownRef = useRef(false)
  const SWIPE_THRESHOLD = 80
  const SWIPE_MAX_VERTICAL = 120

  useEffect(() => {
    let cancelled = false
    setCampaign(undefined)
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/cards/${id}`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setCampaign(data)
          return
        }
      } catch (_) {}
      const found = MOCK_CARDS.find((c) => c._id === id)
      if (!cancelled) setCampaign(found !== undefined ? found : null)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const goBack = () => navigate('/')

  const handleSwipeStart = (e) => {
    const t = e.touches?.[0] || e
    swipeStartRef.current = { x: t.clientX, y: t.clientY }
    isMouseDownRef.current = true
  }

  const handleSwipeEnd = (e) => {
    const t = e.changedTouches?.[0] || e
    const dx = t.clientX - swipeStartRef.current.x
    const dy = t.clientY - swipeStartRef.current.y
    if (dx > SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_MAX_VERTICAL) goBack()
    isMouseDownRef.current = false
  }

  const handleMouseDown = (e) => {
    swipeStartRef.current = { x: e.clientX, y: e.clientY }
    isMouseDownRef.current = true
  }

  const handleMouseUp = (e) => {
    if (!isMouseDownRef.current) return
    const dx = e.clientX - swipeStartRef.current.x
    const dy = e.clientY - swipeStartRef.current.y
    if (dx > SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_MAX_VERTICAL) goBack()
    isMouseDownRef.current = false
  }

  if (campaign === undefined) {
    return (
      <div className="campaign-detail-page">
        <div className="loading">Loading campaign...</div>
      </div>
    )
  }

  if (campaign === null) {
    return (
      <div className="campaign-detail-page">
        <Link to="/" className="card-detail-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to campaigns
        </Link>
        <div className="empty-state">
          <p>Campaign not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="card-detail-page card-detail-swipeable campaign-detail-page"
      onTouchStart={handleSwipeStart}
      onTouchEnd={handleSwipeEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        isMouseDownRef.current = false
      }}
    >
      <Link to="/" className="card-detail-back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to campaigns
      </Link>
      <div className="card-detail-hero">
        <div className="card-detail-image">
          <span className="card-letter">{campaign.letter}</span>
        </div>
        <div className="card-detail-heading">
          <span className="card-detail-category">{campaign.category}</span>
          <h1 className="card-detail-title">{campaign.title}</h1>
        </div>
      </div>
      <section className="card-detail-content">
        <h2 className="card-detail-section-title">Campaign details</h2>
        <p className="card-detail-description">
          Add description, notes, and more details for this campaign here.
        </p>
        <div className="card-detail-meta">
          <span>ID: {campaign._id}</span>
          <span>Category: {campaign.category}</span>
        </div>
      </section>
    </div>
  )
}

export default CampaignDetail

