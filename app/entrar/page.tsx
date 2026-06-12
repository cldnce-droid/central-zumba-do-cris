import type { Metadata } from "next";
import { StudentLogin } from "@/components/StudentLogin";

export const metadata: Metadata = {
  title: "Entrar na Minha Área | Zumba do Cris"
};

export default function EntrarPage() {
  return <StudentLogin />;
}
