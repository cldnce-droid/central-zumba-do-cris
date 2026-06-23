export interface LessonDetails {
  id: string;
  turmaId: string;
  local: string;
  endereco: string;
  data: string;
  horario: string;
}

const classDetails = {
  GANCHOS: {
    turmaId: "TURMA_GANCHOS",
    local: "Ganchos de Fora",
    endereco: "Salão da Capela",
    horario: "18h30"
  },
  PALMAS: {
    turmaId: "TURMA_PALMAS",
    local: "Palmas",
    endereco: "2.0 Lounge",
    horario: "19h"
  },
  CALHEIROS: {
    turmaId: "TURMA_CALHEIROS",
    local: "Calheiros",
    endereco: "Ao lado do Berlanda",
    horario: "20h15"
  }
} as const;

export function getLessonDetailsFromId(id: string): LessonDetails | undefined {
  const match = id.match(
    /^AULA_(GANCHOS|PALMAS|CALHEIROS)_(\d{4}-\d{2}-\d{2})_(\d{1,4})$/
  );
  if (!match) return undefined;

  const [, classCode, data] = match;
  const details = classDetails[classCode as keyof typeof classDetails];

  return {
    id,
    data,
    ...details
  };
}
