import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PortfolioProposal from "@/components/PortfolioProposal";

export const metadata: Metadata = { title: "Parcerias de verão | Zumba do Cris", robots: { index: false, follow: false } };
export function generateStaticParams() { return [{ interesse: "espacos-parceiros" }, { interesse: "patrocinio" }]; }
export default async function PartnershipPage({ params }: { params: Promise<{ interesse: string }> }) {
 const { interesse } = await params;
 if (interesse !== "espacos-parceiros" && interesse !== "patrocinio") notFound();
 const partner = interesse === "espacos-parceiros";
 return <article className="portfolio portfolio-proposal">
 <div className="portfolio-topline"><Link href="/portfolio#parcerias">← Voltar ao portfólio</Link></div>
 {partner ? <><header className="proposal-card proposal-intro"><small>ESPAÇO PARCEIRO · VERÃO 2026/27</small><h1>Neste verão, seu espaço é o ponto de encontro da Zumba do Cris.</h1><p>Uma vez por semana, quem mora aqui e quem veio curtir a praia tem um encontro marcado no seu espaço. O Cris dá o primeiro passo e, já na primeira música, todo mundo pode entrar na dança.</p></header>
<section className="proposal-card"><h2>Como funciona a parceria</h2><h3>Seu espaço oferece</h3><ul><li>Local para receber o público.</li><li>Palco e som funcionando nas datas combinadas.</li></ul><p>Nesse formato de parceria, não há cobrança de cachê pela aula.</p><h3>A Zumba do Cris entrega</h3><ul><li>Aula de 45 minutos, conduzida pelo Cris.</li><li>Apresentação em português e espanhol, com inglês quando necessário.</li><li>Reggaeton, bachata, cúmbia, axé, funk e sertanejo, com passos fáceis.</li><li>Conteúdo das aulas publicado no Instagram em colaboração com o espaço.</li></ul></section>
<section className="proposal-card"><h2>Marcas patrocinadoras</h2><p>A parceria inclui a participação de marcas patrocinadoras. Duas horas antes de cada aula, a equipe distribui ventarolas na praia e convida moradores e turistas para o encontro no seu espaço.</p></section>
</> : <><header className="proposal-card proposal-intro"><small>ZUMBA DO CRIS · VERÃO 2026/27</small><h1>Traga sua marca para esse movimento</h1><p>Neste verão, a Zumba do Cris convida o turista a fazer parte de um movimento de bem-estar, dança e diversão. Queremos conquistar quem vem de fora para que sinta vontade de voltar. Dos 14 aos 70 anos, esse movimento acolhe públicos de diferentes idades e ritmos para todos os gostos.</p><p>Sua marca pode fazer parte disso e ajudar a levar mais dança, diversão e bem-estar às praias de Governador Celso Ramos. Vem fazer parte desse movimento!</p></header>
<section className="proposal-card"><h2>Três formas de participar</h2>
<h3>Marca Parceira · 1 a 9 encontros</h3>
<ul><li>Logo nas ventarolas dos encontros contratados.</li><li>Menções e ativação da marca em todos os encontros contratados e nos posts relacionados.</li></ul>
<h3>Marca em Destaque · 10 a 35 encontros</h3>
<ul><li>Logo nas ventarolas dos encontros contratados.</li><li>Menções e ativação da marca em todos os encontros contratados e nos posts relacionados.</li><li>Beach flag nos encontros contratados.</li><li>Espaço para sorteio de brindes ou outro tipo de ativação, conforme a necessidade da marca e mediante alinhamento.</li></ul>
<h3>Patrocínio Exclusivo do Circuito · 36 encontros</h3>
<ul><li>Exclusividade de patrocínio em todo o circuito.</li><li>Logo no verso de até 8.100 ventarolas.</li><li>Beach flags nos 36 encontros.</li><li>Menções e ativação da marca em todos os encontros contratados e nos posts relacionados.</li><li>Espaço para sorteio de brindes ou outro tipo de ativação, conforme a necessidade da marca e mediante alinhamento.</li><li>Relatórios semanais sobre público, publicações e outras ações realizadas no circuito.</li></ul>
</section><section className="proposal-card"><h2>Distribuição prevista por encontro</h2><p>A proposta considera o fluxo de pessoas e a equipe necessária para a divulgação em cada praia.</p><ul><li>Armação e Palmas — maior movimentação de turistas, com duas pessoas na distribuição de até 300 ventarolas por encontro em cada praia.</li><li>Calheiros e Ganchos de Fora — público predominantemente local e menor movimentação, com uma pessoa na distribuição de até 150 ventarolas por encontro em cada praia.</li></ul><p>Essas diferenças na quantidade de material e no tamanho da equipe são consideradas no cálculo do investimento para os encontros escolhidos.</p><small>Praias, espaços e datas sujeitos a confirmação.</small></section></>}
 <PortfolioProposal kind={partner ? "partner" : "sponsor"} />
 </article>;
}
