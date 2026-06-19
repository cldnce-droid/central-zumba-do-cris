import type { SheetRow } from "@/lib/google-sheets/mappers";

export type SheetName =
  | "Alunos"
  | "Planos"
  | "Turmas"
  | "Aulas"
  | "Confirmacoes"
  | "Presencas"
  | "Pagamentos"
  | "Desafios"
  | "Conquistas";

const CACHE_KEY = "zdc_google_sheets_cache";
type SheetsCache = Partial<Record<SheetName, SheetRow[]>>;

export async function readSheet(sheetName: string, query?: {
  field: string;
  value: string;
}) {
  try {
    const params = query
      ? `?${new URLSearchParams(query).toString()}`
      : "";
    const response = await fetch(`/api/sheets/${sheetName}${params}`, {
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

export async function syncGoogleSheetsData(
  sheetNames: SheetName[] = [
    "Alunos",
    "Planos",
    "Turmas",
    "Aulas",
    "Confirmacoes",
    "Presencas",
    "Conquistas"
  ]
) {
  const results = await Promise.all(
    sheetNames.map(async (sheetName) => {
      const response = await readSheet(sheetName);
      return { sheetName, response };
    })
  );

  if (typeof window !== "undefined") {
    let currentCache: SheetsCache = {};
    try {
      currentCache = JSON.parse(
        localStorage.getItem(CACHE_KEY) ?? "{}"
      ) as SheetsCache;
    } catch {
      currentCache = {};
    }

    const successfulResults = results.filter(
      ({ response }) => response && !response.fallback
    );

    if (!successfulResults.length) return false;

    const nextCache = { ...currentCache };
    successfulResults.forEach(({ sheetName, response }) => {
      nextCache[sheetName] = response?.data ?? [];
    });

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(nextCache)
    );

    return true;
  }

  return false;
}

export async function appendRow(sheetName: string, data: SheetRow) {
  try {
    const response = await fetch(`/api/sheets/${sheetName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function updateRow(
  sheetName: string,
  id: string,
  data: SheetRow
) {
  try {
    const response = await fetch(`/api/sheets/${sheetName}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return response.ok;
  } catch {
    return false;
  }
}
