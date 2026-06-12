import { planos, turmas } from "@/lib/student-data/mockData";
import type {
  MetodoPagamento,
  PlanoCodigo
} from "@/lib/student-data/types";

export interface CadastroAlunoFormData {
  nome: string;
  whatsapp: string;
  email: string;
  turmaId: string;
  plano: PlanoCodigo | "";
  formaPagamento: MetodoPagamento | "";
  observacoes: string;
}

export interface AlunoPendente {
  id: string;
  nome: string;
  whatsapp: string;
  email: string;
  plano: PlanoCodigo;
  status: "pendente";
  dataEntrada: string;
  diaVencimento: null;
  turmaPrincipal: string;
  formaPagamento: MetodoPagamento;
  observacoes: string;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTurmasParaCadastro() {
  return turmas.filter((turma) => turma.ativa);
}

export function getPlanosParaCadastro() {
  return planos;
}

export function getPlanoCadastro(planoCodigo: PlanoCodigo) {
  return planos.find(
    (plano) => plano.aulasPorSemana === Number(planoCodigo.replace("x", ""))
  );
}

export function getTurmaCadastro(turmaId: string) {
  return turmas.find((turma) => turma.id === turmaId);
}

// Futuramente esta função será o ponto de envio para a aba Alunos.
export function createAlunoPendente(
  formData: CadastroAlunoFormData,
  now = new Date()
): AlunoPendente {
  const turma = getTurmaCadastro(formData.turmaId);

  if (!formData.plano || !formData.formaPagamento || !turma) {
    throw new Error("Dados obrigatórios do cadastro não foram informados.");
  }

  return {
    id: "ALU_TEMP_001",
    nome: formData.nome.trim(),
    whatsapp: formData.whatsapp.replace(/\D/g, ""),
    email: formData.email.trim(),
    plano: formData.plano,
    status: "pendente",
    dataEntrada: formatLocalDate(now),
    diaVencimento: null,
    turmaPrincipal: turma.nome,
    formaPagamento: formData.formaPagamento,
    observacoes: formData.observacoes.trim()
  };
}
