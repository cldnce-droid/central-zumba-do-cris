import { pixKey } from "@/lib/data";
import { sheetRowToMensalidade } from "@/lib/google-sheets/mappers";
import {
  appendCachedRow,
  appendRow,
  getCachedSheet,
  syncGoogleSheetsData,
  updateCachedRow,
  updateRow
} from "@/lib/services/googleSheetsService";
import { getAlunoById, getPlanoByAluno } from "@/lib/services/alunoService";
import type { Mensalidade, MensalidadeStatus } from "@/lib/student-data";

const MENSALIDADES_KEY = "zdc_mensalidades";

function localDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

export function getMesReferencia(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0")
  ].join("-");
}

function readLocalMensalidades() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(MENSALIDADES_KEY) ?? "[]") as Mensalidade[];
  } catch {
    return [];
  }
}

function saveLocalMensalidade(mensalidade: Mensalidade) {
  if (typeof window === "undefined") return;
  const rows = readLocalMensalidades().filter((item) => item.id !== mensalidade.id);
  localStorage.setItem(MENSALIDADES_KEY, JSON.stringify([...rows, mensalidade]));
}

function normalizeStatus(mensalidade: Mensalidade): Mensalidade {
  if (mensalidade.status === "pago" || mensalidade.status === "comprovante_enviado") {
    return mensalidade;
  }

  const today = localDateKey();
  return {
    ...mensalidade,
    status: today > mensalidade.vencimento ? "atrasado" : "em_aberto"
  };
}

export function getMensalidades() {
  const remote = getCachedSheet("Mensalidades").map(sheetRowToMensalidade);
  const source = remote.length ? remote : readLocalMensalidades();
  return source.map(normalizeStatus);
}

export function criarMensalidadeDoMes(alunoId: string, date = new Date()) {
  const aluno = getAlunoById(alunoId);
  const plano = getPlanoByAluno(alunoId);
  if (!aluno) return null;

  const mesReferencia = getMesReferencia(date);
  const existing = getMensalidades().find(
    (item) => item.alunoId === alunoId && item.mesReferencia === mesReferencia
  );
  if (existing) return normalizeStatus(existing);

  const mensalidade: Mensalidade = {
    id: `MEN_${mesReferencia.replace("-", "_")}_${alunoId}`,
    alunoId,
    nome: aluno.nome,
    whatsapp: aluno.whatsapp,
    mesReferencia,
    plano: aluno.plano,
    valor: plano?.valor ?? 0,
    vencimento: `${mesReferencia}-08`,
    status: date.getDate() > 8 ? "atrasado" : "em_aberto",
    dataPagamento: null,
    dataComprovante: null,
    metodo: aluno.formaPagamento ?? "pix",
    observacao: ""
  };

  return mensalidade;
}

export function getMensalidadeAtualDoAluno(alunoId: string) {
  return criarMensalidadeDoMes(alunoId);
}

export async function copiarPixMensalidade(alunoId: string) {
  const mensalidade = criarMensalidadeDoMes(alunoId);
  if (!mensalidade) return null;

  await navigator.clipboard.writeText(pixKey);

  const saved = await appendRow("Mensalidades", { ...mensalidade });
  if (!saved) {
    throw new Error("Nao foi possivel registrar a mensalidade na planilha.");
  }

  saveLocalMensalidade(mensalidade);
  appendCachedRow("Mensalidades", { ...mensalidade });
  void syncGoogleSheetsData(["Mensalidades"]);

  return mensalidade;
}

export async function enviarComprovanteMensalidade(alunoId: string) {
  const mensalidade = criarMensalidadeDoMes(alunoId);
  if (!mensalidade) return null;

  const updated: Mensalidade = {
    ...mensalidade,
    status: "comprovante_enviado",
    dataComprovante: new Date().toISOString(),
    observacao: "Comprovante enviado pela aluna"
  };

  const saved = await appendRow("Mensalidades", { ...updated });
  if (!saved) {
    throw new Error("Nao foi possivel enviar o comprovante para a planilha.");
  }

  saveLocalMensalidade(updated);
  appendCachedRow("Mensalidades", { ...updated });
  void syncGoogleSheetsData(["Mensalidades"]);

  return updated;
}

export async function atualizarMensalidadeStatus(
  mensalidadeId: string,
  status: MensalidadeStatus
) {
  const existing = getMensalidades().find((item) => item.id === mensalidadeId);
  if (!existing) return null;

  const updated: Mensalidade = {
    ...existing,
    status,
    dataPagamento: status === "pago" ? localDateKey() : existing.dataPagamento,
    observacao: status === "pago" ? "Pagamento aprovado pelo professor" : existing.observacao
  };

  saveLocalMensalidade(updated);
  updateCachedRow("Mensalidades", mensalidadeId, { ...updated });
  const saved = await updateRow("Mensalidades", mensalidadeId, { ...updated });
  if (!saved) throw new Error("Nao foi possivel atualizar a mensalidade.");
  void syncGoogleSheetsData(["Mensalidades"]);
  return updated;
}
