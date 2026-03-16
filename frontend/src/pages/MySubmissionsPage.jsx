import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import SubmissionEarningsRow from '../components/submissions/SubmissionEarningsRow'
import { getMySubmissions } from '../api/submissionApi'
import './DashboardPage.css'

function MySubmissionsPage({ isDark, setIsDark }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    getMySubmissions()
      .then(res => res.json())
      .then(data => setSubmissions(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="dash-layout-nosidebar">
      <Navbar isDark={isDark} setIsDark={setIsDark} profileOpen={profileOpen} setProfileOpen={setProfileOpen} profileRef={profileRef} />
      <div className="dash-main">
        <div className="dash-page">
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">My Submissions</h1>
              <p className="dash-page-subtitle">All videos you've submitted to campaigns</p>
            </div>
            <Link to="/" className="btn-primary-action">Browse Campaigns</Link>
          </div>
          {loading ? (
            <div className="loading">Loading submissions…</div>
          ) : submissions.length === 0 ? (
            <div className="empty-state">
              <p>No submissions yet. Browse campaigns and submit your first video to start earning!</p>
            </div>
          ) : (
            <div className="dash-table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Video URL</th>
                    <th>Status</th>
                    <th>Views</th>
                    <th>Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(s => <SubmissionEarningsRow key={s.id} submission={s} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MySubmissionsPage
