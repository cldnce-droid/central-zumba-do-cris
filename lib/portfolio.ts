export const periods = ["Sexta à tarde", "Sábado de manhã", "Sábado à tarde", "Domingo de manhã"];
// Previsão por espaço, a confirmar antes da publicação.
export const partnerFans = 2500;
export const beaches = ["Armação", "Palmas", "Calheiros", "Ganchos de Fora"];
export const offers = [
  {
    title: "Apoiador",
    price: 500,
    benefits: [
      "Logo no bloco inferior do verso, na área de 40% reservada às marcas em formato menor.",
      "Divulgação nas 8.000 ventarolas previstas para distribuição nas quatro praias durante a temporada.",
      "Perfil no Guia de Verão com nome, segmento, bairro, descrição e link para Instagram, WhatsApp ou localização."
    ]
  },
  {
    title: "Patrocinador",
    price: 2500,
    benefits: [
      "Logo ampliada no bloco superior do verso das 8.000 ventarolas previstas. Limitado a 6 marcas.",
      "Menções à sua marca em todos os 36 encontros previstos para o circuito.",
      "Logo no par de beach flags coletivos do circuito.",
      "Cartão de destaque no guia acessado pelo QR Code, com oferta própria e instruções de resgate.",
      "Uma publicação coletiva no Instagram da Zumba do Cris marcando as seis marcas.",
      "Resumo ao final da temporada com fotos das ativações, encontros realizados e alcance da publicação coletiva."
    ]
  }
] as const;
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
