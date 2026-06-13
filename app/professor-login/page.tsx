import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfessorLoginForm } from "@/components/ProfessorLoginForm";
import {
  isProfessorTokenValid,
  PROFESSOR_COOKIE
} from "@/lib/auth/professorAuth";

export const metadata: Metadata = {
  title: "Acesso do Professor | Zumba do Cris"
};

export default async function ProfessorLoginPage() {
  const cookieStore = await cookies();
  if (isProfessorTokenValid(cookieStore.get(PROFESSOR_COOKIE)?.value)) {
    redirect("/professor");
  }

  return <ProfessorLoginForm />;
}
