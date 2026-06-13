import { NextRequest, NextResponse } from "next/server";
import {
  isAdminPasswordConfigured,
  isValidAdminPassword,
  setProfessorSession
} from "@/lib/auth/professorAuth";

export async function POST(request: NextRequest) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { error: "Senha administrativa não configurada." },
      { status: 503 }
    );
  }

  const { password } = (await request.json()) as { password?: string };
  if (!password || !isValidAdminPassword(password)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  setProfessorSession(response);
  return response;
}
