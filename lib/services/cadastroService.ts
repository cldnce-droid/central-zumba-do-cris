import { planos, turmas } from "@/lib/student-data/mockData";
import {
  getOfficialPlan,
  getRegistrationLocationCount,
  isPremiumPlan
} from "@/lib/student-data/catalog";
import type {
  MetodoPagamento,
  PlanoCodigo
} from "@/lib/student-data/types";
import { alunoToSheetRow } from "@/lib/google-sheets/mappers";
import { appendRow, readSheet } from "@/lib/services/googleSheetsService";

export interface CadastroAlunoFormData {
  nome: string;
  whatsapp: string;
  email: string;
  turmaIds: string[];
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
  statusCadastro: "pendente";
  statusPagamento?: "pago" | "atrasado";
  dataEntrada: string;
  diaVencimento: null;
  turmasEscolhidas: string[];
  turmaPrincipal: string;
  formaPagamento: MetodoPagamento;
  observacoes: string;
}

const ALUNOS_PENDENTES_KEY = "zdc_alunos_cadastrados";

function readLocalStudents(): AlunoPendente[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(
      localStorage.getItem(ALUNOS_PENDENTES_KEY) ?? "[]"
    ) as AlunoPendente[];
  } catch {
    return [];
  }
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
  return getOfficialPlan(planoCodigo);
}

export function getTurmaCadastro(turmaId: string) {
  return turmas.find((turma) => turma.id === turmaId);
}

export function createAlunoPendente(
  formData: CadastroAlunoFormData,
  now = new Date()
): AlunoPendente {
  const turmasSelecionadas = formData.turmaIds
    .map(getTurmaCadastro)
    .filter((turma) => turma !== undefined);
  const limiteDeLocais = formData.plano
    ? getRegistrationLocationCount(formData.plano)
    : 0;
  const quantidadeValida =
    formData.plano &&
    (isPremiumPlan(formData.plano)
      ? turmasSelecionadas.length === turmas.filter((turma) => turma.ativa).length
      : turmasSelecionadas.length === limiteDeLocais);

  if (
    !formData.plano ||
    !formData.formaPagamento ||
    !turmasSelecionadas.length ||
    !quantidadeValida
  ) {
    throw new Error("Dados obrigatorios do cadastro nao foram informados.");
  }

  return {
    id: `ALU_${formData.whatsapp.replace(/\D/g, "")}`,
    nome: formData.nome.trim(),
    whatsapp: formData.whatsapp.replace(/\D/g, ""),
    email: formData.email.trim(),
    plano: formData.plano,
    status: "pendente",
    statusCadastro: "pendente",
    dataEntrada: formatLocalDate(now),
    diaVencimento: null,
    turmasEscolhidas: turmasSelecionadas.map((turma) => turma.nome),
    turmaPrincipal: turmasSelecionadas[0].nome,
    formaPagamento: formData.formaPagamento,
    observacoes: formData.observacoes.trim()
  };
}

export async function salvarAlunoPendente(
  formData: CadastroAlunoFormData
): Promise<AlunoPendente> {
  const aluno = createAlunoPendente(formData);
  const localStudents = readLocalStudents();
  if (localStudents.some((item) => item.whatsapp === aluno.whatsapp)) {
    throw new Error("Ja existe um cadastro com este WhatsApp.");
  }

  const existing = await readSheet("Alunos", {
    field: "whatsapp",
    value: aluno.whatsapp
  });
  if (existing?.configured && !existing.fallback && existing.data.length > 0) {
    throw new Error("Ja existe um cadastro com este WhatsApp.");
  }

  const salvoNaPlanilha = await appendRow("Alunos", alunoToSheetRow(aluno));
  if (!salvoNaPlanilha) {
    throw new Error("Nao foi possivel conectar a base de dados agora. Tente novamente.");
  }

  if (typeof window !== "undefined") {
    try {
      const atuais = readLocalStudents();
      const semDuplicidade = atuais.filter((item) => item.id !== aluno.id);
      localStorage.setItem(
        ALUNOS_PENDENTES_KEY,
        JSON.stringify([...semDuplicidade, aluno])
      );
    } catch {
      localStorage.setItem(ALUNOS_PENDENTES_KEY, JSON.stringify([aluno]));
    }
  }

  return aluno;
}
