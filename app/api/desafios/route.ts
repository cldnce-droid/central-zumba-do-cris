import type { SheetRow } from "@/lib/google-sheets/mappers";
import { NextRequest, NextResponse } from "next/server";
import { isProfessorRequestAuthenticated } from "@/lib/auth/professorAuth";
import { appsScriptRequest } from "@/lib/google-sheets/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const actions: Record<string, string> = {
      consultar: "consultarSeloPatriota", solicitar: "solicitarSeloPatriota",
      listar: "listarSolicitacoesSelos", conceder: "concederSelo", decidir: "decidirSelo"
    };
    const action = actions[data.acao];
    if (!action) return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    if (!["consultar", "solicitar"].includes(data.acao) && !isProfessorRequestAuthenticated(request)) {
      return NextResponse.json({ error: "Sua sessão expirou. Entre novamente na Área do Professor." }, { status: 401 });
    }
    // Do not forward status, title or arbitrary sheet fields from the client.
    const payload: SheetRow = ["consultar", "solicitar"].includes(data.acao)
      ? { alunoId: String(data.alunoId ?? ""), whatsapp: String(data.whatsapp ?? "") }
      : data.acao === "conceder"
        ? { alunoId: String(data.alunoId ?? ""), selo: String(data.selo ?? ""), motivo: String(data.motivo ?? "").slice(0, 300) }
        : { id: String(data.id ?? ""), aprovar: data.aprovar === true };
    return NextResponse.json({ data: await appsScriptRequest(action, payload) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível salvar o selo." }, { status: 500 });
  }
}
