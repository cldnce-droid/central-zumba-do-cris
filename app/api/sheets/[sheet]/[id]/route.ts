import { NextRequest, NextResponse } from "next/server";
import {
  isGoogleSheetsConfigured,
  SHEET_NAMES,
  updateRow
} from "@/lib/google-sheets/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sheet: string; id: string }> }
) {
  const { sheet, id } = await context.params;
  if (!SHEET_NAMES.includes(sheet as (typeof SHEET_NAMES)[number])) {
    return NextResponse.json({ error: "Aba inválida." }, { status: 400 });
  }
  if (!isGoogleSheetsConfigured()) return NextResponse.json({ configured: false }, { status: 503 });
  try {
    const updates = await request.json();
    await updateRow(sheet, id, updates);
    return NextResponse.json({ configured: true, data: updates });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar a planilha." }, { status: 500 });
  }
}
