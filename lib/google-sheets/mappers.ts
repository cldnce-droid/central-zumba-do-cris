import type {
  Aluno,
  Aula,
  Confirmacao,
  Desafio,
  Pagamento,
  Plano,
  Presenca,
  Turma
} from "@/lib/student-data/types";

export type SheetRow = Record<string, string | number | boolean | null>;

export function parseBoolean(value: unknown) {
  return String(value).toLowerCase() === "true";
}

export function parseList(value: unknown) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePlanoCodigo(value: unknown) {
  const match = String(value ?? "").toLowerCase().match(/[123]\s*x/);
  return (match?.[0].replace(/\s/g, "") || "1x") as Aluno["plano"];
}

function parseAlunoStatus(value: unknown) {
  const status = String(value ?? "").trim().toLowerCase();
  return ["ativo", "pendente", "atrasado", "inativo"].includes(status)
    ? status as Aluno["status"]
    : "pendente";
}

function parseSheetDate(value: unknown) {
  const text = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

export function sheetRowToAluno(row: SheetRow): Aluno {
  const turmasEscolhidas = parseList(row.turmasEscolhidas);
  const turmaPrincipal = String(row.turmaPrincipal ?? "").trim();
  return {
    ...row,
    id: String(row.id ?? ""),
    nome: String(row.nome ?? ""),
    whatsapp: String(row.whatsapp ?? "").replace(/\D/g, ""),
    email: String(row.email ?? ""),
    plano: parsePlanoCodigo(row.plano),
    status: parseAlunoStatus(row.status),
    dataEntrada: parseSheetDate(row.dataEntrada),
    diaVencimento: Number(row.diaVencimento) || null,
    turmasEscolhidas,
    turmaPrincipal: turmasEscolhidas[0] ?? turmaPrincipal,
    observacoes: String(row.observacoes ?? "")
  } as unknown as Aluno;
}

export function alunoToSheetRow<T extends object>(aluno: T): SheetRow {
  const turmasEscolhidas = (
    aluno as T & { turmasEscolhidas?: unknown }
  ).turmasEscolhidas;

  return {
    ...aluno,
    turmasEscolhidas: Array.isArray(turmasEscolhidas)
      ? turmasEscolhidas.join(", ")
      : turmasEscolhidas
  } as SheetRow;
}

export function sheetRowToPlano(row: SheetRow): Plano {
  return {
    ...row,
    valor: Number(row.valor),
    aulasPorSemana: Number(row.aulasPorSemana),
    destaque: parseBoolean(row.destaque)
  } as unknown as Plano;
}

export function sheetRowToTurma(row: SheetRow): Turma {
  return {
    ...row,
    dias: parseList(row.dias),
    capacidade: row.capacidade ? Number(row.capacidade) : null,
    ativa: parseBoolean(row.ativa)
  } as unknown as Turma;
}

export function sheetRowToAula(row: SheetRow): Aula {
  return row as unknown as Aula;
}

export function sheetRowToConfirmacao(row: SheetRow): Confirmacao {
  return row as unknown as Confirmacao;
}

export function sheetRowToPresenca(row: SheetRow): Presenca {
  return {
    ...row,
    compareceu: parseBoolean(row.compareceu)
  } as unknown as Presenca;
}

export function sheetRowToPagamento(row: SheetRow): Pagamento {
  const status = row.status === "pago" ? "pago" : "atrasado";
  return {
    ...row,
    valor: Number(row.valor),
    dataPagamento: row.dataPagamento || null,
    status
  } as unknown as Pagamento;
}

export function sheetRowToDesafio(row: SheetRow): Desafio {
  return {
    ...row,
    meta: Number(row.meta),
    ativo: parseBoolean(row.ativo)
  } as unknown as Desafio;
}
