import { NextRequest, NextResponse } from "next/server";
import { isProfessorRequestAuthenticated } from "@/lib/auth/professorAuth";
import {
  appendRow,
  isGoogleSheetsConfigured,
  readSheet,
  SHEET_NAMES
} from "@/lib/google-sheets/server";

function validSheet(sheet: string) {
  return SHEET_NAMES.includes(sheet as (typeof SHEET_NAMES)[number]);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sheet: string }> }
) {
  const { sheet } = await context.params;
  if (!validSheet(sheet)) {
    return NextResponse.json({ error: "Aba inválida." }, { status: 400 });
  }
  if (!isGoogleSheetsConfigured()) {
    return NextResponse.json({ configured: false, data: [] });
  }

  try {
    const field = request.nextUrl.searchParams.get("field");
    const value = request.nextUrl.searchParams.get("value");
    const rows = await readSheet(sheet);
    const data =
      field && value !== null
        ? rows.filter((row) => String(row[field] ?? "") === value)
        : rows;
    if (sheet === "Alunos") {
      console.info("Dashboard carregou total de alunos:", data.length);
    }
    return NextResponse.json({ configured: true, data });
  } catch {
    return NextResponse.json({ configured: true, data: [], fallback: true });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sheet: string }> }
) {
  const { sheet } = await context.params;
  if (!validSheet(sheet)) {
    return NextResponse.json({ error: "Aba inválida." }, { status: 400 });
  }

  const publicWriteSheets = new Set(["Alunos", "Confirmacoes", "Mensalidades"]);
  if (
    !publicWriteSheets.has(sheet) &&
    !isProfessorRequestAuthenticated(request)
  ) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!isGoogleSheetsConfigured()) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }

  try {
    const data = await request.json();
    if (sheet === "Alunos") {
      console.info("Cadastro recebido:", Boolean(data));
      console.info("Tentativa de salvar em Alunos:", true);
    }
    await appendRow(sheet, data);
    if (sheet === "Alunos") {
      console.info("Aluno salvo com id:", String(data.id ?? "sem-id"));
    }
    return NextResponse.json({ configured: true, data }, { status: 201 });
  } catch (error) {
    if (sheet === "Alunos") {
      console.error("Falha ao salvar cadastro em Alunos:", error);
    }
    return NextResponse.json(
      { error: "Não foi possível salvar na planilha." },
      { status: 500 }
    );
  }
}
