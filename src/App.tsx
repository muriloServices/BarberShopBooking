import { BookingPage } from './pages/BookingPage'
import { BackOfficePage } from './pages/BackOfficePage'
import { WelcomePage } from './pages/WelcomePage'
import './App.css'

function App() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 2 && segments[1] === 'admin') {
    return <BackOfficePage businessSlug={segments[0]} />
  }
  if (segments.length === 1) {
    return <BookingPage businessSlug={segments[0]} />
  }
  return <WelcomePage />
}

export default App
