"use client";
import { useEffect, useRef, useState } from "react";
import type { SheetRow } from "@/lib/google-sheets/mappers";
import { getCachedSheet, syncGoogleSheetsData } from "@/lib/services/googleSheetsService";
import { seloRequest } from "@/lib/services/selosService";
import type { getAlunosProfessor } from "@/lib/services/professorService";

export function ProfessorChallenges({ students }: { students: ReturnType<typeof getAlunosProfessor> }) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const sending = useRef(false);
  const [progress, setProgress] = useState("");
  const [failures, setFailures] = useState<string[]>([]);
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
  const titles: Record<string, string> = { sofa: "Venci o Sofá", patriota: "Patriota" };
  const awardedIds = new Set(getCachedSheet("Conquistas")
    .filter(r => String(r.titulo).toLowerCase() === titles[selo].toLowerCase())
    .map(r => String(r.alunoId)));
  const matches = students.filter(s => `${s.nome} ${s.whatsapp}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = students.filter(s => selectedIds.includes(s.id) && !awardedIds.has(s.id));
  const available = matches.filter(s => !awardedIds.has(s.id));
  function toggle(id: string) {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  }
  async function grantSelected() {
    if (sending.current || busy || !selected.length) return;
    sending.current = true; setBusy("manual"); setFeedback(""); setFailures([]);
    const batch = [...selected];
    const errors: string[] = [];
    let saved = 0;
    try {
      // Reuse the existing, idempotent endpoint without flooding Apps Script.
      for (const [index, student] of batch.entries()) {
        setProgress(`Salvando ${index + 1} de ${batch.length}: ${student.nome}`);
        try {
          await seloRequest({ acao: "conceder", alunoId: student.id, selo, motivo });
          saved++;
          setSelectedIds(ids => ids.filter(id => id !== student.id));
          if (selo === "patriota") setRows(rows => rows.map(row => String(row.alunoId) === student.id ? { ...row, status: "aprovada" } : row));
          setRevision(v => v + 1);
        } catch (error) {
          errors.push(`${student.nome}: ${error instanceof Error ? error.message : "Falha ao conceder selo."}`);
          // Preserve unprocessed selections when the professor needs to log in again.
          if (error instanceof Error && error.message.includes("sessão expirou")) break;
        }
      }
      setFailures(errors);
      setFeedback(`${titles[selo]}: ${saved} de ${batch.length} concessões confirmadas.${saved < batch.length ? " As alunas não confirmadas continuam selecionadas para tentar novamente." : ""}`);
    } finally { sending.current = false; setBusy(""); setProgress(""); }
  }
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
      <h3 className="text-xl font-black">Conceder selo às alunas</h3>
      <label className="mt-4 block font-bold">Selo<select disabled={!!busy} className="mt-2 min-h-12 w-full rounded-lg border-2 p-3" value={selo} onChange={e => { setSelo(e.target.value); setFailures([]); setFeedback(""); }}><option value="sofa">Venci o Sofá — agosto</option><option value="patriota">Patriota — 7 de setembro</option></select></label>
      <label className="mt-4 block font-bold">Buscar aluna<input disabled={!!busy} type="search" className="mt-2 min-h-12 w-full rounded-lg border-2 p-3" placeholder="Nome ou WhatsApp" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <p className="mt-2 text-sm">Você pode mudar a busca sem perder as alunas selecionadas.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" disabled={!!busy || loading || !available.length} className="min-h-11 rounded-lg border-2 border-cris-blue px-3 font-bold disabled:opacity-50" onClick={() => setSelectedIds(ids => [...new Set([...ids, ...available.map(s => s.id)])])}>Selecionar resultados ({available.length})</button>
        <button type="button" disabled={!!busy || !selectedIds.length} className="min-h-11 px-3 font-bold underline disabled:opacity-50" onClick={() => setSelectedIds([])}>Limpar seleção</button>
      </div>
      <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto">{matches.map(s => <label key={s.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border-2 p-3 font-bold ${selectedIds.includes(s.id) && !awardedIds.has(s.id) ? "border-cris-blue bg-blue-50" : "border-cris-navy/10"}`}>
        <input type="checkbox" className="size-5 shrink-0" disabled={!!busy || loading || awardedIds.has(s.id)} checked={selectedIds.includes(s.id) && !awardedIds.has(s.id)} onChange={() => toggle(s.id)} />
        <span>{s.nome} · {s.whatsapp}{awardedIds.has(s.id) ? " — selo já concedido" : ""}</span>
      </label>)}</div>
      {!matches.length && <p className="mt-2">Nenhuma aluna encontrada.</p>}
      <p className="mt-3 font-bold" role="status">{selected.length} selecionada(s) para receber {titles[selo]}</p>
      {!!selected.length && <p className="mt-2 text-sm">{selected.map(s => s.nome).join(", ")}</p>}
      <label className="mt-4 block font-bold">Observação (opcional)<input disabled={!!busy} maxLength={300} className="mt-2 min-h-12 w-full rounded-lg border-2 p-3" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex.: correção de selo de agosto" /></label>
      <button type="button" disabled={!selected.length || !!busy || loading} className="mt-4 min-h-12 rounded-lg bg-cris-purple px-5 py-3 font-black text-white disabled:opacity-50" onClick={grantSelected}>{busy === "manual" ? "Salvando selos..." : `Conceder selo (${selected.length})`}</button>
      {progress && <p role="status" className="mt-3 font-bold">{progress} · Aguarde nesta aba até concluir.</p>}
      {feedback && <p role="status" className="mt-3 font-bold">{feedback}</p>}
      {!!failures.length && <ul role="alert" className="mt-3 list-inside list-disc text-sm text-cris-pink">{failures.map((message, index) => <li key={index}>{message}</li>)}</ul>}

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
