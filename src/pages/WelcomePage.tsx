import './WelcomePage.css'

export function WelcomePage() {
  return (
    <main className="welcome-shell">
      <header className="welcome-header">
        <a className="welcome-brand" href="/" aria-label="Simple Booking home">
          <span className="welcome-brand-mark" aria-hidden="true">S</span>
          <span>simple booking</span>
        </a>
      </header>

      <section className="welcome-hero">
        <div className="welcome-copy">
          <p className="welcome-eyebrow"><span /> A SIMPLER WAY TO BOOK</p>
          <h1>Find your place.<br />Pick your time.<br /><span>We’ll handle it.</span></h1>
          <p className="welcome-description">
            Discover local businesses and book the services you love, all in one simple place.
          </p>
          <a className="welcome-cta" href="tel:919260780">
            Contact us to host your business <span aria-hidden="true">→</span>
          </a>
          <a className="welcome-contact-number" href="tel:919260780">919 260 780</a>
          <p className="welcome-note">A simpler way to find and book local services.</p>
        </div>

        <div className="welcome-art" aria-hidden="true">
          <div className="welcome-art-ring welcome-art-ring-outer" />
          <div className="welcome-art-ring welcome-art-ring-inner" />
          <div className="welcome-art-label">GOOD DAYS<br />START HERE</div>
          <span className="welcome-art-star">✳</span>
          <span className="welcome-art-number">01</span>
        </div>
      </section>

      <footer className="welcome-footer">
        <span>Simple Booking</span>
        <span>Great local services, easier to book.</span>
      </footer>
    </main>
  )
}
