"use client";

import { useEffect, useState } from "react";
import { Agenda, beaches, conflicts, displayDate, periods, plans, seasonDates, sponsorship, whatsappUrl } from "@/lib/portfolio";

export default function PortfolioProposal({ kind }: { kind: "partner" | "sponsor" }) {
  const [plan, setPlan] = useState(0);
  const [selection, setSelection] = useState([0, 0, 0, 0]);
  const [venue, setVenue] = useState("");
  const [beach, setBeach] = useState<string>(beaches[0].name);
  const [period, setPeriod] = useState(0);
  
  const [fan, setFan] = useState(false);
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const partner = kind === "partner";
  const dates = seasonDates(period);
  const blocked = agenda ? conflicts(dates, period, agenda) : [];
  const quote = sponsorship(plan, selection);
  const message = partner ? `Olá, Cris! Quero conversar sobre uma parceria para meu espaço.\nEspaço: ${venue.trim()}\nPraia: ${beach}\n${periods[period]} · horário exato a combinar\n9 encontros: ${dates.map(displayDate).join(", ")}\nPersonalização da ventarola: ${fan ? "quero receber um orçamento" : "não selecionada"}\nEstou ciente da participação das marcas patrocinadoras e de que o espaço deverá fornecer local, palco e som nas nove datas escolhidas.\nSolicitação sujeita à sua confirmação após pagamento e confirmação do patrocínio. Podemos confirmar disponibilidade e estrutura?` : quote.message;

  async function checkAgenda(signal?: AbortSignal) {
    const response = await fetch("/api/portfolio/agenda", { cache: "no-store", signal });
    if (!response.ok) throw new Error("Não foi possível consultar a agenda agora. Tente novamente para conferir a disponibilidade.");
    const data: Agenda = await response.json();
    setAgenda(data);
    return data;
  }
  useEffect(() => {
    if (!partner) return;
    const controller = new AbortController();
    setLoading(true);
    checkAgenda(controller.signal).catch(() => {
      if (!controller.signal.aborted) setError("Não foi possível consultar a agenda. Tente novamente antes de enviar sua solicitação.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [partner]);

  return <form className="proposal-card proposal-form" onSubmit={async event => {
    event.preventDefault();
    if (!partner) { if (quote.valid) window.location.assign(whatsappUrl(message)); return; }
    if (!venue.trim() || loading) return;
    setLoading(true); setError("");
    try {
      const current = await checkAgenda();
      if (conflicts(dates, period, current).length) { setError("Há datas ocupadas nessa seleção. Escolha outro período para os nove encontros."); return; }
      window.location.assign(whatsappUrl(message));
    } catch (error) { setAgenda(null); setError(error instanceof Error ? error.message : "Não foi possível consultar a agenda."); }
    finally { setLoading(false); }
  }}>
    <p className="portfolio-eyebrow">{partner ? "Seu espaço, nosso próximo encontro" : "Sua marca faz parte"}</p>
    <h2>{partner ? "Escolha seu encontro semanal" : "Monte sua proposta"}</h2>
    {partner ? <>
      <p>Um dia e horário fixos para os nove encontros da temporada, de 18 de dezembro de 2026 a 14 de fevereiro de 2027.</p>
      <label>Nome do espaço<input required maxLength={120} value={venue} onChange={e => setVenue(e.target.value)} autoComplete="organization" /></label>
      <div className="proposal-fields">
        <label>Praia<select aria-label="Praia" value={beach} onChange={e => setBeach(e.target.value)}>{beaches.map(b => <option key={b.name}>{b.name}</option>)}</select></label>
        <label>Dia e período<select aria-label="Dia e período" value={period} onChange={e => { setPeriod(Number(e.target.value)); }}>{periods.map((p, i) => <option key={p} value={i} disabled={!!agenda && conflicts(seasonDates(i), i, agenda).length > 0}>{p}{agenda && conflicts(seasonDates(i), i, agenda).length > 0 ? " · indisponível" : ""}</option>)}</select></label>
      </div>
      <p className="proposal-notice">A escolha vale para o período inteiro nas nove semanas. Após a confirmação, esse período fica reservado exclusivamente para seu espaço durante toda a temporada. O horário da aula de 45 minutos será combinado com Cris.</p>
      <h3>As nove datas</h3>
      <ul className="proposal-dates" aria-label="Datas solicitadas">{dates.map(date => <li key={date} className={blocked.includes(date) ? "is-busy" : ""}><time dateTime={date}>{displayDate(date)}</time><small>{blocked.includes(date) ? "Ocupado" : agenda ? "Sem conflito na agenda" : "A consultar"}</small></li>)}</ul>
      {blocked.length > 0 && <p role="alert" className="proposal-notice">Este período está indisponível para a temporada. Escolha outro período.</p>}
      {agenda && <small>Consulta ao Google Agenda em {new Date(agenda.checkedAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" })}. A disponibilidade será conferida novamente ao solicitar.</small>}
      {loading && <p role="status">Consultando agenda…</p>}
      {error && <p className="proposal-notice" role="alert">{error}</p>}
      <fieldset><legend>Personalização opcional</legend>
        <label className="proposal-check"><input type="checkbox" checked={fan} onChange={e => setFan(e.target.checked)} />Adicione a logo do seu espaço na ventarola</label>
        <p>Arte exclusiva com a logo do espaço ao lado da Zumba do Cris na frente. O verso fica reservado às marcas patrocinadoras.</p>
        <small>Custo adicional sob orçamento. A produção depende da aprovação da arte e do orçamento.</small>
      </fieldset>
      <label className="proposal-check"><input type="checkbox" required />Estou ciente da participação das marcas patrocinadoras e de que o espaço deverá fornecer local, palco e som nas nove datas escolhidas.</label>
      <p className="proposal-notice">Você solicita as datas. Cris confirma a agenda após o pagamento e a confirmação do patrocínio.</p>
    </> : <>
      <p>Indique quantos encontros interessam à sua marca em cada praia. O investimento estimado aparece conforme sua seleção. Envie a proposta pelo WhatsApp para negociar com Cris.</p>
      <label>Participação<select aria-label="Participação" value={plan} onChange={e => setPlan(Number(e.target.value))}>{plans.map((p, i) => <option key={p} value={i}>{p} · {i === 0 ? "1 a 9" : i === 1 ? "10 a 35" : "36"} encontros</option>)}</select></label>
      <div className="proposal-fields">{beaches.map((b, i) => <label key={b.name}>{b.name}<select aria-label={b.name} disabled={plan === 2} value={quote.counts[i]} onChange={e => setSelection(previous => previous.map((n, index) => index === i ? Number(e.target.value) : n))}>{Array.from({ length: 10 }, (_, n) => <option key={n} value={n}>{n ? `${n} encontro${n > 1 ? "s" : ""}` : "Não incluir"}</option>)}</select></label>)}</div>
      <small>Previsão por encontro: até 300 ventarolas em Armação e Palmas, e até 150 em Ganchos de Fora e Calheiros. Espaços e datas sujeitos a confirmação.</small>
      <div className="proposal-total" aria-live="polite"><strong>{quote.investment}</strong><span>{quote.count} encontros · até {quote.fans.toLocaleString("pt-BR")} ventarolas</span><h3>O que sua marca recebe · {plans[plan]}</h3><ul>{quote.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul>{!quote.valid && <span>Escolha de {plan === 0 ? "1 a 9" : "10 a 35"} encontros para esta participação.</span>}</div>
    </>}
    <details className="proposal-message"><summary>Conferir mensagem do WhatsApp</summary><pre>{message}</pre></details>
    <button className="proposal-submit" disabled={partner ? loading || blocked.length > 0 : !quote.valid} type="submit">{partner ? "Solicitar parceria pelo WhatsApp" : "Negociar proposta pelo WhatsApp"}<span aria-hidden="true"> ↗</span></button>
    <small>A solicitação será negociada com Cris antes da confirmação da agenda.</small>
  </form>;
}
