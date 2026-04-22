import { Outlet } from 'react-router-dom'
import WebsiteHeader from '../website/components/WebsiteHeader'
import WebsiteFooter from '../website/components/WebsiteFooter'

const WebsiteLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <WebsiteHeader />
      <main className="flex-grow">
        <Outlet />
      </main>
      <WebsiteFooter />
    </div>
  )
}

export default WebsiteLayout

