import { BookingPage } from './pages/BookingPage'
import { BackOfficePage } from './pages/BackOfficePage'
import { WelcomePage } from './pages/WelcomePage'
import './App.css'

function App() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'

  if (pathname === '/ringbarbershop/admin') {
    return <BackOfficePage />
  }
  if (pathname === '/ringbarbershop') {
    return <BookingPage />
  }
  return <WelcomePage />
}

export default App
