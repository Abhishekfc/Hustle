import { useState } from 'react'
import FilterSidebar from './FilterSidebar'
import HomeContent from './HomeContent'
import Navbar from './Navbar'

function HomePage({ isDark, setIsDark, profileOpen, setProfileOpen, profileRef }) {
  const [activeFilter, setActiveFilter] = useState('All')

  return (
    <div className="home-with-sidebar">
      <Navbar
        isDark={isDark}
        setIsDark={setIsDark}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        profileRef={profileRef}
      />
      <FilterSidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      <div className="main-offset">
        <HomeContent activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      </div>
    </div>
  )
}

export default HomePage

