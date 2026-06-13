import type { Confirmacao } from "@/lib/student-data";
import { appendRow, readSheet } from "@/lib/services/googleSheetsService";

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
      item.status === "confirmado"
  );
}

export function getConfirmacoesDoAluno(alunoId: string) {
  return readConfirmations().filter((item) => item.alunoId === alunoId);
}

export async function confirmarPresenca(alunoId: string, aulaId: string) {
  const confirmations = readConfirmations();
  const existing = confirmations.find(
    (item) => item.alunoId === alunoId && item.aulaId === aulaId
  );

  let confirmation: Confirmacao;
  if (existing) {
    existing.status = "confirmado";
    existing.dataConfirmacao = new Date().toISOString();
    saveConfirmations(confirmations);
    confirmation = existing;
  } else {
    confirmation = {
      id: `CONF_TEMP_${Date.now()}`,
      alunoId,
      aulaId,
      dataConfirmacao: new Date().toISOString(),
      status: "confirmado"
    };
    saveConfirmations([...confirmations, confirmation]);
  }

  const response = await readSheet("Confirmacoes");
  const duplicate = response?.data.some(
    (item) =>
      item.alunoId === alunoId &&
      item.aulaId === aulaId &&
      item.status === "confirmado"
  );
  if (!duplicate) await appendRow("Confirmacoes", { ...confirmation });
  return confirmation;
}
