import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfessorDashboard } from "@/components/ProfessorDashboard";
import {
  isProfessorTokenValid,
  PROFESSOR_COOKIE
} from "@/lib/auth/professorAuth";

export const metadata: Metadata = {
  title: "Dashboard do Professor | Zumba do Cris"
};

export default async function ProfessorPage() {
  const cookieStore = await cookies();
  if (!isProfessorTokenValid(cookieStore.get(PROFESSOR_COOKIE)?.value)) {
    redirect("/professor-login");
  }

  return <ProfessorDashboard />;
}
