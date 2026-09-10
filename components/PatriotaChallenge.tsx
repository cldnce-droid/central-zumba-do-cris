"use client";
import { useEffect, useState } from "react";
import { seloRequest, type SeloStatus } from "@/lib/services/selosService";

export function PatriotaChallenge({ alunoId, whatsapp, onAwarded }: { alunoId: string; whatsapp: string; onAwarded: () => void }) {
  const [status, setStatus] = useState<SeloStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function load(acao: "consultar" | "solicitar") {
    setBusy(true); setError("");
    try { const result = await seloRequest({ acao, alunoId, whatsapp }); setStatus(result.status ?? "disponivel"); if (result.conquista) onAwarded(); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível consultar o selo."); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load("consultar"); }, [alunoId, whatsapp]);
  return <article className="mt-4 rounded-lg border-2 border-emerald-600/20 bg-gradient-to-br from-emerald-50 via-white to-yellow-100 p-5 shadow-pop">
    <p className="text-sm font-black text-emerald-800">7 de setembro de 2026 · Aulão especial</p>
    <h3 className="mt-2 text-2xl font-black text-cris-navy">🇧🇷 Desafio Patriota</h3>
    <p className="mt-3 font-bold text-cris-navy/70">Esteve no nosso aulão especial de 7 de setembro? Solicite seu selo de participação. O Cris vai conferir e aprovar.</p>
    <p role="status" className="mt-4 font-black">{status === "aprovada" ? "Selo Patriota conquistado!" : status === "solicitada" ? "Solicitação enviada. Aguardando aprovação do Cris." : status === "recusada" ? "Solicitação não aprovada. Fale com o Cris se precisar corrigir." : ""}</p>
    {error && <p role="alert" className="mt-3 font-bold text-cris-pink">{error}</p>}
    {status === "disponivel" && <button type="button" disabled={busy} onClick={() => load("solicitar")} className="mt-4 min-h-12 rounded-lg bg-emerald-700 px-5 py-3 font-black text-white disabled:opacity-50">{busy ? "Enviando..." : "Participei · Solicitar selo"}</button>}
    {status !== "aprovada" && <button type="button" disabled={busy} onClick={() => load("consultar")} className="mt-3 min-h-11 px-3 font-bold underline disabled:opacity-50">{busy ? "Consultando..." : "Atualizar situação do selo"}</button>}
  </article>;
}
