import { NextResponse } from "next/server";
import { clearProfessorSession } from "@/lib/auth/professorAuth";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  clearProfessorSession(response);
  return response;
}
