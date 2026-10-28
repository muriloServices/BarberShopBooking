import { useEffect, useRef, useState } from "react";
import './WelcomePage.css'
import devices from "../assets/devices.jpg";
import { WelcomePageFooter } from "../components/WelcomePageFooter";
import { WelcomePageHeader } from "../components/WelcomePageHeader";


const services = [
    {
        id: "websites",
        number: "01",
        icon: "↗",
        title: "Websites",
        subtitle: "Criamos sites à medida do teu negócio",
        summary: "Marca a tua presença online, alcança mais público e facilita o teu trabalho.",
        tags: ["Sites institucionais", "Landing pages", "Portefólios e páginas de campanha"],
        details: [
            "Desenvolvemos websites modernos, personalizados e adaptados às necessidades do teu negócio. Seja para apresentar a tua empresa, divulgar os teus serviços, vender produtos ou conquistar novos clientes, criamos um site pensado para destacar a tua marca e transmitir confiança.",
            "O nosso objetivo é transformar a tua ideia numa presença online profissional, com um design apelativo, navegação simples e adaptação a computadores, tablets e telemóveis.",
            "**Mais do que criar um site, ajudamos o teu negócio a crescer, a chegar a mais pessoas e a destacar-se da concorrência.**",
            "Tu trazes a ideia, nós tratamos de a transformar numa experiência digital à tua medida.",
        ],
        tone: "white",
    },
    {
        id: "apps",
        number: "02",
        icon: "▦",
        title: "Aplicações",
        subtitle: "Aplicações adequadas ao teu negócio",
        summary: "Experiências úteis que tornam processos mais simples para ti e para quem te escolhe.",
        tags: ["Aplicações web", "Plataformas e reservas", "Ferramentas à medida"],
        details: [
            "Desenvolvemos aplicações personalizadas para transformar as tuas ideias em soluções digitais práticas, modernas e funcionais. Desde aplicações para empresas e gestão de negócios até plataformas com funcionalidades específicas, criamos soluções adaptadas aos teus objetivos.",
            "Cada aplicação é pensada para simplificar processos, melhorar a experiência dos utilizadores e tornar tarefas do dia a dia mais rápidas e eficientes.",
            "Quer pretendas lançar um novo projeto, otimizar o funcionamento da tua empresa ou criar um serviço inovador, ajudamos-te a dar vida à tua ideia.",
            "**A tua ideia é o ponto de partida. Nós desenvolvemos a solução para a tornar realidade.**",
        ],
        tone: "beige",
    },
];

type Service = (typeof services)[number];

// Transforma o texto entre ** ** em <strong>
function renderBold(text: string) {
    return text.split("**").map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
}

export function WelcomePage() {
    const [selected, setSelected] = useState<Service | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const id = window.location.hash.replace("#", "");
        if (id) document.getElementById(id)?.scrollIntoView();
    }, []);

    function openService(service: Service) {
        setSelected(service);
        dialogRef.current?.showModal();
    }

    function closeService() {
        dialogRef.current?.close();
    }

    return (

        <main className="welcome-shell">
           <WelcomePageHeader />


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


            {/*SERVIÇOS--------------------------------------------------------------------------------------*/}
            <section id="servicos" className="services" aria-labelledby="services-title">
                <div className="services-top">
                    <span className="services-label">Serviços</span>
                </div>

                <div className="services-head">
                    <div>
                        <h2 id="services-title" className="services-title">
                            Os nossos serviços <em>digitais.</em>
                        </h2>
                    </div>
                </div>

                <div className="services-grid">
                    <article
                        className="service-card service-card-white"
                        role="button"
                        tabIndex={0}
                        onClick={() => openService(services[0])}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openService(services[0]); } }}
                    >
                        <div className="service-card-top">
                            <span className="service-card-number">01</span>
                            <span className="service-card-icon" aria-hidden="true">↗</span>
                        </div>
                        <h3>Websites</h3>
                        <p>
                            Marca a tua presença online, alcança mais público e facilita o teu trabalho.
                        </p>
                        <ul className="service-tags">
                            <li>Sites institucionais</li>
                            <li>Landing pages</li>
                            <li>Portefólios e páginas de campanha</li>
                        </ul>
                    </article>

                    <div
                        className="service-card service-card-beige"
                        role="button"
                        tabIndex={0}
                        onClick={() => openService(services[1])}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openService(services[1]); } }}
                    >
                        <div className="service-card-top">
                            <span className="service-card-number">02</span>
                            <span className="service-card-icon" aria-hidden="true">▦</span>
                        </div>
                        <h3>Aplicações</h3>
                        <p>
                            Experiências úteis que tornam processos mais simples para ti
                            e para quem te escolhe.
                        </p>
                        <ul className="service-tags">
                            <li>Aplicações web</li>
                            <li>Plataformas e reservas</li>
                            <li>Ferramentas à medida</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/*PROCESSO------------------------------------------------------------------------------------*/}

            <section id="processo" className="services process" aria-labelledby="process-title">
                <div className="services-top">
                    <span className="services-label">Processo</span>
                </div>

                <div className="services-head">
                    <div>
                        <h2 id="process-title" className="services-title">
                            Conhece mais sobre o nosso <em>processo</em>.
                        </h2>
                    </div>
                </div>

                <ol className="process-steps">
                    <li className="process-step">
                        <span className="process-step-number">01</span>
                        <h3>Conversamos</h3>
                        <p>Percebemos os teus objetivos, o teu público e o que precisa de ser transmitido.</p>
                    </li>
                    <li className="process-step">
                        <span className="process-step-number">02</span>
                        <h3>Desenhamos</h3>
                        <p>Organizamos a ideia e definimos a estrutura website antes de começar a construir.</p>
                    </li>
                    <li className="process-step">
                        <span className="process-step-number">03</span>
                        <h3>Construímos</h3>
                        <p>Damos vida ao projeto com atenção aos detalhes, à proteção e a cada ecrã.</p>
                    </li>
                    <li className="process-step">
                        <span className="process-step-number">04</span>
                        <h3>Lançamos</h3>
                        <p>Revemos o projeto em conjunto e preparamos a nova experiência para chegar ao mundo.</p>
                    </li>
                </ol>
            </section>


            <dialog
                ref={dialogRef}
                className="service-dialog"
                onClick={(e) => { if (e.target === dialogRef.current) closeService(); }}
                onClose={() => setSelected(null)}
                aria-labelledby="service-dialog-title"
            >
                {selected && (
                    <div className="service-dialog-content">
                        <button type="button" className="service-dialog-close" onClick={closeService} aria-label="Fechar">
                            ✕
                        </button>
                        <span className="service-card-number">{selected.number}</span>
                        <h3 id="service-dialog-title">{selected.title}</h3>
                        <h4 className="service-dialog-subtitle">{selected.subtitle}</h4>
                        {selected.details.map((paragraph, i) => (
                            <p key={i} className="service-dialog-paragraph">{renderBold(paragraph)}</p>
                        ))}
                        <ul className="service-tags">
                            {selected.tags.map((t) => <li key={t}>{t}</li>)}
                        </ul>
                        <a className="welcome-cta" href="tel:919260780">
                            Fala comigo <span aria-hidden="true">→</span>
                        </a>
                    </div>
                )}
            </dialog>

            <WelcomePageFooter />

        </main>
    )
}
