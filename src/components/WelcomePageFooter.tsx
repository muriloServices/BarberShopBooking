import { useRef } from "react";
import "../pages/WelcomePage.css";

const privacySections = [
    {
        heading: "Quem somos",
        paragraphs: [
            "A Simple Booking é responsável pelo tratamento dos dados pessoais recolhidos neste website. Podes contactar-nos pelo telefone 919 260 780 ou pelo email murilo@gmail.com.",
        ],
    },
    {
        heading: "Que dados recolhemos",
        paragraphs: [
            "Recolhemos apenas os dados que nos forneces diretamente quando nos contactas, como o nome, o número de telefone, o email e a informação que decidires partilhar sobre o teu projeto.",
            "Quando utilizas funcionalidades de reserva, podemos também recolher os dados necessários para criar, consultar, alterar ou cancelar uma reserva.",
        ],
    },
    {
        heading: "Para que os usamos",
        paragraphs: [
            "Usamos os teus dados para responder aos teus contactos, preparar propostas e prestar os serviços que nos pedires.",
            "Quando aplicável, utilizamos os dados para gerir reservas, prestar apoio aos utilizadores, manter a segurança do website e cumprir obrigações legais.",
            "Não vendemos os teus dados pessoais nem os cedemos a terceiros para fins de marketing.",
        ],
    },
    {
        heading: "Base legal para o tratamento",
        paragraphs: [
            "O tratamento dos teus dados pode ser necessário para responder aos teus pedidos, preparar ou executar um contrato, prestar os serviços solicitados ou cumprir obrigações legais.",
            "Em determinadas situações, o tratamento poderá basear-se no nosso interesse legítimo ou no teu consentimento, quando este seja legalmente exigido.",
            "Quando o tratamento se basear no consentimento, podes retirá-lo a qualquer momento.",
        ],
    },
    {
        heading: "Com quem partilhamos os dados",
        paragraphs: [
            "Não vendemos os teus dados pessoais.",
            "Quando necessário para o funcionamento do website e para a prestação dos serviços, os dados poderão ser tratados por fornecedores de serviços tecnológicos, alojamento, armazenamento, comunicações, manutenção ou outros serviços necessários ao funcionamento da Simple Booking.",
            "Os dados poderão também ser comunicados às autoridades competentes quando exista uma obrigação legal para o fazer.",
        ],
    },
    {
        heading: "Transferências internacionais",
        paragraphs: [
            "Alguns dos serviços tecnológicos utilizados pela Simple Booking poderão tratar ou armazenar dados fora do Espaço Económico Europeu.",
            "Quando tal aconteça, serão aplicadas as garantias previstas na legislação de proteção de dados.",
        ],
    },
    {
        heading: "Durante quanto tempo guardamos",
        paragraphs: [
            "Guardamos os dados apenas pelo tempo necessário para cumprir a finalidade para a qual foram recolhidos ou enquanto existir uma obrigação legal que o exija.",
            "Quando os dados deixarem de ser necessários, serão apagados ou anonimizados, salvo quando a sua conservação seja legalmente exigida.",
        ],
    },
    {
        heading: "Como protegemos os teus dados",
        paragraphs: [
            "Adotamos medidas técnicas e organizativas adequadas para proteger os dados pessoais contra acessos não autorizados, perda, alteração, divulgação ou destruição.",
            "Apesar das medidas de segurança adotadas, nenhum sistema informático pode garantir segurança absoluta.",
        ],
    },
    {
        heading: "Cookies",
        paragraphs: [
            "O website pode utilizar cookies e tecnologias semelhantes para assegurar o seu funcionamento e, quando aplicável, analisar a utilização do website ou disponibilizar determinadas funcionalidades.",
            "Os cookies não essenciais que necessitem de consentimento só serão utilizados depois de obtido o consentimento necessário.",
        ],
    },
    {
        heading: "Os teus direitos",
        paragraphs: [
            "Tens o direito de aceder aos teus dados pessoais, corrigi-los, apagá-los, limitar ou opor-te ao seu tratamento e, nos casos previstos na lei, pedir a sua portabilidade.",
            "Quando o tratamento se basear no consentimento, podes retirar esse consentimento a qualquer momento.",
            "Para exercer qualquer um destes direitos, basta contactar-nos através do email murilo@gmail.com.",
            "Se considerares que os teus dados não estão a ser tratados corretamente, podes apresentar uma reclamação à Comissão Nacional de Proteção de Dados (CNPD), em www.cnpd.pt.",
        ],
    },
    {
        heading: "Alterações a esta política",
        paragraphs: [
            "Esta Política de Privacidade poderá ser atualizada sempre que necessário para refletir alterações no website, nos serviços prestados ou nas obrigações legais aplicáveis.",
            "A versão mais recente estará sempre disponível nesta página.",
        ],
    },
];

export function WelcomePageFooter() {
    const dialogRef = useRef<HTMLDialogElement>(null);

    return (
        <>
            <footer className="welcome-footer">
                <span>Simple Booking</span>
                <span>Facilita o teu trabalho.</span>
                <a
                    className="footer-link"
                    href="#privacidade"
                    onClick={(e) => {
                        e.preventDefault();
                        dialogRef.current?.showModal();
                    }}
                >
                    Política de Privacidade
                </a>
            </footer>

            {/* Fora do footer, para não herdar o texto pequeno e cinzento dele */}
            <dialog
                ref={dialogRef}
                className="service-dialog"
                onClick={(e) => { if (e.target === dialogRef.current) dialogRef.current?.close(); }}
                aria-labelledby="privacy-dialog-title"
            >
                <div className="service-dialog-content">
                    <button
                        type="button"
                        className="service-dialog-close"
                        onClick={() => dialogRef.current?.close()}
                        aria-label="Fechar"
                    >
                        ✕
                    </button>

                    <h3 id="privacy-dialog-title">Política de Privacidade</h3>

                    {privacySections.map((section) =>
                        section.paragraphs.map((text, i) => (
                            <p key={`${section.heading}-${i}`} className="service-dialog-paragraph">
                                {i === 0 && (
                                    <>
                                        <strong>{section.heading}</strong>
                                        <br />
                                    </>
                                )}
                                {text}
                            </p>
                        ))
                    )}
                </div>
            </dialog>
        </>
    );
}
