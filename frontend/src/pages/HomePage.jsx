import { useRef, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import CampaignFilter from '../components/campaigns/CampaignFilter'
import CampaignList from '../components/campaigns/CampaignList'

function HomePage({ isDark, setIsDark }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  return (
    <div className="home-with-sidebar">
      <Navbar
        isDark={isDark}
        setIsDark={setIsDark}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        profileRef={profileRef}
      />
      <Sidebar>
        <CampaignFilter activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      </Sidebar>
      <div className="main-offset">
        <CampaignList activeFilter={activeFilter} />
      </div>
    </div>
  )
}

export default HomePage
