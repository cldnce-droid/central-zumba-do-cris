"use client";
import { useState } from "react";
import { atualizarStatusPagamento } from "@/lib/services/professorService";
import type { PagamentoStatus } from "@/lib/student-data";

// Shared lock covers the same student shown in both list and detail.
const savingStudents = new Set<string>();
export function PaymentStatusButton({ alunoId, nome, status, onSaved }: {
  alunoId: string; nome: string; status: PagamentoStatus; onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [undo, setUndo] = useState<PagamentoStatus | null>(null);
  async function save(next: PagamentoStatus) {
    if (savingStudents.has(alunoId)) return;
    savingStudents.add(alunoId); setSaving(true); setMessage("");
    try {
      await atualizarStatusPagamento(alunoId, next);
      setUndo(status); setMessage(`${nome}: ${next === "pago" ? "pago" : "atrasado"} salvo.`); onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar. Tente novamente.");
    } finally { savingStudents.delete(alunoId); setSaving(false); }
  }
  return <div className="mt-3">
    <button type="button" aria-label={`${status === "pago" ? "Marcar como atrasado" : "Marcar como pago"}: ${nome}`} disabled={saving}
      className={`min-h-12 w-full rounded-lg px-4 py-3 text-sm font-black disabled:opacity-50 ${status === "pago" ? "border-2 border-emerald-600 bg-white text-emerald-800" : "bg-emerald-600 text-white"}`}
      onClick={() => save(status === "pago" ? "atrasado" : "pago")}>
      {saving ? "Salvando..." : status === "pago" ? "✓ Pago · Marcar atrasado" : "Marcar como pago"}
    </button>
    {message && <p role="status" className="mt-2 text-sm font-bold">{message}</p>}
    {undo && <button type="button" disabled={saving} onClick={() => save(undo)} className="min-h-11 px-2 text-sm font-bold underline">Desfazer alteração</button>}
  </div>;
}
