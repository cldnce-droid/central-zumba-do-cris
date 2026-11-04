import { NextResponse } from "next/server";
import { appsScriptRequest } from "@/lib/google-sheets/server";

export async function GET() {
  try {
    const data = await appsScriptRequest("getAgendaParcerias") as { busy?: { start: string; end: string }[] };
    if (!Array.isArray(data?.busy) || data.busy.some(event => !Number.isFinite(Date.parse(event.start)) || !Number.isFinite(Date.parse(event.end)))) throw new Error("Invalid calendar response");
    return NextResponse.json({ busy: data.busy.map(({ start, end }) => ({ start, end })), checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Agenda temporariamente indisponível." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
