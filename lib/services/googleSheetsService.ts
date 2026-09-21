import type { SheetRow } from "@/lib/google-sheets/mappers";

export type SheetName =
  | "Alunos"
  | "Planos"
  | "Turmas"
  | "Aulas"
  | "Confirmacoes"
  | "Presencas"
  | "Pagamentos"
  | "Mensalidades"
  | "Desafios"
  | "Conquistas";

const CACHE_KEY = "zdc_google_sheets_cache";
const cacheVersions: Record<string, number> = {};
const pendingReads = new Map<string, Promise<SheetResponse | null>>();
type SheetResponse = { configured: boolean; data: SheetRow[]; fallback?: boolean };
type SheetsCache = Partial<Record<SheetName, SheetRow[]>>;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 20000
) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    // Keep the timeout active until the complete response has arrived.
    const body = await response.arrayBuffer();
    return new Response([204, 205, 304].includes(response.status) ? null : body, { status: response.status, statusText: response.statusText, headers: response.headers });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("A conexão demorou para responder. Atualize para conferir se a operação foi concluída antes de tentar novamente.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchSheet(sheetName: string, query?: {
  field: string;
  value: string;
}) {
  try {
    const params = query
      ? `?${new URLSearchParams(query).toString()}`
      : "";
    const response = await fetchWithTimeout(`/api/sheets/${sheetName}${params}`, {
      cache: "no-store"
    });
    if (!response.ok) return null;
    return await response.json() as {
      configured: boolean;
      data: SheetRow[];
      fallback?: boolean;
    };
  } catch {
    return null;
  }
}

export function readSheet(sheetName: string, query?: { field: string; value: string }) {
  const key = JSON.stringify([sheetName, query, cacheVersions[sheetName] ?? 0]);
  const pending = pendingReads.get(key);
  if (pending) return pending;
  const request = fetchSheet(sheetName, query).finally(() => pendingReads.delete(key));
  pendingReads.set(key, request);
  return request;
}

export function getCachedSheet(sheetName: SheetName) {
  if (typeof window === "undefined") return [];
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as SheetsCache;
    return cache[sheetName] ?? [];
  } catch {
    return [];
  }
}

export function updateCachedRow(
  sheetName: SheetName,
  id: string,
  updates: SheetRow
) {
  if (typeof window === "undefined") return;
  cacheVersions[sheetName] = (cacheVersions[sheetName] ?? 0) + 1;
  try {
    const cache = JSON.parse(
      localStorage.getItem(CACHE_KEY) ?? "{}"
    ) as SheetsCache;
    const rows = cache[sheetName] ?? [];
    cache[sheetName] = rows.map((row) =>
      String(row.id) === id ? { ...row, ...updates } : row
    );
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // A próxima sincronização remota recompõe o cache.
  }
}

export function replaceCachedSheet(sheetName: SheetName, rows: SheetRow[]) {
  if (typeof window === "undefined") return;
  cacheVersions[sheetName] = (cacheVersions[sheetName] ?? 0) + 1;
  try {
    const cache = JSON.parse(
      localStorage.getItem(CACHE_KEY) ?? "{}"
    ) as SheetsCache;
    cache[sheetName] = rows;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* Cache indisponível não invalida uma gravação remota. */ }
}

export function appendCachedRow(sheetName: SheetName, row: SheetRow) {
  if (typeof window === "undefined") return;
  const rows = getCachedSheet(sheetName).filter(
    (item) => String(item.id) !== String(row.id)
  );
  replaceCachedSheet(sheetName, [...rows, row]);
}

export async function syncGoogleSheetsData(
  sheetNames: SheetName[] = [
    "Alunos",
    "Planos",
    "Turmas",
    "Aulas",
    "Confirmacoes",
    "Presencas",
    "Conquistas"
  ],
  onProgress?: () => void
) {
  const results = await Promise.all([...new Set(sheetNames)].map(async sheetName => {
    const version = cacheVersions[sheetName] ?? 0;
    const response = await readSheet(sheetName);
    if (!response || response.configured === false || response.fallback) return false;
    if (typeof window === "undefined") return false;
    if ((cacheVersions[sheetName] ?? 0) !== version) return true;
    try {
      const current = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as SheetsCache;
      current[sheetName] = response.data;
      localStorage.setItem(CACHE_KEY, JSON.stringify(current));
    } catch { return false; }
    onProgress?.();
    return true;
  }));
  return results.every(Boolean);
}

export async function appendRow(sheetName: string, data: SheetRow) {
  try {
    const response = await fetchWithTimeout(`/api/sheets/${sheetName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (response.status === 401) throw new Error("Sua sessão expirou. Entre novamente na Área do Professor.");
    if (!response.ok) {
      const result = await response.json().catch(() => null) as {
        error?: string;
        detail?: string;
      } | null;
      throw new Error(result?.detail || result?.error || "Falha ao salvar.");
    }
    return true;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Falha ao conectar com a planilha.");
  }
}

export async function updateRow(
  sheetName: string,
  id: string,
  data: SheetRow
) {
  try {
    const response = await fetchWithTimeout(`/api/sheets/${sheetName}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (response.status === 401) throw new Error("Sua sessão expirou. Entre novamente na Área do Professor.");
    if (!response.ok) {
      const result = await response.json().catch(() => null) as {
        error?: string;
        detail?: string;
      } | null;
      throw new Error(result?.detail || result?.error || "Falha ao atualizar.");
    }
    return true;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Falha ao conectar com a planilha.");
  }
}

export async function deleteRow(sheetName: string, id: string) {
  try {
    const response = await fetchWithTimeout(`/api/sheets/${sheetName}/${id}`, {
      method: "DELETE"
    });
    if (response.status === 401) throw new Error("Sua sessão expirou. Entre novamente na Área do Professor.");
    if (!response.ok) {
      const result = await response.json().catch(() => null) as {
        error?: string;
        detail?: string;
      } | null;
      throw new Error(result?.detail || result?.error || "Falha ao excluir.");
    }
    return true;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Falha ao conectar com a planilha.");
  }
}
