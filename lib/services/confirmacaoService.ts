import type { Aula, Confirmacao } from "@/lib/student-data";
import {
  appendRow,
  readSheet,
  syncGoogleSheetsData
} from "@/lib/services/googleSheetsService";

const STORAGE_KEY = "zdc_confirmacoes";

function readConfirmations(): Confirmacao[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveConfirmations(confirmations: Confirmacao[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(confirmations));
}

export function getConfirmacaoPorAlunoEAula(alunoId: string, aulaId: string) {
  return readConfirmations().find(
    (item) =>
      item.alunoId === alunoId &&
      item.aulaId === aulaId &&
      (item.status === "solicitada" || item.status === "aceita")
  );
}

export async function getConfirmacaoRemotaPorAlunoEAula(
  alunoId: string,
  aulaId: string
) {
  const response = await readSheet("Confirmacoes");
  return response?.data.find(
    (item) =>
      String(item.alunoId) === alunoId &&
      String(item.aulaId) === aulaId &&
      ["solicitada", "confirmado", "aceita"].includes(
        String(item.status || "solicitada").toLowerCase()
      )
  );
}

export function getConfirmacoesDoAluno(alunoId: string) {
  return readConfirmations().filter((item) => item.alunoId === alunoId);
}

export async function confirmarPresenca(alunoId: string, aula: Aula) {
  const aulaId = aula.id;
  const confirmations = readConfirmations();
  const existing = confirmations.find(
    (item) => item.alunoId === alunoId && item.aulaId === aulaId
  );

  const confirmation: Confirmacao = {
    id: existing?.id ?? `CONF_${alunoId}_${Date.now()}`,
    alunoId,
    aulaId,
    dataConfirmacao: new Date().toISOString(),
    status: "solicitada"
  };

  const confirmationsResponse = await readSheet("Confirmacoes");
  const duplicate = confirmationsResponse?.data.some(
    (item) =>
      item.alunoId === alunoId &&
      item.aulaId === aulaId &&
      (item.status === "solicitada" || item.status === "aceita")
  );

  if (!duplicate) {
    const saved = await appendRow("Confirmacoes", { ...confirmation });
    if (!saved) {
      throw new Error("Não foi possível registrar a solicitação.");
    }
  }

  const nextLocal = confirmations.filter(
    (item) => !(item.alunoId === alunoId && item.aulaId === aulaId)
  );
  saveConfirmations([...nextLocal, confirmation]);
  await syncGoogleSheetsData(["Confirmacoes"]);
  return confirmation;
}
