import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PortfolioProposal from "@/components/PortfolioProposal";
import { money, offers } from "@/lib/portfolio";

export const metadata: Metadata = { title: "Parcerias de verão | GCR No Ritmo", robots: { index: false, follow: false } };
export function generateStaticParams() { return [{ interesse: "espacos-parceiros" }, { interesse: "patrocinio" }]; }

function FanExample({ premium }: { premium: boolean }) {
  const position = premium ? "Bloco superior · logo ampliada" : "Bloco inferior · logo menor";
  return <figure className="gcr-example">
    <div className="gcr-fan-art">
      <Image src="/portfolio/ventarola-verso.webp" alt="Verso da ventarola, com seis logos grandes acima da linha e logos menores abaixo" width={1145} height={1374} sizes="(max-width: 480px) 85vw, 420px" />
      <span aria-hidden="true" className={premium ? "gcr-marker upper" : "gcr-marker lower"} />
    </div>
    <figcaption><strong>{position}</strong><span>A área contornada mostra onde entra sua marca.</span></figcaption>
  </figure>;
}
export default async function PartnershipPage({ params }: { params: Promise<{ interesse: string }> }) {
  const { interesse } = await params;
  if (interesse !== "espacos-parceiros" && interesse !== "patrocinio") notFound();
  const partner = interesse === "espacos-parceiros";
  return <article className="portfolio portfolio-proposal">
    <div className="portfolio-topline"><Link href="/portfolio#parcerias">← Voltar ao portfólio</Link></div>
    {partner ? <>
      <header className="proposal-card proposal-intro"><h1>Receba o GCR No Ritmo no seu espaço</h1>
        <p>Durante nove semanas, convidamos moradores e turistas para dançar no seu espaço. Depois da aula, eles podem ficar para tomar uma água, pedir um drink ou conhecer o cardápio.</p>
      </header>
      <section className="proposal-card"><h2>O que você recebe</h2><ul>
        <li>Nove aulas de 45 minutos com o Cris, em português e espanhol, com inglês quando necessário.</li>
        <li>Logo do seu espaço na frente das ventarolas personalizadas, com a praia, o dia e o horário das aulas.</li>
        <li>Distribuição das ventarolas e convites ao público na praia antes das aulas, com participação das marcas do circuito.</li>
        <li>Cartão no Guia de Verão com o nome do espaço, o horário e o botão “Como chegar”.</li>
        <li>Conteúdo das aulas publicado no Instagram em colaboração com o espaço.</li>
      </ul>
        <a href="/guia-digital.html#grade">Ver os espaços parceiros no guia →</a>
        <figure className="gcr-example"><div className="gcr-fan-art"><img src="/portfolio/ventarola-frente.webp" alt="Exemplo da frente da ventarola do circuito com a identificação do espaço parceiro" /></div><figcaption>Frente da ventarola · identificação do espaço parceiro</figcaption></figure>
        <div className="proposal-total"><strong>R$ 2.000 pelas nove datas</strong><span>O espaço fornece local, palco e som em todos os encontros.</span></div></section>
    </> : <>
      <header className="proposal-card proposal-intro"><h1>Traga sua marca para esse movimento</h1>
        <p>4 praias · 36 encontros previstos · 8.000 ventarolas previstas para o verão.</p>
        <p>A participação vale pela temporada inteira, com distribuição conforme o movimento das praias.</p>
      </header>
      {offers.map((offer, index) => <section className="proposal-card" key={offer.title}><h2>{offer.title}</h2>
        <strong>{money(offer.price)} pela temporada</strong><ul>{offer.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul><a href={index === 0 ? "/guia-digital.html#apoiadores" : "/guia-digital.html#patrocinadores"}>{index === 0 ? "Ver os apoiadores no guia" : "Ver os patrocinadores no guia"} →</a><FanExample premium={index === 1} />
      </section>)}
    </>}
    <PortfolioProposal kind={partner ? "partner" : "sponsor"} />
  </article>;
}
