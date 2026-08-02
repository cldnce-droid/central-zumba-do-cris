import { getPlanChallengeGoal } from "@/lib/student-data/catalog";
import { sheetRowToPresenca, type SheetRow } from "@/lib/google-sheets/mappers";
import {
  appendCachedRow,
  appendRow,
  getCachedSheet
} from "@/lib/services/googleSheetsService";
import type { Aluno, Desafio } from "@/lib/student-data/types";

const CHALLENGE_START = "2026-08-01";
const CHALLENGE_END = "2026-08-31";
const CHALLENGE_TITLE = "Venci o Sofá";

function getAugustGoal(plan: Aluno["plano"]) {
  return Math.max(1, getPlanChallengeGoal(plan) - 1);
}

function uniqueAcceptedPresences(alunoId: string) {
  const rows = getCachedSheet("Presencas")
    .map(sheetRowToPresenca)
    .filter((presence) => {
      const date = String(presence.dataAula ?? presence.data ?? "");
      return (
        presence.alunoId === alunoId &&
        presence.compareceu === true &&
        presence.status === "aceita" &&
        date >= CHALLENGE_START &&
        date <= CHALLENGE_END
      );
    });

  return new Map(
    rows.map((presence) => [
      `${presence.alunoId}:${presence.aulaId || presence.dataAula || presence.data}`,
      presence
    ])
  ).size;
}

export function getDesafioAgostoSemSofa(
  aluno: Aluno,
  reference = new Date()
): Desafio {
  const goal = getAugustGoal(aluno.plano);
  const progress = Math.min(uniqueAcceptedPresences(aluno.id), goal);
  const referenceKey = [
    reference.getFullYear(),
    String(reference.getMonth() + 1).padStart(2, "0"),
    String(reference.getDate()).padStart(2, "0")
  ].join("-");
  const completed = progress >= goal;
  const inPeriod =
    referenceKey >= CHALLENGE_START && referenceKey <= CHALLENGE_END;
  const statusExecucao = completed
    ? "concluido"
    : inPeriod
      ? "em_andamento"
      : "fora_periodo";

  return {
    id: "DESAFIO_AGOSTO_SEM_SOFA_2026_08",
    titulo: "Desafio Agosto Sem Sofá 🛋️",
    descricao:
      "Complete a meta especial do seu plano durante agosto e conquiste o selo Venci o Sofá.",
    chamada: "O sofá tentou. Mas a dança venceu.",
    tipo: "frequencia",
    meta: goal,
    progresso: progress,
    recompensa: "Selo Venci o Sofá",
    periodo: "Agosto de 2026",
    ativo: inPeriod,
    statusVisual: completed ? "disponivel" : inPeriod ? "disponivel" : "bloqueado",
    statusExecucao,
    mensagem: completed
      ? "Desafio concluído! Você desbloqueou o selo Venci o Sofá."
      : progress === 0
        ? "Você ainda não tem presenças validadas em agosto. Bora levantar do sofá?"
        : inPeriod
          ? "Continue firme! Cada presença validada é uma vitória contra o sofá."
          : "O período deste desafio foi encerrado."
  };
}

export async function registrarConquistaAgostoSemSofaSeNecessario(aluno: Aluno) {
  const challenge = getDesafioAgostoSemSofa(aluno);
  if (challenge.statusExecucao !== "concluido") return false;

  const id = `CONQ_${aluno.id}_AGOSTO_SEM_SOFA_2026_08`;
  if (
    getCachedSheet("Conquistas").some(
      (row) =>
        String(row.id) === id ||
        (String(row.alunoId) === aluno.id &&
          String(row.titulo).toLowerCase() === CHALLENGE_TITLE.toLowerCase())
    )
  ) {
    return false;
  }

  const conquest: SheetRow = {
    id,
    alunoId: aluno.id,
    nomeAluno: aluno.nome,
    tipo: "desafio",
    titulo: CHALLENGE_TITLE,
    coreografia: "",
    dataConquista: new Date().toISOString().slice(0, 10),
    observacao:
      "Desafio Agosto Sem Sofá concluído com a meta especial de presenças."
  };

  const saved = await appendRow("Conquistas", conquest);
  if (!saved) return false;

  appendCachedRow("Conquistas", conquest);
  return true;
}
