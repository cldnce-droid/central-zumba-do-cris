import { createSign } from "node:crypto";
import type { SheetRow } from "./mappers";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

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

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function toSheetValue(value: unknown): SheetRow[string] {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return value == null ? null : String(value);
}

export function isGoogleSheetsConfigured() {
  return Boolean(
    process.env.GOOGLE_SHEETS_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
  );
}

async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) throw new Error("Google Sheets não configurado.");

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: email,
      scope: SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now
    })
  );
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${base64Url(signer.sign(privateKey))}`;
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    }),
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Falha ao autenticar no Google Sheets.");
  return (await response.json() as { access_token: string }).access_token;
}

async function sheetsRequest(path: string, init?: RequestInit) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) throw new Error("Google Sheets não configurado.");
  const token = await getAccessToken();
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init?.headers
      },
      cache: "no-store"
    }
  );
  if (!response.ok) throw new Error(`Google Sheets respondeu ${response.status}.`);
  return response.json();
}

export async function readSheet(sheetName: string): Promise<SheetRow[]> {
  const data = await sheetsRequest(
    `values/${encodeURIComponent(`${sheetName}!A:Z`)}`
  ) as { values?: unknown[][] };
  const [headers = [], ...rows] = data.values ?? [];
  return rows.map((row) =>
    Object.fromEntries(
      headers.map((header, index) => [
        String(header),
        toSheetValue(row[index])
      ])
    ) as SheetRow
  );
}

export async function appendRow(sheetName: string, data: SheetRow) {
  const rows = await readSheet(sheetName);
  const headers = rows.length
    ? Object.keys(rows[0])
    : Object.keys(data);
  return sheetsRequest(
    `values/${encodeURIComponent(`${sheetName}!A:Z`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({ values: [headers.map((key) => data[key] ?? "")] })
    }
  );
}

export async function updateRow(
  sheetName: string,
  rowId: string,
  updates: SheetRow
) {
  const data = await sheetsRequest(
    `values/${encodeURIComponent(`${sheetName}!A:Z`)}`
  ) as { values?: unknown[][] };
  const [headers = [], ...rows] = data.values ?? [];
  const idIndex = headers.findIndex((header) => String(header) === "id");
  const rowIndex = rows.findIndex((row) => String(row[idIndex]) === rowId);
  if (rowIndex < 0) throw new Error("Registro não encontrado.");
  const current = Object.fromEntries(
    headers.map((header, index) => [
      String(header),
      toSheetValue(rows[rowIndex][index])
    ])
  ) as SheetRow;
  const values = headers.map((header) => ({ ...current, ...updates })[String(header)] ?? "");
  return sheetsRequest(
    `values/${encodeURIComponent(`${sheetName}!A${rowIndex + 2}:Z${rowIndex + 2}`)}?valueInputOption=USER_ENTERED`,
    { method: "PUT", body: JSON.stringify({ values: [values] }) }
  );
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
