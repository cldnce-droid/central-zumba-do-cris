import { fetchWithTimeout, appendCachedRow } from "@/lib/services/googleSheetsService";
import type { SheetRow } from "@/lib/google-sheets/mappers";
export type SeloStatus = "disponivel" | "solicitada" | "aprovada" | "recusada";
export interface SeloResult { status?: SeloStatus; conquista?: SheetRow; solicitacao?: SheetRow; }
export async function seloRequest<T = SeloResult>(data: Record<string, unknown>): Promise<T> {
  const response = await fetchWithTimeout("/api/desafios", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Não foi possível acessar os selos.");
  if (result.data?.conquista) appendCachedRow("Conquistas", result.data.conquista);
  return result.data as T;
}
