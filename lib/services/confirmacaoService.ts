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
      item.status === "confirmado"
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

  const [classesResponse, confirmationsResponse] = await Promise.all([
    readSheet("Aulas"),
    readSheet("Confirmacoes")
  ]);
  const classExists = classesResponse?.data.some(
    (item) => String(item.id) === aulaId
  );
  const duplicate = confirmationsResponse?.data.some(
    (item) =>
      item.alunoId === alunoId &&
      item.aulaId === aulaId &&
      item.status === "confirmado"
  );

  // A aula calculada no app precisa existir para o painel exibir seus detalhes.
  if (!classExists) await appendRow("Aulas", { ...aula });
  if (!duplicate) await appendRow("Confirmacoes", { ...confirmation });
  await syncGoogleSheetsData(["Aulas", "Confirmacoes"]);
  return confirmation;
}
