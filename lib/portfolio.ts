export const beaches = [
  { name: "Armação", fans: 300, price: 800 },
  { name: "Palmas", fans: 300, price: 800 },
  { name: "Ganchos de Fora", fans: 150, price: 600 },
  { name: "Calheiros", fans: 150, price: 600 }
] as const;
export const periods = ["Sexta à tarde", "Sábado de manhã", "Sábado à tarde", "Domingo de manhã"];
export const plans = ["Marca Parceira", "Marca em Destaque", "Patrocínio Exclusivo do Circuito"];
export const whatsappUrl = (text: string) => `https://wa.me/5541984774688?text=${encodeURIComponent(text)}`;
export const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export function seasonDates(period: number) {
  return Array.from({ length: 9 }, (_, i) => new Date(Date.UTC(2026, 11, [18, 19, 19, 20][period] + i * 7)).toISOString().slice(0, 10));
}
export const displayDate = (date: string) => date.split("-").reverse().join("/");
export type Agenda = { busy: { start: string; end: string }[]; checkedAt: string };
export function conflicts(dates: string[], period: number, agenda: Agenda) {
  return dates.filter(date => {
    // A confirmed booking owns the entire morning/afternoon across the season.
    const afternoon = period === 0 || period === 2;
    const start = Date.parse(`${date}T${afternoon ? "12" : "00"}:00:00-03:00`);
    const end = start + 12 * 60 * 60_000;
    return agenda.busy.some(event => Date.parse(event.start) < end && Date.parse(event.end) > start);
  });
}
export function sponsorship(plan: number, selection: number[]) {
  const counts = plan === 2 ? [9, 9, 9, 9] : selection;
  const count = counts.reduce((a, b) => a + b, 0);
  const valid = counts.length === 4 && counts.every(n => Number.isInteger(n) && n >= 0 && n <= 9) &&
    (plan === 0 ? count >= 1 && count <= 9 : plan === 1 ? count >= 10 && count <= 35 : plan === 2 && count === 36);
  const fans = counts.reduce((sum, n, i) => sum + n * beaches[i].fans, 0);
  const total = counts.reduce((sum, n, i) => sum + n * beaches[i].price, 0);
  const investment = plan === 2 ? "Investimento sob proposta." : `Investimento estimado: ${money(total)}. Valor sujeito à negociação.`;
  const message = `Olá, Cris! Tenho interesse em ${plans[plan]}.\n${counts.map((n, i) => n ? `${beaches[i].name} · ${n} encontro(s)` : "").filter(Boolean).join("\n")}\n${count} encontros · até ${fans.toLocaleString("pt-BR")} ventarolas.\n${investment}\nVamos conversar sobre datas e disponibilidade?`;
  return { counts, count, fans, total, investment, message, valid };
}
