import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'
// import PwaInstallPrompt from '../components/ui/PwaInstallPrompt'

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()

  // Full-bleed detail pages (avoid double horizontal padding + help nested grids shrink)
  const isDetailPage = /\/app\/(admin|employee)\/(projects|leads|clients|tasks|employees|contacts|companies|deals)\/[^/]+/.test(
    location.pathname
  )

  // Removed auto-close logic to keep sidebar persistent

  return (
    <div className="min-h-screen w-full bg-main-bg">

      {/* TopBar – show menu button always */}
      <TopBar
        onMenuClick={() => setSidebarOpen(true)}
        isSidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        hideMenuButton={false}
      />
      <div className="flex relative w-full">
        {/* Main navigation sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ease-smooth min-h-screen w-full relative z-10 pt-14 lg:pt-14 ${sidebarCollapsed
            ? 'ml-0 lg:ml-16'
            : 'ml-0 lg:ml-56'
            }`}
        >
          <main className={`flex-1 w-full min-w-0 max-w-full overflow-x-auto overflow-y-auto relative z-10 scrollbar-hide ${isDetailPage ? 'p-0' : 'p-3 lg:p-4'
            }`}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
