import type { Plano, PlanoCodigo, Turma } from "./types";

export const officialPlans: Plano[] = [
  {
    id: "PLANO_1X",
    nome: "1x por semana",
    valor: 80,
    aulasPorSemana: 1,
    descricao: "Acesso a 1 aula por semana.",
    destaque: false
  },
  {
    id: "PLANO_2X",
    nome: "2x por semana",
    valor: 100,
    aulasPorSemana: 2,
    descricao: "Acesso a 2 aulas por semana.",
    destaque: false
  },
  {
    id: "PLANO_3X",
    nome: "3x por semana",
    valor: 130,
    aulasPorSemana: 3,
    descricao: "Acesso a 3 aulas por semana.",
    destaque: false
  },
  {
    id: "PLANO_PREMIUM",
    nome: "Plano Apoiadora Premium",
    valor: 150,
    aulasPorSemana: "ilimitado",
    descricao: "Acesso livre a todas as aulas em qualquer local.",
    destaque: true
  }
];

export const officialClasses: Turma[] = [
  {
    id: "TURMA_GANCHOS",
    nome: "Ganchos de Fora",
    local: "Ganchos de Fora",
    dias: ["terça", "quinta"],
    horario: "18h30",
    endereco: "Salão da Capela",
    capacidade: null,
    ativa: true
  },
  {
    id: "TURMA_PALMAS",
    nome: "Palmas",
    local: "Palmas",
    dias: ["segunda", "quarta"],
    horario: "19h",
    endereco: "Novo local em Palmas",
    capacidade: 25,
    ativa: true
  },
  {
    id: "TURMA_CALHEIROS",
    nome: "Calheiros",
    local: "Calheiros",
    dias: ["terça", "quinta"],
    horario: "20h15",
    endereco: "Ao lado do Berlanda",
    capacidade: 15,
    ativa: true
  },
  {
    id: "TURMA_ARMACAO",
    nome: "Armação",
    local: "Armação",
    dias: ["segunda", "quarta"],
    horario: "20h30",
    endereco: "Novo local em Armação",
    capacidade: null,
    ativa: true
  }
];

function normalizedText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function normalizePlano(value: unknown): PlanoCodigo {
  const source =
    value && typeof value === "object"
      ? Object.values(value as Record<string, unknown>).join(" ")
      : value;
  const text = normalizedText(source);

  if (
    /premium|apoiadora|ilimitad|livre/.test(text) ||
    /(^|\D)150(\D|$)/.test(text)
  ) {
    return "premium";
  }
  if (/plano_?3x|(^|\D)3\s*x(\D|$)/.test(text) || /(^|\D)130(\D|$)/.test(text)) {
    return "3x";
  }
  if (/plano_?2x|(^|\D)2\s*x(\D|$)/.test(text) || /(^|\D)100(\D|$)/.test(text)) {
    return "2x";
  }
  if (/plano_?1x|(^|\D)1\s*x(\D|$)/.test(text) || /(^|\D)80(\D|$)/.test(text)) {
    return "1x";
  }

  return "1x";
}

export function getOfficialPlan(value: unknown) {
  const code = normalizePlano(value);
  const id =
    code === "premium" ? "PLANO_PREMIUM" : `PLANO_${code.toUpperCase()}`;
  return officialPlans.find((plan) => plan.id === id);
}

export function getPlanSelectionLimit(value: unknown) {
  const code = normalizePlano(value);
  return code === "premium"
    ? officialClasses.length
    : Number(code.replace("x", ""));
}

export function getRegistrationLocationCount(value: unknown) {
  const code = normalizePlano(value);
  if (code === "premium") return officialClasses.length;
  if (code === "2x") return 1;
  return Number(code.replace("x", ""));
}

export function getPlanChallengeGoal(value: unknown) {
  const code = normalizePlano(value);
  if (code === "1x") return 4;
  if (code === "2x") return 8;
  return 12;
}

export function isPremiumPlan(value: unknown) {
  return normalizePlano(value) === "premium";
}

export function getOfficialClass(value: unknown) {
  const text = normalizedText(value);
  return officialClasses.find((classItem) => {
    const id = normalizedText(classItem.id);
    const name = normalizedText(classItem.nome);
    return text.includes(id) || text.includes(name);
  });
}
