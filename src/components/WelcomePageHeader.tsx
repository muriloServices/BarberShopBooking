import "../pages/WelcomePage.css";
import "../styles/shared.css";
import logo from "../assets/SimpleBooking.png";

function goToSection(id: string) {
    const section = document.getElementById(id);
    if (section) {
        section.scrollIntoView();
    } else {
        window.location.href = `/#${id}`;
    }
}

export function WelcomePageHeader() {
    return (
        <header className="site-header">
            <div className="header-inner">

                <a className="brand" href="/" aria-label="Simple Booking home">
                    <img className="brand-mark" src={logo} alt="" aria-hidden="true" />
                    <span>simple booking</span>
                </a>

                <nav className="main-nav" aria-label="Navegação principal">
                    <button type="button" className="nav-button" onClick={() => goToSection("servicos")}>
                        Serviços
                    </button>
                    <button type="button" className="nav-button" onClick={() => goToSection("processo")}>
                        Processo
                    </button>
                    <a className="nav-button" href="/about">
                        Sobre
                    </a>
                </nav>

                <a className="header-contact" href="tel:919260780"><span>Fala comigo</span></a>
            </div>
        </header>
    );
}