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

export function sheetRowToAluno(row: SheetRow): Aluno {
  const turmasEscolhidas = parseList(row.turmasEscolhidas);
  return {
    ...row,
    whatsapp: String(row.whatsapp ?? "").replace(/\D/g, ""),
    diaVencimento: Number(row.diaVencimento) || null,
    turmasEscolhidas,
    turmaPrincipal: turmasEscolhidas[0] ?? ""
  } as unknown as Aluno;
}

export function alunoToSheetRow(aluno: Record<string, unknown>): SheetRow {
  return {
    ...aluno,
    turmasEscolhidas: Array.isArray(aluno.turmasEscolhidas)
      ? aluno.turmasEscolhidas.join(", ")
      : aluno.turmasEscolhidas
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
  return {
    ...row,
    valor: Number(row.valor),
    dataPagamento: row.dataPagamento || null
  } as unknown as Pagamento;
}

export function sheetRowToDesafio(row: SheetRow): Desafio {
  return {
    ...row,
    meta: Number(row.meta),
    ativo: parseBoolean(row.ativo)
  } as unknown as Desafio;
}
