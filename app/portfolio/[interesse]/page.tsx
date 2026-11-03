import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const interests = {
  "espacos-parceiros": { title: "Espaços parceiros", subtitle: "Leve a Zumba do Cris para o seu espaço." },
  patrocinio: { title: "Patrocínio", subtitle: "Conecte sua marca à Zumba do Cris." }
} as const;

export const metadata: Metadata = { title: "Proposta de parceria | Zumba do Cris", robots: { index: false, follow: false } };

export function generateStaticParams() {
  return Object.keys(interests).map((interesse) => ({ interesse }));
}

export default async function PartnershipPage({ params }: { params: Promise<{ interesse: string }> }) {
  const { interesse } = await params;
  if (!Object.hasOwn(interests, interesse)) notFound();
  const content = interests[interesse as keyof typeof interests];
  return (
    <article className="portfolio portfolio-proposal">
      <div className="portfolio-topline"><Link href="/portfolio#parcerias">← Voltar ao portfólio</Link></div>
      <section className="portfolio-section">
        <p className="portfolio-eyebrow">Zumba do Cris · Parcerias</p>
        <h1>{content.title}</h1>
        <p className="portfolio-hero-highlight">{content.subtitle}</p>
        <div className="portfolio-draft" role="note">
          <strong>Proposta em preparação</strong>
          <p>Os detalhes, valores e condições desta parceria ainda estão sendo definidos.</p>
        </div>
        <Link className="portfolio-text-link" href="/portfolio">Conheça a experiência Zumba do Cris →</Link>
      </section>
    </article>
  );
}
