import { BookingPage } from './pages/BookingPage'
import { BackOfficePage } from './pages/BackOfficePage'
import { WelcomePage } from './pages/WelcomePage'
import { AboutPage } from './pages/About'

function App() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 2 && segments[1] === 'admin') {
    return <BackOfficePage businessSlug={segments[0]} />
  }
  if (pathname === '/about') {
    return <AboutPage />
  }
  if (segments.length === 1) {
    return <BookingPage businessSlug={segments[0]} />
  }
  return <WelcomePage />
}

export default App
