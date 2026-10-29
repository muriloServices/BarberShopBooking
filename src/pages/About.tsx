import "./WelcomePage.css";
import "./About.css";
import "../styles/shared.css";

import tec from "../assets/tec.jpg";
import { WelcomePageHeader } from "../components/WelcomePageHeader";
import { WelcomePageFooter } from "../components/WelcomePageFooter";

const principles = [
    {
        title: "Simplicidade",
        text: "Soluções fáceis de usar, para ti e para quem te escolhe. Se ainda parece complicado, não está pronto.",
    },
    {
        title: "Proximidade",
        text: "Falamos contigo do início ao fim, sem intermediários e sem linguagem técnica.",
    },
    {
        title: "Clareza",
        text: "Sabes sempre o que estamos a fazer, porquê e quando fica pronto.",
    },
];

export function AboutPage() {
    return (
        <main className="welcome-shell">
            <WelcomePageHeader />

            <section className="about-hero">
                <div className="about-hero-media">
                    <img src={tec} alt="Simple Booking em vários dispositivos" />
                </div>

                <div className="about-hero-copy">
                    <h1>
                        A tecnologia deve tornar as coisas <span>mais simples.</span>
                    </h1>
                    <p className="about-text">
                        A Simple Booking transforma ideias e necessidades de negócio em experiências
                        digitais claras e fáceis de usar. Cada projeto começa por ouvir, continua com
                        intenção e ganha forma à medida do que precisas.
                    </p>
                    <p className="about-quote">
                        Menos complicação.
                        <span>Mais possibilidade.</span>
                    </p>
                </div>
            </section>

            <section className="services" aria-labelledby="about-story-title">
                <div className="services-top">
                    <span className="services-label">Como trabalhamos</span>
                </div>

                <ul className="about-principles">
                    {principles.map((p) => (
                        <li key={p.title} className="about-principle">
                            <h3>{p.title}</h3>
                            <p>{p.text}</p>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="services">
                <div className="services-top">
                    <span className="services-label">O teu negócio merece estar online</span>
                </div>


                <p className="about-text">
                    Criamos websites modernos, profissionais e adaptados à tua marca, pensados
                    para dar mais visibilidade ao teu negócio e transformar visitantes em
                    clientes.
                </p>
                <p className="about-text">
                    Desde páginas de apresentação a websites completos para empresas, tratamos
                    de tudo para que tenhas uma presença digital que transmita confiança,
                    destaque os teus serviços e te ajude a crescer.
                </p>

                <ul className="about-text">
                    <li >
                        Websites à medida — Design personalizado e adaptado às necessidades do teu negócio.
                    </li>
                    <li>
                        Design moderno e responsivo — Uma experiência simples e elegante em computador, tablet ou telemóvel.
                    </li>
                    <li>
                        Foco nos resultados — Páginas pensadas para apresentar os teus serviços, conquistar confiança e gerar contactos.
                    </li>
                    <li>
                        Simplicidade do início ao fim — Acompanhamos o processo desde a primeira ideia até ao lançamento do teu website.
                    </li>
                </ul>
                <p className="about-quote">
                    <span>Vamos dar vida à tua presença online?</span>
                </p>

            </section>

            <WelcomePageFooter />
        </main>
    );
}