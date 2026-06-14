import type { SheetRow } from "./mappers";

export const SHEET_NAMES = [
  "Alunos",
  "Planos",
  "Turmas",
  "Aulas",
  "Confirmacoes",
  "Presencas",
  "Pagamentos",
  "Desafios"
] as const;

type SheetName = (typeof SHEET_NAMES)[number];

const readActions: Record<SheetName, string> = {
  Alunos: "getAlunos",
  Planos: "getPlanos",
  Turmas: "getTurmas",
  Aulas: "getAulas",
  Confirmacoes: "getConfirmacoes",
  Presencas: "getPresencas",
  Pagamentos: "getPagamentos",
  Desafios: "getDesafios"
};

const createActions: Record<SheetName, string> = {
  Alunos: "createAluno",
  Planos: "createPlano",
  Turmas: "createTurma",
  Aulas: "createAula",
  Confirmacoes: "createConfirmacao",
  Presencas: "upsertPresenca",
  Pagamentos: "upsertPagamento",
  Desafios: "createDesafio"
};

const updateActions: Record<SheetName, string> = {
  Alunos: "updateAluno",
  Planos: "updatePlano",
  Turmas: "updateTurma",
  Aulas: "updateAula",
  Confirmacoes: "updateConfirmacao",
  Presencas: "upsertPresenca",
  Pagamentos: "upsertPagamento",
  Desafios: "updateDesafio"
};

export function isGoogleSheetsConfigured() {
  return Boolean(
    process.env.GOOGLE_APPS_SCRIPT_URL &&
      process.env.GOOGLE_APPS_SCRIPT_SECRET
  );
}

function assertSheetName(sheetName: string): SheetName {
  if (!SHEET_NAMES.includes(sheetName as SheetName)) {
    throw new Error("Aba inválida.");
  }
  return sheetName as SheetName;
}

async function appsScriptRequest(
  action: string,
  data: SheetRow = {}
): Promise<unknown> {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET;

  if (!url || !secret) {
    console.info("Google Apps Script não configurado. Usando fallback.");
    throw new Error("Google Apps Script não configurado.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret, action, data }),
    cache: "no-store",
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script respondeu ${response.status}.`);
  }

  const result = await response.json() as {
    ok?: boolean;
    data?: unknown;
    error?: string;
  };

  if (!result.ok) {
    throw new Error(result.error || "Falha no Google Apps Script.");
  }

  return result.data;
}

export async function readSheet(sheetName: string): Promise<SheetRow[]> {
  const sheet = assertSheetName(sheetName);
  const data = await appsScriptRequest(readActions[sheet]);
  return Array.isArray(data) ? data as SheetRow[] : [];
}

export async function appendRow(sheetName: string, data: SheetRow) {
  const sheet = assertSheetName(sheetName);
  return appsScriptRequest(createActions[sheet], data);
}

export async function updateRow(
  sheetName: string,
  rowId: string,
  updates: SheetRow
) {
  const sheet = assertSheetName(sheetName);
  return appsScriptRequest(updateActions[sheet], { ...updates, id: rowId });
}

export async function findRowById(sheetName: string, id: string) {
  return (await readSheet(sheetName)).find((row) => String(row.id) === id);
}

export async function findRowsByField(
  sheetName: string,
  field: string,
  value: string
) {
  return (await readSheet(sheetName)).filter(
    (row) => String(row[field] ?? "") === value
  );
}
