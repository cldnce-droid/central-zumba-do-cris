import { NextResponse } from "next/server";
import { clearProfessorSession } from "@/lib/auth/professorAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json(
    { authenticated: false },
    { headers: { "Cache-Control": "no-store" } }
  );
  clearProfessorSession(response);
  return response;
}
