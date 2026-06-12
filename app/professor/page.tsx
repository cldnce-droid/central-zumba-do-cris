import type { Metadata } from "next";
import { ProfessorDashboard } from "@/components/ProfessorDashboard";

export const metadata: Metadata = {
  title: "Dashboard do Professor | Zumba do Cris"
};

export default function ProfessorPage() {
  return <ProfessorDashboard />;
}
