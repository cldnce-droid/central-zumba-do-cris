import {
  planos as mockPlans,
  turmas as mockClasses
} from "@/lib/student-data/mockData";
import {
  getPlanoByAluno as buscarPlanoPorAluno,
  getProximaAula as buscarProximaAula,
  getTurmasDisponiveisPorPlano as buscarTurmasDisponiveis
} from "@/lib/student-data/selectors";
import { getStatusAlunoLocal } from "@/lib/services/professorService";
import { sheetRowToAluno } from "@/lib/google-sheets/mappers";
import {
  getCachedSheet,
  readSheet,
  syncGoogleSheetsData
} from "@/lib/services/googleSheetsService";
import type { Aluno, ConquistaVisual } from "@/lib/student-data/types";
import {
  sheetRowToAula,
  sheetRowToDesafio,
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
    ...getStoredAlunos(ALUNOS_PENDENTES_KEY)
  ];
}

function normalizeClassName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getSelectedClassNames(aluno: Aluno) {
  const selected = Array.isArray(aluno.turmasEscolhidas)
    ? aluno.turmasEscolhidas
    : typeof aluno.turmasEscolhidas === "string"
      ? String(aluno.turmasEscolhidas).split(",")
      : [];
  const normalized = selected.map((name) => name.trim()).filter(Boolean);
  return normalized.length
    ? normalized
    : aluno.turmaPrincipal
      ? [aluno.turmaPrincipal]
      : [];
}

const weekDays: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6
};

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function createClassDate(reference: Date, day: string, time: string) {
  const targetDay = weekDays[normalizeClassName(day)];
  if (targetDay === undefined) return null;
  const [hour, minute = "0"] = time.toLowerCase().split("h");
  const occurrence = new Date(reference);
  occurrence.setSeconds(0, 0);
  occurrence.setHours(Number(hour), Number(minute), 0, 0);
  occurrence.setDate(
    reference.getDate() + ((targetDay - reference.getDay() + 7) % 7)
  );
  if (occurrence.getTime() <= reference.getTime()) {
    occurrence.setDate(occurrence.getDate() + 7);
  }
  return occurrence;
}

// Esta lista existe apenas enquanto não há login real.
export function getAlunosParaTeste() {
  return [];
}

export function getAlunoById(id: string) {
  const aluno =
    getAlunosDisponiveis().find((item) => item.id === id);
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
  if (!aluno) return undefined;
  const remotePlans = getCachedSheet("Planos").map(sheetRowToPlano);
  const sourcePlans = remotePlans.length ? remotePlans : mockPlans;
  const plan = sourcePlans.find(
    (plano) =>
      Number(plano.aulasPorSemana) ===
      Number(String(aluno.plano).replace("x", ""))
  );
  if (plan) {
    return plan as unknown as ReturnType<typeof buscarPlanoPorAluno>;
  }
  return buscarPlanoPorAluno(alunoId);
}

export function getTurmasDisponiveisPorPlano(alunoId: string) {
  const aluno = getAlunoById(alunoId);
  if (!aluno) return [];

  const remoteClasses = getCachedSheet("Turmas").map(sheetRowToTurma);
  const sourceClasses = remoteClasses.length ? remoteClasses : mockClasses;
  const selectedNames = new Set(
    getSelectedClassNames(aluno).map(normalizeClassName)
  );

  if (!selectedNames.size) return [];

  const limit = Number(String(aluno.plano).replace("x", ""));
  return sourceClasses
    .filter(
      (turma) =>
        turma.ativa &&
        selectedNames.has(normalizeClassName(String(turma.nome)))
    )
    .slice(0, limit) as unknown as ReturnType<typeof buscarTurmasDisponiveis>;
}

export function getProximaAula(alunoId: string, referencia = new Date()) {
  const selectedClasses = getTurmasDisponiveisPorPlano(alunoId);
  if (!selectedClasses.length) return undefined;

  const generatedClasses = selectedClasses
    .flatMap((turma) =>
      turma.dias.flatMap((day) => {
        const occurrence = createClassDate(referencia, day, turma.horario);
        if (!occurrence) return [];
        const date = formatLocalDate(occurrence);
        return [{
          id: `AULA_${turma.id.replace("TURMA_", "")}_${date}_${turma.horario.replace(/\D/g, "")}`,
          turmaId: turma.id,
          data: date,
          diaSemana: day,
          horario: turma.horario,
          local: turma.nome,
          endereco: turma.endereco,
          status: "agendada"
        }];
      })
    )
    .sort((first, second) =>
      `${first.data}-${first.horario}`.localeCompare(
        `${second.data}-${second.horario}`
      )
    );

  return generatedClasses[0] as unknown as ReturnType<
    typeof buscarProximaAula
  >;
}

export function getStatusPagamento(alunoId: string) {
  const aluno = getAlunoById(alunoId);
  return aluno?.statusPagamento === "pago" ? "pago" : "atrasado";
}

export function getResumoFrequencia(alunoId: string, referencia = new Date()) {
  const remotePresences = getCachedSheet("Presencas")
    .map(sheetRowToPresenca)
    .filter(
      (presenca) =>
        presenca.alunoId === alunoId &&
        presenca.compareceu === true &&
        (presenca.status === undefined || presenca.status === "aceita")
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
  return { aulasNoMes: 0, sequenciaAtual: 0, totalPresencas: 0 };
}

export function getDesafiosDisponiveis(_alunoId: string) {
  const remoteChallenges = getCachedSheet("Desafios").map(sheetRowToDesafio);
  if (remoteChallenges.length) {
    return remoteChallenges.map((challenge) => ({
      ...challenge,
      ativo: false,
      statusVisual: "em_breve" as const
    }));
  }
  return [];
}

export function getConquistasDoAluno(_alunoId: string): ConquistaVisual[] {
  return [];
}
