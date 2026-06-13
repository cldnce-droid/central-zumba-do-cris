import { NextRequest, NextResponse } from "next/server";
import {
  isAdminPasswordConfigured,
  isValidAdminPassword,
  setProfessorSession
} from "@/lib/auth/professorAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      endpoint: "/api/admin/login",
      method: "POST",
      available: true,
      adminPasswordConfigured: isAdminPasswordConfigured()
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: NextRequest) {
  const configured = isAdminPasswordConfigured();
  console.info("Login professor - ADMIN_PASSWORD configurado:", configured);

  if (!configured) {
    console.error("ADMIN_PASSWORD não configurado no servidor");
    return NextResponse.json(
      { error: "Senha administrativa não configurada no servidor." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    console.info("Login professor - senha recebida:", false);
    return NextResponse.json(
      { error: "Requisição de login inválida." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  console.info("Login professor - senha recebida:", Boolean(password));
  const authenticated = Boolean(password) && isValidAdminPassword(password);
  console.info("Login professor - comparação correta:", authenticated);

  if (!authenticated) {
    return NextResponse.json(
      { error: "Senha incorreta." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const response = NextResponse.json(
    { authenticated: true },
    { headers: { "Cache-Control": "no-store" } }
  );
  setProfessorSession(response);
  console.info(
    "Login professor - cookie criado:",
    Boolean(response.cookies.get("zdc_professor_session")?.value)
  );
  return response;
}
