import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ActionButton } from "@/components/ActionButton";
import { PinIcon, UsersIcon } from "@/components/Icons";
import { PortfolioVideo } from "@/components/PortfolioVideo";


export const metadata: Metadata = {
  title: "Parcerias e experiências | Zumba do Cris",
  description: "Conheça a Zumba do Cris, a trajetória do Cris e as possibilidades para espaços parceiros e patrocinadores."
};

function Accent() {
  return <svg className="portfolio-accent" viewBox="0 0 44 42" aria-hidden="true"><path d="M5 20C12 8 23-5 27 2S12 18 5 20Z" fill="#ffb900" /><path d="M8 26C23 17 44 13 42 22S22 28 8 26Z" fill="#ff007a" /><path d="M8 32C23 30 42 37 38 41S19 37 8 32Z" fill="#0055ef" /></svg>;
}

function Arrow() { return <span aria-hidden="true">→</span>; }

export default function PortfolioPage() {
  return (
    <article className="portfolio">
      <p className="portfolio-chapter">01 · Apresentação</p>
      <div className="portfolio-sheet portfolio-presentation">
      <section className="portfolio-hero" aria-labelledby="portfolio-title">
        <Link href="/" className="gcr-signature" aria-label="Voltar à Central Zumba do Cris">
          <span>Zumba do Cris apresenta</span>
          <Image src="/portfolio/gcr-no-ritmo.webp" alt="GCR No Ritmo" width={1717} height={909} priority />
        </Link>
        <div className="portfolio-hero-copy">
        <h1 id="portfolio-title">Leve essa energia<br />para o seu espaço.</h1>
        <p className="portfolio-hero-highlight">Conecte sua marca a essa experiência.</p>
        <p className="portfolio-intro">Um convite para espaços parceiros<br className="portfolio-wide-break" /> e patrocinadores. <Accent /></p>
        </div>
        <figure className="portfolio-hero-photo">
          <Image src="/portfolio/cris-comunidade.jpg" alt="Cris à frente de um encontro de dança, com a comunidade reunida ao fundo" width={5184} height={3456} unoptimized priority />
        </figure>
      </section>

      <section className="portfolio-section portfolio-about" aria-labelledby="cris-title">
        <h2 id="cris-title">Quem é o Cris? <Accent /></h2>
        <div>
          <p>Sou Cristiano Luziano, diretor criativo, produtor visual e criador da Zumba do Cris. Mineiro, criado em Curitiba e hoje em Governador Celso Ramos. Extrovertido, movido pela dança e pela conexão com as pessoas.</p>
        </div>
        <ul className="portfolio-facts" aria-label="Minha trajetória">
          <li><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" /><ellipse cx="16" cy="16" rx="6" ry="13" /><path d="M4 11h24M3 21h26" /></svg><span><strong>5 idiomas</strong><br />fluentes</span></li>
          <li><svg className="portfolio-plane" viewBox="0 0 32 32" aria-hidden="true"><path d="m28 3-9 9L5 8l-3 3 11 7-6 6-5-1-1 2 6 3 3 5 2-2-1-5 6-6 7 11 3-3-4-14 9-9c2-3-1-5-4-2Z" /></svg><span><strong>Experiência</strong><br />internacional</span></li>
          <li><UsersIcon /><span><strong>4 turmas</strong><br />+80 alunas</span></li>
        </ul>
      </section>
      </div>

      <p className="portfolio-chapter">02 · Experiência</p>
      <div className="portfolio-sheet portfolio-experience">
      <section className="portfolio-section" aria-labelledby="cruzeiro-title">
        <h2 id="cruzeiro-title">Do mundo para <span className="portfolio-brush portfolio-blue">cada encontro.<Accent /></span></h2>
        <p>Animação em cruzeiros, jogos, festas e apresentações em cinco idiomas.</p>
        <PortfolioVideo title="Minha experiência a bordo" src="/portfolio/cruzeiro.mp4" poster="/portfolio/cruzeiro-capa.webp" duration="0:42" />
      </section>

      <section className="portfolio-section portfolio-zumba" aria-labelledby="zumba-title">
        <h2 id="zumba-title">O que é a Zumba do Cris? <Accent /></h2>
        <p>Dança, energia e conexão. Passos fáceis, diversos ritmos e uma comunidade que dá vontade de fazer parte.</p>
        <PortfolioVideo title="Sinta essa energia" src="/portfolio/zumba.mp4" poster="/portfolio/zumba-capa.webp" duration="1:08" />
        <p className="portfolio-locations"><PinIcon /> <span>Armação · Palmas · Calheiros · Ganchos de Fora</span></p>
      </section>
      </div>

      <p className="portfolio-chapter">03 · Parceria</p>
      <div className="portfolio-sheet portfolio-partnership">
      <section className="portfolio-section portfolio-creative" aria-labelledby="creative-title">
        <h2 id="creative-title">Criatividade que <span className="portfolio-brush">faz parte.<Accent /></span></h2>
        <p>Direção criativa e produção visual: um olhar que transforma temas, apresentações e cada detalhe da experiência.</p>
        <Image className="portfolio-creative-cover" src="/portfolio/capa.jpeg" alt="CL Production e três fotografias do universo visual de Limbo" width={1240} height={240} unoptimized />
        <a className="portfolio-text-link" href="https://www.instagram.com/clproduction333/" target="_blank" rel="noreferrer">Mais da CL Production · @clproduction333 ↗</a>
      </section>

      <section className="portfolio-section portfolio-invite" id="parcerias" aria-labelledby="invite-title">
        <h2 id="invite-title">Vamos criar o<span className="portfolio-brush">próximo encontro?<Accent /></span></h2>
        <p>Seu espaço recebe. Sua marca participa. A experiência conecta.</p>
        <div className="portfolio-actions">
          <ActionButton href="/portfolio/espacos-parceiros" variant="blue" icon={<Arrow />}>Quero ser um espaço parceiro</ActionButton>
          <ActionButton href="/portfolio/patrocinio" variant="pink" icon={<Arrow />}>Quero ser patrocinador</ActionButton>
        </div>
        <a className="portfolio-text-link" href="https://www.instagram.com/crisluziano/" target="_blank" rel="noreferrer">Mais do meu trabalho no Instagram ↗</a>
      </section>
      </div>
      <footer className="portfolio-footer"><strong>Errou... continua!</strong><span>Zumba do Cris · Governador Celso Ramos</span><Link href="/">Voltar para a Central</Link></footer>
    </article>
  );
}
