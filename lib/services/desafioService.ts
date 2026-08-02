import { getPlanChallengeGoal } from "@/lib/student-data/catalog";
import { sheetRowToPresenca, type SheetRow } from "@/lib/google-sheets/mappers";
import {
  appendCachedRow,
  appendRow,
  getCachedSheet
} from "@/lib/services/googleSheetsService";
import type { Aluno, Desafio } from "@/lib/student-data/types";

const FROZEN_START = "2026-07-01";
const FROZEN_END = "2026-07-31";
const FROZEN_TITLE = "Dançarina Frozen";

function uniqueAcceptedPresences(alunoId: string) {
  const rows = getCachedSheet("Presencas")
    .map(sheetRowToPresenca)
    .filter((presence) => {
      const date = String(presence.dataAula ?? presence.data ?? "");
      return (
        presence.alunoId === alunoId &&
        presence.compareceu === true &&
        presence.status === "aceita" &&
        date >= FROZEN_START &&
        date <= FROZEN_END
      );
    });

  return new Map(
    rows.map((presence) => [
      `${presence.alunoId}:${presence.aulaId || presence.dataAula || presence.data}`,
      presence
    ])
  ).size;
}

export function getDesafioDancarinaFrozen(
  aluno: Aluno,
  reference = new Date()
): Desafio {
  const goal = getPlanChallengeGoal(aluno.plano);
  const progress = Math.min(uniqueAcceptedPresences(aluno.id), goal);
  const referenceKey = [
    reference.getFullYear(),
    String(reference.getMonth() + 1).padStart(2, "0"),
    String(reference.getDate()).padStart(2, "0")
  ].join("-");
  const completed = progress >= goal;
  const inPeriod = referenceKey >= FROZEN_START && referenceKey <= FROZEN_END;
  const statusExecucao = completed
    ? "concluido"
    : inPeriod
      ? "em_andamento"
      : "fora_periodo";

  return {
    id: "DESAFIO_DANCARINA_FROZEN_2026_07",
    titulo: "Desafio Dançarina Frozen ❄️",
    descricao:
      "Complete as presenças do seu plano durante julho e ganhe R$10 de desconto em agosto.",
    chamada: "Julho é frio, mas quem dança não congela.",
    tipo: "frequencia",
    meta: goal,
    progresso: progress,
    recompensa: "R$10 de desconto",
    periodo: "Julho de 2026",
    ativo: inPeriod,
    statusVisual: completed ? "disponivel" : inPeriod ? "disponivel" : "bloqueado",
    statusExecucao,
    mensagem: completed
      ? "Desafio concluído! Você desbloqueou R$10 de desconto na próxima mensalidade."
      : progress === 0
        ? "Você ainda não tem presenças validadas em julho."
        : inPeriod
          ? "Continue firme! Cada presença validada te aproxima da recompensa."
          : "O período deste desafio foi encerrado."
  };
}

export async function registrarConquistaFrozenSeNecessario(aluno: Aluno) {
  const challenge = getDesafioDancarinaFrozen(aluno);
  if (challenge.statusExecucao !== "concluido") return false;

  const id = `CONQ_${aluno.id}_DANCARINA_FROZEN_2026_07`;
  if (
    getCachedSheet("Conquistas").some(
      (row) =>
        String(row.id) === id ||
        (String(row.alunoId) === aluno.id &&
          String(row.titulo).toLowerCase() === FROZEN_TITLE.toLowerCase())
    )
  ) {
    return false;
  }

  const conquest: SheetRow = {
    id,
    alunoId: aluno.id,
    nomeAluno: aluno.nome,
    tipo: "desafio",
    titulo: FROZEN_TITLE,
    coreografia: "",
    dataConquista: new Date().toISOString().slice(0, 10),
    observacao:
      "Desafio de frequência de julho concluído. R$10 de desconto em agosto."
  };

  const saved = await appendRow("Conquistas", conquest);
  if (!saved) return false;

  appendCachedRow("Conquistas", conquest);
  return true;
}
