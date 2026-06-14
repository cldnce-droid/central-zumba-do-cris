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
const REGISTERED_STUDENTS_KEY = "zdc_alunos_cadastrados";
const CREATED_PAYMENTS_KEY = "zdc_pagamentos_criados";

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
  const localStudents = readLocal<typeof alunos>(
    REGISTERED_STUDENTS_KEY,
    []
  );
  const baseStudents = remoteStudents.length ? remoteStudents : alunos;
  const studentsById = new Map(
    [...localStudents, ...baseStudents].map((aluno) => [aluno.id, aluno])
  );
  const sourceStudents = Array.from(studentsById.values());
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
  const localStudents = readLocal<typeof alunos>(REGISTERED_STUDENTS_KEY, []);
  if (localStudents.some((student) => student.id === alunoId)) {
    localStorage.setItem(
      REGISTERED_STUDENTS_KEY,
      JSON.stringify(
        localStudents.map((student) =>
          student.id === alunoId
            ? {
                ...student,
                status,
                ...(status === "ativo" ? { diaVencimento: 8 } : {})
              }
            : student
        )
      )
    );
  }
  const student = getAlunosProfessor().find((item) => item.id === alunoId);
  await updateRow("Alunos", alunoId, {
    status,
    ...(status === "ativo" ? { diaVencimento: 8 } : {})
  });

  if (status === "ativo" && student) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const existing = getPagamentosProfessor().find(
      (payment) =>
        payment.alunoId === alunoId && payment.vencimento.startsWith(month)
    );
    const payment = {
      id: existing?.id ?? `PAG_${alunoId}_${month}`,
      alunoId,
      plano: student.plano,
      valor: student.planoDetalhes?.valor ?? 0,
      vencimento: `${month}-08`,
      dataPagamento: null,
      status: "atrasado" as const,
      metodo: student.formaPagamento ?? "outro"
    };

    if (existing) {
      await updateRow("Pagamentos", existing.id, { ...payment });
    } else {
      await appendRow("Pagamentos", { ...payment });
    }

    const localPayments = readLocal<typeof pagamentos>(
      CREATED_PAYMENTS_KEY,
      []
    ).filter((item) => item.id !== payment.id);
    localStorage.setItem(
      CREATED_PAYMENTS_KEY,
      JSON.stringify([...localPayments, payment])
    );
  }

  await syncGoogleSheetsData(["Alunos", "Pagamentos"]);
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
  const remoteClasses = getCachedSheet("Aulas").map(sheetRowToAula);
  const aula =
    remoteClasses.find((item) => item.id === aulaId) ??
    aulas.find((item) => item.id === aulaId);
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
  const created = readLocal<typeof pagamentos>(CREATED_PAYMENTS_KEY, []);
  const base = remote.length ? remote : pagamentos;
  const source = Array.from(
    new Map([...created, ...base].map((payment) => [payment.id, payment])).values()
  );
  return source.map((pagamento) => ({
    ...pagamento,
    status:
      overrides[pagamento.id] === "pago" || pagamento.status === "pago"
        ? "pago"
        : "atrasado"
  }));
}

export async function atualizarStatusPagamento(
  pagamentoId: string,
  status: PagamentoStatus
) {
  const normalizedStatus = status === "pago" ? "pago" : "atrasado";
  const overrides = readLocal<Record<string, PagamentoStatus>>(
    PAYMENT_STATUS_KEY,
    {}
  );
  localStorage.setItem(
    PAYMENT_STATUS_KEY,
    JSON.stringify({ ...overrides, [pagamentoId]: normalizedStatus })
  );
  const createdPayments = readLocal<typeof pagamentos>(
    CREATED_PAYMENTS_KEY,
    []
  );
  if (createdPayments.some((payment) => payment.id === pagamentoId)) {
    localStorage.setItem(
      CREATED_PAYMENTS_KEY,
      JSON.stringify(
        createdPayments.map((payment) =>
          payment.id === pagamentoId
            ? {
                ...payment,
                status: normalizedStatus,
                dataPagamento:
                  normalizedStatus === "pago"
                    ? new Date().toISOString().slice(0, 10)
                    : null
              }
            : payment
        )
      )
    );
  }
  await updateRow("Pagamentos", pagamentoId, {
    status: normalizedStatus,
    ...(normalizedStatus === "pago"
      ? { dataPagamento: new Date().toISOString().slice(0, 10) }
      : { dataPagamento: "" })
  });
  await syncGoogleSheetsData(["Pagamentos"]);
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
