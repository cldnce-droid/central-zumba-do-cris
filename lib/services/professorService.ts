import { alunos, aulas, pagamentos, planos } from "@/lib/student-data/mockData";
import type {
  AlunoStatus,
  Confirmacao,
  PagamentoStatus,
  Presenca
} from "@/lib/student-data";

const STUDENT_STATUS_KEY = "zdc_alunos_status";
const PAYMENT_STATUS_KEY = "zdc_pagamentos_status";
const PRESENCES_KEY = "zdc_presencas";
const CONFIRMATIONS_KEY = "zdc_confirmacoes";

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function getStatusAlunoLocal(alunoId: string) {
  return readLocal<Record<string, AlunoStatus>>(STUDENT_STATUS_KEY, {})[alunoId];
}

export function getAlunosProfessor() {
  const overrides = readLocal<Record<string, AlunoStatus>>(
    STUDENT_STATUS_KEY,
    {}
  );
  return alunos.map((aluno) => ({
    ...aluno,
    status: overrides[aluno.id] ?? aluno.status,
    planoDetalhes: planos.find(
      (plano) => plano.aulasPorSemana === Number(aluno.plano.replace("x", ""))
    )
  }));
}

export function atualizarStatusAluno(alunoId: string, status: AlunoStatus) {
  const overrides = readLocal<Record<string, AlunoStatus>>(
    STUDENT_STATUS_KEY,
    {}
  );
  localStorage.setItem(
    STUDENT_STATUS_KEY,
    JSON.stringify({ ...overrides, [alunoId]: status })
  );
}

export function getConfirmacoesProfessor() {
  return readLocal<Confirmacao[]>(CONFIRMATIONS_KEY, []);
}

export function getPresencasProfessor() {
  return readLocal<Presenca[]>(PRESENCES_KEY, []);
}

export function validarPresenca(
  alunoId: string,
  aulaId: string,
  compareceu: boolean
) {
  const presences = getPresencasProfessor();
  const aula = aulas.find((item) => item.id === aulaId);
  const existing = presences.find(
    (item) => item.alunoId === alunoId && item.aulaId === aulaId
  );

  const presence: Presenca = {
    id: existing?.id ?? `PRES_TEMP_${Date.now()}`,
    alunoId,
    aulaId,
    data: aula?.data ?? new Date().toISOString().slice(0, 10),
    compareceu,
    validadoPor: "professor",
    observacao: ""
  };

  const next = existing
    ? presences.map((item) => (item.id === existing.id ? presence : item))
    : [...presences, presence];
  localStorage.setItem(PRESENCES_KEY, JSON.stringify(next));
}

export function getPagamentosProfessor() {
  const overrides = readLocal<Record<string, PagamentoStatus>>(
    PAYMENT_STATUS_KEY,
    {}
  );
  return pagamentos.map((pagamento) => ({
    ...pagamento,
    status: overrides[pagamento.id] ?? pagamento.status
  }));
}

export function atualizarStatusPagamento(
  pagamentoId: string,
  status: PagamentoStatus
) {
  const overrides = readLocal<Record<string, PagamentoStatus>>(
    PAYMENT_STATUS_KEY,
    {}
  );
  localStorage.setItem(
    PAYMENT_STATUS_KEY,
    JSON.stringify({ ...overrides, [pagamentoId]: status })
  );
}

export function getProximasAulasProfessor() {
  const today = new Date().toISOString().slice(0, 10);
  return aulas
    .filter((aula) => aula.data >= today)
    .sort((first, second) => first.data.localeCompare(second.data));
}

export function getResumoDashboard() {
  const students = getAlunosProfessor();
  return {
    total: students.length,
    ativos: students.filter((item) => item.status === "ativo").length,
    pendentes: students.filter((item) => item.status === "pendente").length,
    atrasados: students.filter((item) => item.status === "atrasado").length,
    confirmacoes: getConfirmacoesProfessor().filter(
      (item) => item.status === "confirmado"
    ).length
  };
}
