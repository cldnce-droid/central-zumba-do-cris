import type { Aula } from "@/lib/student-data";

function formatGoogleCalendarDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function createClassDate(aula: Aula) {
  const [hour, minute = "0"] = aula.horario.split("h");
  return new Date(
    `${aula.data}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00-03:00`
  );
}

export function createGoogleCalendarUrl(aula: Aula) {
  const start = createClassDate(aula);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Zumba do Cris — ${aula.local}`,
    dates: `${formatGoogleCalendarDate(start)}/${formatGoogleCalendarDate(end)}`,
    details:
      "Aula confirmada na Central Zumba do Cris. Errou… continua!\n\nLembrete sugerido: 30 minutos antes da aula. Lembre-se de ativar o aviso.",
    location: aula.endereco,
    ctz: "America/Sao_Paulo"
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
