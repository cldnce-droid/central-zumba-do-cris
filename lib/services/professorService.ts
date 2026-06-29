import { alunos, planos } from "@/lib/student-data/mockData";
import type {
  AlunoStatus,
  Confirmacao,
  PagamentoStatus,
  Presenca
} from "@/lib/student-data";
import {
  getCachedSheet,
  appendCachedRow,
  readSheet,
  replaceCachedSheet,
  syncGoogleSheetsData,
  updateCachedRow,
  updateRow,
  appendRow
} from "@/lib/services/googleSheetsService";
import {
  sheetRowToAluno,
  sheetRowToAula,
  sheetRowToConfirmacao,
  sheetRowToMensalidade,
  sheetRowToPlano,
  sheetRowToPresenca
} from "@/lib/google-sheets/mappers";
import { getLessonDetailsFromId } from "@/lib/utils/lessonId";

const STUDENT_STATUS_KEY = "zdc_alunos_status";
const PRESENCES_KEY = "zdc_presencas";
const CONFIRMATIONS_KEY = "zdc_confirmacoes";
const REGISTERED_STUDENTS_KEY = "zdc_alunos_cadastrados";

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
  const baseStudents = remoteStudents.length ? remoteStudents : [];
  const studentsById = new Map(
    [...localStudents, ...baseStudents].map((aluno) => [aluno.id, aluno])
  );
  const sourceStudents = Array.from(studentsById.values());
  const remotePlans = getCachedSheet("Planos").map(sheetRowToPlano);
  const sourcePlans = remotePlans.length ? remotePlans : planos;
  return sourceStudents.map((aluno) => ({
    ...aluno,
    status: overrides[String(aluno.id)] ?? aluno.statusCadastro ?? aluno.status,
    statusCadastro: overrides[String(aluno.id)] ?? aluno.statusCadastro ?? aluno.status,
    statusPagamento: aluno.statusPagamento ?? "atrasado",
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
                statusCadastro: status,
                ...(status === "ativo"
                  ? { diaVencimento: 8, statusPagamento: "atrasado" }
                  : {})
              }
            : student
        )
      )
    );
  }
  const studentUpdates = {
    status,
    statusCadastro: status,
    ...(status === "ativo"
      ? { diaVencimento: 8, statusPagamento: "atrasado" }
      : {})
  };
  updateCachedRow("Alunos", alunoId, studentUpdates);
  const updated = await updateRow("Alunos", alunoId, studentUpdates);
  if (!updated) {
    throw new Error("Não foi possível atualizar o cadastro.");
  }
  void syncGoogleSheetsData(["Alunos"]);
}

export function getConfirmacoesProfessor() {
  const remote = getCachedSheet("Confirmacoes").map(sheetRowToConfirmacao);
  const source = remote.length
    ? (remote as unknown as Confirmacao[])
    : readLocal<Confirmacao[]>(CONFIRMATIONS_KEY, []);
  return Array.from(
    new Map(
      source.map((item) => [`${item.alunoId}:${item.aulaId}`, item])
    ).values()
  );
}

export async function sincronizarSolicitacoesProfessor() {
  const response = await readSheet("Confirmacoes");
  if (!response || response.fallback || !response.configured) {
    throw new Error("Não foi possível acessar a aba Confirmacoes.");
  }
  replaceCachedSheet("Confirmacoes", response.data);
  void syncGoogleSheetsData(["Alunos", "Presencas"]);
  return response.data.length;
}

export async function sincronizarFinanceiroProfessor() {
  const response = await readSheet("Mensalidades");
  if (!response || response.fallback || !response.configured) {
    throw new Error("Nao foi possivel acessar a aba Mensalidades.");
  }
  replaceCachedSheet("Mensalidades", response.data);
  return response.data.length;
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
    getLessonDetailsFromId(aulaId);
  const aluno = getAlunosProfessor().find((item) => item.id === alunoId);
  const existing = presences.find(
    (item) => item.alunoId === alunoId && item.aulaId === aulaId
  );

  const presence: Presenca = {
    id: existing?.id ?? `PRES_${alunoId}_${aulaId}`,
    alunoId,
    nomeAluno: aluno?.nome ?? "",
    whatsapp: aluno?.whatsapp ?? "",
    aulaId,
    turma: aula?.local ?? "",
    local: aula?.endereco ?? aula?.local ?? "",
    data: aula?.data ?? new Date().toISOString().slice(0, 10),
    dataAula: aula?.data ?? new Date().toISOString().slice(0, 10),
    horario: aula?.horario ?? "",
    dataValidacao: new Date().toISOString(),
    status: compareceu ? "aceita" : "recusada",
    compareceu,
    validadoPor: "professor",
    observacao: ""
  };

  const next = existing
    ? presences.map((item) => (item.id === existing.id ? presence : item))
    : [...presences, presence];
  localStorage.setItem(PRESENCES_KEY, JSON.stringify(next));
  if (existing) {
    updateCachedRow("Presencas", existing.id, { ...presence });
  } else {
    appendCachedRow("Presencas", { ...presence });
  }
  const saved = existing
    ? await updateRow("Presencas", existing.id, { ...presence })
    : await appendRow("Presencas", { ...presence });
  if (!saved) {
    throw new Error("Não foi possível validar a presença.");
  }
}

function saveConfirmations(confirmations: Confirmacao[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(CONFIRMATIONS_KEY, JSON.stringify(confirmations));
  }
}

async function processarAceiteSolicitacaoPresenca(confirmacaoId: string) {
  const confirmations = getConfirmacoesProfessor();
  const confirmation = confirmations.find((item) => item.id === confirmacaoId);
  if (!confirmation) return;

  const updated = { ...confirmation, status: "aceita" as const };
  saveConfirmations(
    confirmations.map((item) => (item.id === confirmacaoId ? updated : item))
  );
  const [confirmationUpdated] = await Promise.all([
    updateRow("Confirmacoes", confirmacaoId, { status: "aceita" }),
    validarPresenca(updated.alunoId, updated.aulaId, true)
  ]);
  if (!confirmationUpdated) {
    throw new Error("Não foi possível aceitar a solicitação.");
  }
  updateCachedRow("Confirmacoes", confirmacaoId, { status: "aceita" });
  void syncGoogleSheetsData(["Confirmacoes", "Presencas"]);
}

export async function aceitarSolicitacaoPresenca(confirmacaoId: string) {
  return processarAceiteSolicitacaoPresenca(confirmacaoId);
}

export async function recusarSolicitacaoPresenca(confirmacaoId: string) {
  const confirmations = getConfirmacoesProfessor();
  const confirmation = confirmations.find((item) => item.id === confirmacaoId);
  if (!confirmation) return;

  const updated = { ...confirmation, status: "recusada" as const };
  saveConfirmations(
    confirmations.map((item) => (item.id === confirmacaoId ? updated : item))
  );
  const confirmationUpdated = await updateRow("Confirmacoes", confirmacaoId, {
    status: "recusada"
  });
  if (!confirmationUpdated) {
    throw new Error("Não foi possível recusar a solicitação.");
  }
  updateCachedRow("Confirmacoes", confirmacaoId, { status: "recusada" });
  void syncGoogleSheetsData(["Confirmacoes"]);
}

export function getPagamentosProfessor() {
  return getAlunosProfessor().map((aluno) => ({
    id: aluno.id,
    alunoId: aluno.id,
    plano: aluno.plano,
    valor: aluno.planoDetalhes?.valor ?? 0,
    vencimento: `${new Date().toISOString().slice(0, 7)}-08`,
    dataPagamento: null,
    status: aluno.statusPagamento === "pago" ? "pago" : "atrasado",
    metodo: aluno.formaPagamento ?? "outro"
  }));
}

export function getMensalidadesProfessor() {
  return getCachedSheet("Mensalidades").map(sheetRowToMensalidade);
}

export async function aprovarMensalidade(mensalidadeId: string) {
  const updates = {
    status: "pago",
    dataPagamento: new Date().toISOString().slice(0, 10),
    observacao: "Pagamento aprovado pelo professor"
  };
  updateCachedRow("Mensalidades", mensalidadeId, updates);
  const updated = await updateRow("Mensalidades", mensalidadeId, updates);
  if (!updated) {
    throw new Error("NÃ£o foi possÃ­vel aprovar a mensalidade.");
  }
  void syncGoogleSheetsData(["Mensalidades"]);
  return true;
}

export async function atualizarStatusPagamento(
  alunoId: string,
  status: PagamentoStatus
) {
  const normalizedStatus = status === "pago" ? "pago" : "atrasado";
  const localStudents = readLocal<typeof alunos>(REGISTERED_STUDENTS_KEY, []);
  if (localStudents.some((student) => student.id === alunoId)) {
    localStorage.setItem(
      REGISTERED_STUDENTS_KEY,
      JSON.stringify(
        localStudents.map((student) =>
          student.id === alunoId
            ? { ...student, statusPagamento: normalizedStatus }
            : student
        )
      )
    );
  }
  updateCachedRow("Alunos", alunoId, {
    statusPagamento: normalizedStatus
  });
  const updated = await updateRow("Alunos", alunoId, {
    statusPagamento: normalizedStatus
  });
  if (!updated) {
    throw new Error("Não foi possível atualizar o pagamento na planilha.");
  }
  void syncGoogleSheetsData(["Alunos"]);
}

export function getProximasAulasProfessor() {
  const today = new Date().toISOString().slice(0, 10);
  const remote = getCachedSheet("Aulas").map(sheetRowToAula);
  const source = remote;
  return source
    .filter((aula) => String(aula.data ?? "") >= today)
    .sort((first, second) =>
      String(first.data ?? "").localeCompare(String(second.data ?? ""))
    );
}

export function limparDadosLocaisDeTeste() {
  [
    STUDENT_STATUS_KEY,
    PRESENCES_KEY,
    CONFIRMATIONS_KEY,
    REGISTERED_STUDENTS_KEY,
    "zdc_alunos_remotos",
    "zdc_google_sheets_cache",
    "alunoAtualId"
  ].forEach((key) => localStorage.removeItem(key));
}

export async function sincronizarDashboardProfessor() {
  return syncGoogleSheetsData([
    "Alunos",
    "Presencas",
    "Mensalidades"
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
      (item) => item.status === "solicitada" || item.status === "confirmado"
    ).length
  };
}
