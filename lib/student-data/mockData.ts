import type {
  Aluno,
  Aula,
  Confirmacao,
  Desafio,
  Pagamento,
  Plano,
  Presenca,
  Turma
} from "./types";

// Produção começa sem pessoas ou movimentações fictícias.
export const alunos: Aluno[] = [];
export const aulas: Aula[] = [];
export const confirmacoes: Confirmacao[] = [];
export const presencas: Presenca[] = [];
export const pagamentos: Pagamento[] = [];
export const desafios: Desafio[] = [];

// Planos e turmas são dados estruturais oficiais usados quando a base está vazia.
export const planos: Plano[] = [
  {
    id: "PLANO_1X",
    nome: "1x por semana",
    valor: 50,
    aulasPorSemana: 1,
    descricao: "Uma aula por semana para manter o corpo em movimento.",
    destaque: false
  },
  {
    id: "PLANO_2X",
    nome: "2x por semana",
    valor: 85,
    aulasPorSemana: 2,
    descricao: "Duas aulas por semana para ganhar ritmo e evoluir.",
    destaque: false
  },
  {
    id: "PLANO_3X",
    nome: "3x por semana",
    valor: 100,
    aulasPorSemana: 3,
    descricao: "O plano mais completo do Zumba do Cris.",
    destaque: true
  }
];

export const turmas: Turma[] = [
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
    dias: ["quarta"],
    horario: "19h",
    endereco: "2.0 Lounge",
    capacidade: 25,
    ativa: true
  },
  {
    id: "TURMA_CALHEIROS",
    nome: "Calheiros",
    local: "Calheiros",
    dias: ["quinta"],
    horario: "20h15",
    endereco: "Ao lado do Berlanda",
    capacidade: 15,
    ativa: true
  }
];
