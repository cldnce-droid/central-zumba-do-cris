import type { Metadata } from "next";
import { StudentRegistrationForm } from "@/components/StudentRegistrationForm";

export const metadata: Metadata = {
  title: "Cadastro do Aluno | Zumba do Cris",
  description: "Cadastre-se para fazer parte da Central Zumba do Cris."
};

export default function CadastroPage() {
  return <StudentRegistrationForm />;
}
