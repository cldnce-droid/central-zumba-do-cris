"use client";
import { useEffect, useState } from "react";
import type { SheetRow } from "@/lib/google-sheets/mappers";
import { getCachedSheet, syncGoogleSheetsData } from "@/lib/services/googleSheetsService";
import { seloRequest } from "@/lib/services/selosService";
import type { getAlunosProfessor } from "@/lib/services/professorService";

export function ProfessorChallenges({ students }: { students: ReturnType<typeof getAlunosProfessor> }) {
  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selo, setSelo] = useState("sofa");
  const [motivo, setMotivo] = useState("");
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  async function reload() {
    setLoading(true); setLoadError("");
    try {
      const [requests, synced] = await Promise.all([
        seloRequest<SheetRow[]>({ acao: "listar" }), syncGoogleSheetsData(["Conquistas"])
      ]);
      setRows(requests); setRevision(v => v + 1);
      if (!synced) setLoadError("Não foi possível atualizar os selos concedidos. Tente atualizar novamente.");
    } catch (error) { setLoadError(error instanceof Error ? error.message : "Falha ao carregar solicitações."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void reload(); }, []);
  const selected = students.find(s => s.id === studentId);
  const titles: Record<string, string> = { sofa: "Venci o Sofá", patriota: "Patriota" };
  const awarded = getCachedSheet("Conquistas").some(r => String(r.alunoId) === studentId && String(r.titulo).toLowerCase() === titles[selo].toLowerCase());
  const matches = students.filter(s => query.trim() && `${s.nome} ${s.whatsapp}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 30);
  async function decide(id: string, aprovar: boolean) {
    if (busy) return; setBusy(id); setFeedback("");
    try {
      const result = await seloRequest({ acao: "decidir", id, aprovar });
      setRows(current => current.map(r => String(r.id) === id ? { ...r, status: result.status ?? r.status } : r));
      setRevision(v => v + 1); setFeedback(result.status === "aprovada" ? "Selo Patriota aprovado e concedido." : "Solicitação recusada.");
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Falha ao salvar."); }
    finally { setBusy(""); }
  }
  const pending = rows.filter(r => r.status === "solicitada");
  return <section className="grid gap-5" data-revision={revision}>
    <div className="rounded-lg bg-white p-5 shadow-pop">
      <h2 className="text-2xl font-black text-cris-navy">Desafios e selos</h2>
      <p className="mt-2 font-bold text-cris-navy/65">Reconheça a constância e os momentos especiais das alunas. Conceder um selo não altera presença nem pagamento.</p>
      <p className="mt-3 font-bold">🛋️ Venci o Sofá — desafio de agosto · 🇧🇷 Patriota — aulão de 7 de setembro de 2026</p>
      <button type="button" disabled={loading || !!busy} onClick={reload} className="mt-3 min-h-11 rounded-lg border-2 border-cris-blue px-4 font-bold">{loading ? "Atualizando..." : "Atualizar desafios"}</button>
      {loadError && <p role="alert" className="mt-3 font-bold text-cris-pink">{loadError}</p>}
      {feedback && <p role="status" className="mt-3 font-bold">{feedback}</p>}
    </div>
    <div className="rounded-lg bg-white p-5 shadow-pop">
      <h3 className="text-xl font-black">Conceder selo a uma aluna</h3>
      <label className="mt-4 block font-bold">Buscar aluna<input type="search" className="mt-2 min-h-12 w-full rounded-lg border-2 p-3" placeholder="Nome ou WhatsApp" value={query} onChange={e => { setQuery(e.target.value); setStudentId(""); }} /></label>
      <div className="mt-2 grid gap-2">{matches.map(s => <button key={s.id} type="button" aria-pressed={studentId === s.id} className={`min-h-12 rounded-lg border-2 p-3 text-left font-bold ${studentId === s.id ? "border-cris-blue bg-blue-50" : "border-cris-navy/10"}`} onClick={() => setStudentId(s.id)}>{s.nome} · {s.whatsapp}</button>)}</div>
      {query && !matches.length && <p className="mt-2">Nenhuma aluna encontrada.</p>}
      <label className="mt-4 block font-bold">Selo<select className="mt-2 min-h-12 w-full rounded-lg border-2 p-3" value={selo} onChange={e => setSelo(e.target.value)}><option value="sofa">Venci o Sofá — agosto</option><option value="patriota">Patriota — 7 de setembro</option></select></label>
      <label className="mt-4 block font-bold">Observação (opcional)<input maxLength={300} className="mt-2 min-h-12 w-full rounded-lg border-2 p-3" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex.: correção de selo de agosto" /></label>
      {selected && <p className="mt-3 font-bold">{selected.nome} · {titles[selo]} {awarded ? "— já concedido" : ""}</p>}
      <button type="button" disabled={!selected || !!busy || loading || awarded} className="mt-4 min-h-12 rounded-lg bg-cris-purple px-5 py-3 font-black text-white disabled:opacity-50" onClick={async () => {
        if (!selected || busy) return; setBusy("manual"); setFeedback("");
        try { await seloRequest({ acao: "conceder", alunoId: selected.id, selo, motivo }); setRevision(v => v + 1); setFeedback(`${titles[selo]} concedido a ${selected.nome}.`); }
        catch (error) { setFeedback(error instanceof Error ? error.message : "Falha ao conceder selo."); }
        finally { setBusy(""); }
      }}>{busy === "manual" ? "Salvando selo..." : "Conceder selo"}</button>
    </div>
    <div className="rounded-lg bg-white p-5 shadow-pop">
      <h3 className="text-xl font-black">Pedidos do Patriota ({pending.length})</h3>
      <p className="mt-2">Aprove somente quem participou do aulão especial de 7 de setembro.</p>
      {!loading && !loadError && !pending.length && <p className="mt-4">Nenhuma solicitação pendente.</p>}
      {pending.map(row => <article key={String(row.id)} className="mt-4 rounded-lg bg-cris-paper p-4">
        <p className="font-black">{String(row.nomeAluno)}</p><p>{String(row.whatsapp)}</p>
        <div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={!!busy || loading} className="min-h-12 rounded-lg bg-emerald-600 px-5 font-black text-white disabled:opacity-50" onClick={() => decide(String(row.id), true)}>{busy === row.id ? "Salvando..." : "Aprovar selo"}</button><button type="button" disabled={!!busy || loading} className="min-h-12 rounded-lg border-2 border-cris-pink px-5 font-bold disabled:opacity-50" onClick={() => decide(String(row.id), false)}>Recusar</button></div>
      </article>)}
      <details className="mt-5"><summary className="min-h-11 cursor-pointer font-bold">Pedidos já analisados</summary>{rows.filter(r => r.status !== "solicitada").map(row => <p key={String(row.id)} className="mt-2">{String(row.nomeAluno)} — {row.status === "aprovada" ? "Aprovado" : "Recusado"}</p>)}</details>
    </div>
  </section>;
}
