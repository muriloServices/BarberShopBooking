import { BookingPage } from './pages/BookingPage'
import { BackOfficePage } from './pages/BackOfficePage'
import './App.css'

function App() {
  if (window.location.pathname === '/backoffice') {
    return <BackOfficePage />
  }
  return <BookingPage />
}

export default App
