import { NextRequest, NextResponse } from "next/server";
import {
  isAdminPasswordConfigured,
  isValidAdminPassword,
  setProfessorSession
} from "@/lib/auth/professorAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAdminPasswordConfigured()) {
    console.error("ADMIN_PASSWORD não configurado no servidor");
    return NextResponse.json(
      { error: "Senha administrativa não configurada no servidor." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }

  const { password } = (await request.json()) as { password?: string };
  if (!password || !isValidAdminPassword(password)) {
    return NextResponse.json(
      { error: "Senha incorreta." },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }

  const response = NextResponse.json(
    { authenticated: true },
    { headers: { "Cache-Control": "no-store" } }
  );
  setProfessorSession(response);
  return response;
}
