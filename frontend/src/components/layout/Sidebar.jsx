function Sidebar({ children }) {
  return (
    <aside className="filter-sidebar" aria-label="Sidebar">
      <div className="filter-sidebar-inner">
        {children}
      </div>
    </aside>
  )
}

export default Sidebar
