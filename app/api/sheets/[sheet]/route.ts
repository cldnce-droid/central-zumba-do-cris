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
    return NextResponse.json({ error: "Aba invalida." }, { status: 400 });
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
  } catch (error) {
    return NextResponse.json({
      configured: true,
      data: [],
      fallback: true,
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sheet: string }> }
) {
  const { sheet } = await context.params;
  if (!validSheet(sheet)) {
    return NextResponse.json({ error: "Aba invalida." }, { status: 400 });
  }

  const publicWriteSheets = new Set(["Alunos", "Confirmacoes", "Mensalidades"]);
  if (
    !publicWriteSheets.has(sheet) &&
    !isProfessorRequestAuthenticated(request)
  ) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }
  if (!isGoogleSheetsConfigured()) {
    return NextResponse.json(
      {
        error: "Google Apps Script nao configurado.",
        detail: "Confira GOOGLE_APPS_SCRIPT_URL e GOOGLE_APPS_SCRIPT_SECRET na Vercel."
      },
      { status: 503 }
    );
  }

  try {
    const data = await request.json();

    if (sheet === "Alunos") {
      console.info("Cadastro recebido:", Boolean(data));
      console.info("Tentativa de salvar em Alunos:", true);
    }
    if (sheet === "Mensalidades") {
      console.info("Tentativa de salvar em Mensalidades:", true);
      console.info("Mensalidade recebida com id:", String(data.id ?? "sem-id"));
    }

    await appendRow(sheet, data);

    if (sheet === "Alunos") {
      console.info("Aluno salvo com id:", String(data.id ?? "sem-id"));
    }

    return NextResponse.json({ configured: true, data }, { status: 201 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);

    if (sheet === "Alunos") {
      console.error("Falha ao salvar cadastro em Alunos:", detail);
    }
    if (sheet === "Mensalidades") {
      console.error("Falha ao salvar em Mensalidades:", detail);
    }

    return NextResponse.json(
      {
        error: "Nao foi possivel salvar na planilha.",
        detail
      },
      { status: 500 }
    );
  }
}
