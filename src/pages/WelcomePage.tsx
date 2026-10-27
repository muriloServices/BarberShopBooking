import './WelcomePage.css'
import devices from "../assets/devices.jpg";
import logo from "../assets/SimpleBooking.png";

export function WelcomePage() {
  return (
    <main className="welcome-shell">
      <header className="welcome-header">
        <div className="header-inner">

          {/*LOGOTIPO */}
            <a className="welcome-brand" href="/" aria-label="Simple Booking home">
                <img className="welcome-brand-logo" src={logo} alt="" aria-hidden="true" />
                <span>simple booking</span>
            </a>

          {/*BUTTONS*/}
          <nav className="main-nav" aria-label="Navegação principal">
              <button type="button" className="nav-button">Serviços</button>
              <button type="button" className="nav-button">Processo</button>
              <button type="button" className="nav-button">Sobre</button>
            </nav>
          <a className="header-contact" href="tel:919260780"><span>Fala comigo</span></a>
        </div>
      </header>


        <section className="welcome-hero">
            <div className="welcome-copy">
                <p className="welcome-eyebrow"><span /> Simplifica o teu dia a dia.</p>
                <h1>
                    Gere melhor o teu tempo.<br />
                    <span>Nós tratamos disso.</span>
                </h1>
                <p className="welcome-description">
                    Começa a transformar as tuas ideias em realidade.
                </p>
                <a className="welcome-cta" href="tel:919260780">
                    Faz acontecer. Contacta-nos! <span aria-hidden="true">→</span>
                </a>
                <p className="welcome-note">
                    Uma maneira mais simples de simplificares o teu trabalho.
                </p>
            </div>



            <div className="welcome-device">
                <div className="welcome-phone">
                    <div className="welcome-phone-header">
                        <span>Simple Booking</span>
                        <span className="welcome-phone-pill" aria-hidden="true" />
                    </div>
                    <div className="welcome-phone-body">
                        <img
                            className="welcome-phone-image"
                            src={devices}
                            alt="Simple Booking em vários dispositivos"
                        />
                    </div>
                </div>
            </div>
      </section>

      <footer className="welcome-footer">
        <span>Simple Booking</span>
        <span>Great local services, easier to book.</span>
      </footer>
    </main>
  )
}
