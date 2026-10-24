import siteImage from '../assets/devices.jpg';

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a className={`brand${footer ? " brand--footer" : ""}`} href="#inicio" aria-label="Simple Booking — início">
      <span className="brand-mark" aria-hidden="true"><span>s</span><i>✳</i></span>
      <span className="brand-name">simple <b>booking</b></span>
    </a>
  );
}

export function WelcomePage() {
  return (
    <main className="welcome-shell">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
            <nav className="main-nav" aria-label="Navegação principal">
              <button type="button" className="nav-button">Serviços</button>
              <button type="button" className="nav-button">Processo</button>
              <button type="button" className="nav-button">Sobre</button>
            </nav>
          <a className="header-contact" href="tel:919260780"><span>Fala comigo</span></a>

        </div>
      </header>

      <section className="brand-showcase" aria-label="Apresentação da marca">
        <div className="welcome-copy">
          <p className="welcome-eyebrow"><span /> Simplifica o teu dia a dia. </p>
          <h1>Gere melhor o teu tempo.<br /><span>Nós tratamos disso.</span></h1>
          <p className="welcome-description">
            Começa a transformar as tuas ideias em realidade.
          </p>
          <a className="welcome-cta" href="tel:919260780">
            Faz acontecer. Contacta-nos! <span aria-hidden="true">→</span>
          </a>
          <p className="welcome-note">Uma maneira mais simples de simplificares o teu trabalho.</p>
        </div>

        <div className="brand-showcase__device" aria-hidden="true">
          <div className="brand-showcase__phone">
            <div className="brand-showcase__phone-header">
              <span>Simple Booking</span>
              <span className="menu-icon">≡</span>
            </div>
            <div className="brand-showcase__phone-body">
              <img
                src={siteImage}
                alt="Imagem do site"
                className="brand-showcase__phone-image"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
