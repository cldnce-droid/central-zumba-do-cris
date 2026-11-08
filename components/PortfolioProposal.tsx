"use client";

import { useEffect, useState } from "react";
import { Agenda, beaches, conflicts, displayDate, periods, offers, partnerFans, money, seasonDates, whatsappUrl } from "@/lib/portfolio";

export default function PortfolioProposal({ kind }: { kind: "partner" | "sponsor" }) {
  const [plan, setPlan] = useState(0);
  const [venue, setVenue] = useState("");
  const [beach, setBeach] = useState<string>(beaches[0]);
  const [period, setPeriod] = useState(0);
  

  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const partner = kind === "partner";
  const dates = seasonDates(period);
  const blocked = agenda ? conflicts(dates, period, agenda) : [];
  const offer = offers[plan];
  const schedule = periods[period].includes("manhã") ? "Manhã · horário a combinar" : "Tarde · horário a combinar";
  const message = partner ? [
    "Olá, Cris! Quero solicitar uma parceria para o GCR No Ritmo.",
    `Espaço: ${venue.trim()} · Praia: ${beach}`,
    `Período: ${periods[period]}`,
    ...dates.map(date => `${displayDate(date)} · ${schedule}`),
    "Nove aulas de 45 minutos · R$ 1.800 (R$ 200 por aula). O espaço fornece local, palco e som.",
    `Logo do espaço na frente das ventarolas. Previsão de ${partnerFans.toLocaleString("pt-BR")} unidades por espaço.`,
    "Solicitação sujeita à confirmação após pagamento e confirmação do patrocínio."
  ].join("\n") : `Olá, Cris! Quero conversar sobre o patrocínio do GCR No Ritmo.\n${offer.title} · ${money(offer.price)} pela temporada.\n${offer.benefits.map(benefit => `• ${benefit}`).join("\n")}`;

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
    if (!partner) { window.location.assign(whatsappUrl(message)); return; }
    if (!venue.trim() || loading) return;
    setLoading(true); setError("");
    try {
      const current = await checkAgenda();
      if (conflicts(dates, period, current).length) { setError("Há datas ocupadas nessa seleção. Escolha outro período para os nove encontros."); return; }
      window.location.assign(whatsappUrl(message));
    } catch (error) { setAgenda(null); setError(error instanceof Error ? error.message : "Não foi possível consultar a agenda."); }
    finally { setLoading(false); }
  }}>
    <h2>{partner ? "Escolha seu encontro semanal" : "Escolha sua participação"}</h2>
    {partner ? <>
      <p>Um dia e horário fixos para os nove encontros da temporada, de 18 de dezembro de 2026 a 14 de fevereiro de 2027.</p>
      <label>Nome do espaço<input required maxLength={120} value={venue} onChange={e => setVenue(e.target.value)} autoComplete="organization" /></label>
      <div className="proposal-fields">
        <label>Praia<select aria-label="Praia" value={beach} onChange={e => setBeach(e.target.value)}>{beaches.map(b => <option key={b}>{b}</option>)}</select></label>
        <label>Dia e período<select aria-label="Dia e período" value={period} onChange={e => { setPeriod(Number(e.target.value)); }}>{periods.map((p, i) => <option key={p} value={i} disabled={!!agenda && conflicts(seasonDates(i), i, agenda).length > 0}>{p}{agenda && conflicts(seasonDates(i), i, agenda).length > 0 ? " · indisponível" : ""}</option>)}</select></label>
      </div>
      <h3>Suas datas</h3>
      <p>Ao escolher este horário, seu espaço solicita os nove encontros listados abaixo.</p>
      <ul className="proposal-dates" aria-label="Datas solicitadas">{dates.map(date => <li key={date} className={blocked.includes(date) ? "is-busy" : ""}><time dateTime={date}>{displayDate(date)}</time><small>{schedule}</small><small>{blocked.includes(date) ? "Ocupado" : agenda ? "Sem conflito na agenda" : "A consultar"}</small></li>)}</ul>
      {blocked.length > 0 && <p role="alert" className="proposal-notice">Este período está indisponível para a temporada. Escolha outro período.</p>}
      {agenda && <small>Consulta ao Google Agenda em {new Date(agenda.checkedAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" })}. A disponibilidade será conferida novamente ao solicitar.</small>}
      {loading && <p role="status">Consultando agenda…</p>}
      {error && <p className="proposal-notice" role="alert">{error}</p>}
      <label className="proposal-check"><input type="checkbox" required />Estou ciente do valor de R$ 1.800 pelas nove datas e do compromisso de fornecer local, palco e som.</label>
      <p className="proposal-notice">Você solicita as datas. Cris confirma a agenda após o pagamento e a confirmação do patrocínio.</p>
    </> : <>
      <label>Participação<select aria-label="Participação" value={plan} onChange={e => setPlan(Number(e.target.value))}>
        {offers.map((item, index) => <option key={item.title} value={index}>{item.title} · {money(item.price)}</option>)}
      </select></label>
      <div className="proposal-total" aria-live="polite"><strong>{money(offer.price)} pela temporada</strong><ul>{offer.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul></div>
    </>}
    <details className="proposal-message"><summary>Conferir mensagem do WhatsApp</summary><pre>{message}</pre></details>
    <button className="proposal-submit" disabled={partner && (loading || blocked.length > 0)} type="submit">{partner ? "Solicitar parceria pelo WhatsApp" : "Conversar sobre patrocínio"}<span aria-hidden="true"> ↗</span></button>

  </form>;
}
