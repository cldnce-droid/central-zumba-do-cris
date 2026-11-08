import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PortfolioProposal from "@/components/PortfolioProposal";
import { money, offers, partnerFans } from "@/lib/portfolio";

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
      <header className="proposal-card proposal-intro"><h1>Espaço Parceiro</h1>
        <p>Durante nove semanas, convidamos moradores e turistas para dançar no seu espaço. Depois da aula, eles podem ficar para tomar uma água, pedir um drink ou conhecer o cardápio.</p>
      </header>
      <section className="proposal-card"><h2>O que você recebe</h2><ul>
        <li>Nove aulas de 45 minutos com o Cris, em português e espanhol, com inglês quando necessário.</li>
        <li>Logo do seu espaço na frente das ventarolas personalizadas, junto à identidade do circuito. A proposta prevê {partnerFans.toLocaleString("pt-BR")} unidades por espaço.</li>
        <li>Convites ao público na praia antes das aulas e participação das marcas patrocinadoras.</li>
        <li>Conteúdo das aulas publicado no Instagram em colaboração com o espaço.</li>
      </ul><div className="proposal-total"><strong>R$ 1.800 pelas nove datas</strong><span>R$ 200 por aula. O espaço fornece local, palco e som em todos os encontros.</span></div></section>
    </> : <>
      <header className="proposal-card proposal-intro"><h1>Patrocinadores</h1>
        <p>A entrega prevista para o verão é de <strong>8.000 ventarolas</strong> com as marcas patrocinadoras. O circuito prevê 36 encontros em Armação, Palmas, Calheiros e Ganchos de Fora.</p>
        <p>A participação vale pela temporada inteira, com distribuição conforme o movimento das praias.</p>
      </header>
      {offers.map((offer, index) => <section className="proposal-card" key={offer.title}><h2>{offer.title}</h2>
        <strong>{money(offer.price)} pela temporada</strong><ul>{offer.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul><FanExample premium={index === 1} />
      </section>)}
    </>}
    <PortfolioProposal kind={partner ? "partner" : "sponsor"} />
  </article>;
}
