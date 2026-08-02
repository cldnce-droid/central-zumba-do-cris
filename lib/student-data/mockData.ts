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
import { officialClasses, officialPlans } from "./catalog";

// Producao comeca sem pessoas ou movimentacoes ficticias.
export const alunos: Aluno[] = [];
export const aulas: Aula[] = [];
export const confirmacoes: Confirmacao[] = [];
export const presencas: Presenca[] = [];
export const pagamentos: Pagamento[] = [];
export const desafios: Desafio[] = [];

// Planos e turmas sao dados estruturais oficiais usados quando a base esta vazia.
export const planos: Plano[] = officialPlans;
export const turmas: Turma[] = officialClasses;
