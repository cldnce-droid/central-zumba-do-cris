import { alunos, aulas, pagamentos, planos } from "@/lib/student-data/mockData";
import type {
  AlunoStatus,
  Confirmacao,
  PagamentoStatus,
  Presenca
} from "@/lib/student-data";
import {
  getCachedSheet,
  syncGoogleSheetsData,
  updateRow,
  appendRow
} from "@/lib/services/googleSheetsService";
import {
  sheetRowToAluno,
  sheetRowToAula,
  sheetRowToConfirmacao,
  sheetRowToPagamento,
  sheetRowToPlano,
  sheetRowToPresenca
} from "@/lib/google-sheets/mappers";

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
  const remoteStudents = getCachedSheet("Alunos").map(sheetRowToAluno);
  const sourceStudents = remoteStudents.length ? remoteStudents : alunos;
  const remotePlans = getCachedSheet("Planos").map(sheetRowToPlano);
  const sourcePlans = remotePlans.length ? remotePlans : planos;
  return sourceStudents.map((aluno) => ({
    ...aluno,
    status: overrides[String(aluno.id)] ?? aluno.status,
    planoDetalhes: sourcePlans.find(
      (plano) =>
        plano.aulasPorSemana ===
        Number(String(aluno.plano).replace("x", ""))
    )
  }));
}

export async function atualizarStatusAluno(alunoId: string, status: AlunoStatus) {
  const overrides = readLocal<Record<string, AlunoStatus>>(
    STUDENT_STATUS_KEY,
    {}
  );
  localStorage.setItem(
    STUDENT_STATUS_KEY,
    JSON.stringify({ ...overrides, [alunoId]: status })
  );
  await updateRow("Alunos", alunoId, { status });
}

export function getConfirmacoesProfessor() {
  const remote = getCachedSheet("Confirmacoes").map(sheetRowToConfirmacao);
  return remote.length
    ? (remote as unknown as Confirmacao[])
    : readLocal<Confirmacao[]>(CONFIRMATIONS_KEY, []);
}

export function getPresencasProfessor() {
  const remote = getCachedSheet("Presencas").map(sheetRowToPresenca);
  return remote.length
    ? (remote as unknown as Presenca[])
    : readLocal<Presenca[]>(PRESENCES_KEY, []);
}

export async function validarPresenca(
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
  if (existing) {
    await updateRow("Presencas", existing.id, { ...presence });
  } else {
    await appendRow("Presencas", { ...presence });
  }
}

export function getPagamentosProfessor() {
  const overrides = readLocal<Record<string, PagamentoStatus>>(
    PAYMENT_STATUS_KEY,
    {}
  );
  const remote = getCachedSheet("Pagamentos").map(sheetRowToPagamento);
  const source = remote.length ? remote : pagamentos;
  return source.map((pagamento) => ({
    ...pagamento,
    status: overrides[pagamento.id] ?? pagamento.status
  }));
}

export async function atualizarStatusPagamento(
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
  await updateRow("Pagamentos", pagamentoId, {
    status,
    ...(status === "pago"
      ? { dataPagamento: new Date().toISOString().slice(0, 10) }
      : {})
  });
}

export function getProximasAulasProfessor() {
  const today = new Date().toISOString().slice(0, 10);
  const remote = getCachedSheet("Aulas").map(sheetRowToAula);
  const source = remote.length ? remote : aulas;
  return source
    .filter((aula) => aula.data >= today)
    .sort((first, second) => first.data.localeCompare(second.data));
}

export async function sincronizarDashboardProfessor() {
  return syncGoogleSheetsData([
    "Alunos",
    "Planos",
    "Aulas",
    "Confirmacoes",
    "Presencas",
    "Pagamentos"
  ]);
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
