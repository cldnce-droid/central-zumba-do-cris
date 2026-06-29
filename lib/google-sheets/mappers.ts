import type {
  Aluno,
  Aula,
  Confirmacao,
  Desafio,
  Mensalidade,
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

function parsePagamentoStatus(value: unknown) {
  return String(value ?? "").trim().toLowerCase() === "pago"
    ? "pago"
    : "atrasado";
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
  const statusCadastro = parseAlunoStatus(row.statusCadastro ?? row.status);
  const statusPagamento = parsePagamentoStatus(row.statusPagamento);
  return {
    ...row,
    id: String(row.id ?? ""),
    nome: String(row.nome ?? ""),
    whatsapp: String(row.whatsapp ?? "").replace(/\D/g, ""),
    email: String(row.email ?? ""),
    plano: parsePlanoCodigo(row.plano),
    status: statusCadastro,
    statusCadastro,
    statusPagamento,
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

  const status = (aluno as T & { status?: unknown; statusCadastro?: unknown }).status;
  const statusCadastro = (
    aluno as T & { statusCadastro?: unknown }
  ).statusCadastro ?? status;
  const statusPagamento = (
    aluno as T & { statusPagamento?: unknown }
  ).statusPagamento ?? "atrasado";

  return {
    ...aluno,
    statusCadastro,
    statusPagamento,
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
  return {
    ...row,
    id: String(row.id ?? ""),
    turmaId: String(row.turmaId ?? ""),
    data: parseSheetDate(row.data),
    diaSemana: String(row.diaSemana ?? ""),
    horario: String(row.horario ?? ""),
    local: String(row.local ?? ""),
    endereco: String(row.endereco ?? ""),
    status: String(row.status ?? "agendada")
  } as unknown as Aula;
}

export function sheetRowToConfirmacao(row: SheetRow): Confirmacao {
  const rawStatus = String(row.status ?? "solicitada").trim().toLowerCase();
  const status =
    rawStatus === "aceita" || rawStatus === "recusada"
      ? rawStatus
      : rawStatus === "cancelado" || rawStatus === "nao_vou"
        ? "recusada"
        : "solicitada";

  return {
    ...row,
    id: String(row.id ?? ""),
    alunoId: String(row.alunoId ?? ""),
    aulaId: String(row.aulaId ?? ""),
    dataConfirmacao: String(row.dataConfirmacao ?? ""),
    status
  } as unknown as Confirmacao;
}

export function sheetRowToPresenca(row: SheetRow): Presenca {
  return {
    ...row,
    id: String(row.id ?? ""),
    alunoId: String(row.alunoId ?? ""),
    nomeAluno: String(row.nomeAluno ?? ""),
    whatsapp: String(row.whatsapp ?? ""),
    aulaId: String(row.aulaId ?? ""),
    turma: String(row.turma ?? row.local ?? ""),
    local: String(row.local ?? row.turma ?? ""),
    data: parseSheetDate(row.data ?? row.dataAula),
    dataAula: parseSheetDate(row.dataAula ?? row.data),
    horario: String(row.horario ?? ""),
    dataValidacao: String(row.dataValidacao ?? ""),
    status: String(row.status ?? "aceita") === "recusada" ? "recusada" : "aceita",
    compareceu: parseBoolean(row.compareceu) || String(row.status ?? "") === "aceita",
    validadoPor: String(row.validadoPor ?? "professor"),
    observacao: String(row.observacao ?? "")
  } as unknown as Presenca;
}

export function sheetRowToPagamento(row: SheetRow): Pagamento {
  const status = row.status === "pago" ? "pago" : "atrasado";
  return {
    ...row,
    id: String(row.id ?? ""),
    alunoId: String(row.alunoId ?? ""),
    plano: parsePlanoCodigo(row.plano),
    valor: Number(row.valor),
    vencimento: parseSheetDate(row.vencimento),
    dataPagamento: row.dataPagamento
      ? parseSheetDate(row.dataPagamento)
      : null,
    status,
    metodo: String(row.metodo ?? "outro")
  } as unknown as Pagamento;
}

export function sheetRowToMensalidade(row: SheetRow): Mensalidade {
  const rawStatus = String(row.status ?? "em_aberto").trim().toLowerCase();
  const status = ([
    "em_aberto",
    "comprovante_enviado",
    "pago",
    "atrasado"
  ].includes(rawStatus)
    ? rawStatus
    : "em_aberto") as Mensalidade["status"];

  return {
    ...row,
    id: String(row.id ?? ""),
    alunoId: String(row.alunoId ?? ""),
    nome: String(row.nome ?? ""),
    whatsapp: String(row.whatsapp ?? ""),
    mesReferencia: String(row.mesReferencia ?? ""),
    plano: parsePlanoCodigo(row.plano),
    valor: Number(row.valor) || 0,
    vencimento: parseSheetDate(row.vencimento),
    status,
    dataPagamento: row.dataPagamento ? parseSheetDate(row.dataPagamento) : null,
    dataComprovante: row.dataComprovante
      ? String(row.dataComprovante)
      : null,
    metodo: String(row.metodo ?? "pix"),
    observacao: String(row.observacao ?? "")
  } as unknown as Mensalidade;
}

export function sheetRowToDesafio(row: SheetRow): Desafio {
  return {
    ...row,
    meta: Number(row.meta),
    ativo: parseBoolean(row.ativo)
  } as unknown as Desafio;
}
