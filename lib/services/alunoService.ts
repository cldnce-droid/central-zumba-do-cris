import { alunos } from "@/lib/student-data/mockData";
import {
  getAlunoById as buscarAlunoPorId,
  getConquistasAluno,
  getDesafiosDisponiveis as buscarDesafiosDisponiveis,
  getPlanoByAluno as buscarPlanoPorAluno,
  getProximaAula as buscarProximaAula,
  getResumoFrequencia as buscarResumoFrequencia,
  getStatusPagamento as buscarStatusPagamento,
  getTurmasDisponiveisPorPlano as buscarTurmasDisponiveis
} from "@/lib/student-data/selectors";
import { getStatusAlunoLocal } from "@/lib/services/professorService";
import { sheetRowToAluno } from "@/lib/google-sheets/mappers";
import {
  getCachedSheet,
  readSheet,
  syncGoogleSheetsData
} from "@/lib/services/googleSheetsService";
import type { Aluno } from "@/lib/student-data/types";
import {
  sheetRowToAula,
  sheetRowToDesafio,
  sheetRowToPagamento,
  sheetRowToPlano,
  sheetRowToPresenca,
  sheetRowToTurma
} from "@/lib/google-sheets/mappers";

export const alunoAtualId = "ALU001";
const ALUNOS_PENDENTES_KEY = "zdc_alunos_cadastrados";
const ALUNOS_REMOTOS_KEY = "zdc_alunos_remotos";

function getStoredAlunos(key: string): Aluno[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as Aluno[];
  } catch {
    return [];
  }
}

function getAlunosDisponiveis() {
  return [
    ...getStoredAlunos(ALUNOS_REMOTOS_KEY),
    ...getStoredAlunos(ALUNOS_PENDENTES_KEY),
    ...alunos
  ];
}

// Esta lista existe apenas enquanto não há login real.
export function getAlunosParaTeste() {
  return alunos;
}

export function getAlunoById(id: string) {
  const aluno =
    getAlunosDisponiveis().find((item) => item.id === id) ??
    buscarAlunoPorId(id);
  const status = aluno ? getStatusAlunoLocal(aluno.id) : undefined;
  return aluno ? { ...aluno, status: status ?? aluno.status } : undefined;
}

export function getAlunoByWhatsapp(whatsapp: string) {
  const normalizedWhatsapp = whatsapp.replace(/\D/g, "");
  const aluno = getAlunosDisponiveis().find(
    (aluno) => aluno.whatsapp.replace(/\D/g, "") === normalizedWhatsapp
  );
  const status = aluno ? getStatusAlunoLocal(aluno.id) : undefined;
  return aluno ? { ...aluno, status: status ?? aluno.status } : undefined;
}

export async function getAlunoByWhatsappRemoto(whatsapp: string) {
  const normalizedWhatsapp = whatsapp.replace(/\D/g, "");
  const response = await readSheet("Alunos");
  const alunoRemoto = response?.data
    .map(sheetRowToAluno)
    .find(
      (aluno) =>
        String(aluno.whatsapp).replace(/\D/g, "") === normalizedWhatsapp
    ) as Aluno | undefined;

  if (alunoRemoto && typeof window !== "undefined") {
    const existentes = getStoredAlunos(ALUNOS_REMOTOS_KEY).filter(
      (aluno) => aluno.id !== alunoRemoto.id
    );
    localStorage.setItem(
      ALUNOS_REMOTOS_KEY,
      JSON.stringify([...existentes, alunoRemoto])
    );
    await syncGoogleSheetsData();
    return alunoRemoto;
  }

  return getAlunoByWhatsapp(whatsapp);
}

export function getPlanoByAluno(alunoId: string) {
  const aluno = getAlunoById(alunoId);
  const remotePlans = getCachedSheet("Planos").map(sheetRowToPlano);
  const remotePlan = remotePlans.find(
    (plano) =>
      Number(plano.aulasPorSemana) ===
      Number(String(aluno?.plano ?? "").replace("x", ""))
  );
  if (remotePlan) {
    return remotePlan as unknown as ReturnType<typeof buscarPlanoPorAluno>;
  }
  return buscarPlanoPorAluno(alunoId);
}

export function getTurmasDisponiveisPorPlano(alunoId: string) {
  const aluno = getAlunoById(alunoId) as
    | (Aluno & { turmasEscolhidas?: string[] })
    | undefined;
  const remoteClasses = getCachedSheet("Turmas").map(sheetRowToTurma);
  if (aluno && remoteClasses.length) {
    const selected = aluno.turmasEscolhidas?.length
      ? remoteClasses.filter((turma) =>
          aluno.turmasEscolhidas?.includes(String(turma.nome))
        )
      : remoteClasses.filter((turma) => turma.id === aluno.turmaPrincipal);
    const limit = Number(String(aluno.plano).replace("x", ""));
    return (selected.length ? selected : remoteClasses)
      .filter((turma) => turma.ativa)
      .slice(0, limit) as unknown as ReturnType<typeof buscarTurmasDisponiveis>;
  }
  return buscarTurmasDisponiveis(alunoId);
}

export function getProximaAula(alunoId: string, referencia = new Date()) {
  const remoteClasses = getTurmasDisponiveisPorPlano(alunoId);
  const classIds = new Set(remoteClasses.map((turma) => turma.id));
  const today = referencia.toISOString().slice(0, 10);
  const remoteClass = getCachedSheet("Aulas")
    .map(sheetRowToAula)
    .filter(
      (aula) =>
        classIds.has(String(aula.turmaId)) &&
        aula.status === "agendada" &&
        String(aula.data) >= today
    )
    .sort((first, second) =>
      String(first.data).localeCompare(String(second.data))
    )[0];
  if (remoteClass) {
    return remoteClass as unknown as ReturnType<typeof buscarProximaAula>;
  }
  return buscarProximaAula(alunoId, referencia);
}

export function getStatusPagamento(alunoId: string) {
  const remotePayment = getCachedSheet("Pagamentos")
    .map(sheetRowToPagamento)
    .filter((pagamento) => pagamento.alunoId === alunoId)
    .sort((first, second) =>
      String(second.vencimento).localeCompare(String(first.vencimento))
    )[0];
  if (remotePayment) {
    return remotePayment as unknown as ReturnType<typeof buscarStatusPagamento>;
  }
  return buscarStatusPagamento(alunoId);
}

export function getResumoFrequencia(alunoId: string, referencia = new Date()) {
  const remotePresences = getCachedSheet("Presencas")
    .map(sheetRowToPresenca)
    .filter(
      (presenca) =>
        presenca.alunoId === alunoId && presenca.compareceu === true
    );
  if (remotePresences.length) {
    const month = referencia.toISOString().slice(0, 7);
    return {
      aulasNoMes: remotePresences.filter((item) =>
        String(item.data).startsWith(month)
      ).length,
      sequenciaAtual: remotePresences.length,
      totalPresencas: remotePresences.length
    };
  }
  return buscarResumoFrequencia(alunoId, referencia);
}

export function getDesafiosDisponiveis(alunoId: string) {
  const remoteChallenges = getCachedSheet("Desafios").map(sheetRowToDesafio);
  if (remoteChallenges.length) {
    return remoteChallenges as unknown as ReturnType<
      typeof buscarDesafiosDisponiveis
    >;
  }
  return buscarDesafiosDisponiveis(alunoId);
}

export function getConquistasDoAluno(alunoId: string) {
  return getConquistasAluno(alunoId);
}
