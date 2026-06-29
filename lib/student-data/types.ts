export type PlanoCodigo = "1x" | "2x" | "3x";
export type AlunoStatus = "ativo" | "pendente" | "atrasado" | "inativo";
export type DiaSemana =
  | "domingo"
  | "segunda"
  | "terça"
  | "quarta"
  | "quinta"
  | "sexta"
  | "sábado";
export type AulaStatus = "agendada" | "realizada" | "cancelada";
export type ConfirmacaoStatus =
  | "solicitada"
  | "aceita"
  | "recusada"
  | "confirmado"
  | "cancelado";
export type PagamentoStatus = "pago" | "atrasado";
export type MensalidadeStatus =
  | "em_aberto"
  | "comprovante_enviado"
  | "pago"
  | "atrasado";
export type MetodoPagamento = "pix" | "dinheiro" | "outro";
export type StatusVisualDesafio = "em_breve" | "bloqueado" | "disponivel";

export interface Aluno {
  id: string;
  nome: string;
  whatsapp: string;
  email: string;
  plano: PlanoCodigo;
  status: AlunoStatus;
  statusCadastro?: "pendente" | "ativo" | "inativo";
  statusPagamento?: PagamentoStatus;
  dataEntrada: string;
  diaVencimento: number | null;
  turmaPrincipal: string;
  turmasEscolhidas?: string[];
  formaPagamento?: MetodoPagamento;
  observacoes: string;
}

export interface Plano {
  id: string;
  nome: string;
  valor: number;
  aulasPorSemana: 1 | 2 | 3;
  descricao: string;
  destaque: boolean;
}

export interface Turma {
  id: string;
  nome: string;
  local: string;
  dias: DiaSemana[];
  horario: string;
  endereco: string;
  capacidade: number | null;
  ativa: boolean;
}

export interface Aula {
  id: string;
  turmaId: string;
  data: string;
  diaSemana: DiaSemana;
  horario: string;
  local: string;
  endereco: string;
  status: AulaStatus;
}

export interface Confirmacao {
  id: string;
  alunoId: string;
  aulaId: string;
  dataConfirmacao: string;
  status: ConfirmacaoStatus;
}

export interface Presenca {
  id: string;
  alunoId: string;
  nomeAluno?: string;
  whatsapp?: string;
  aulaId: string;
  turma?: string;
  local?: string;
  data: string;
  dataAula?: string;
  horario?: string;
  dataValidacao?: string;
  status?: "aceita" | "recusada";
  compareceu: boolean;
  validadoPor: string;
  observacao: string;
}

export interface Pagamento {
  id: string;
  alunoId: string;
  plano: PlanoCodigo;
  valor: number;
  vencimento: string;
  dataPagamento: string | null;
  status: PagamentoStatus;
  metodo: MetodoPagamento;
}

export interface Mensalidade {
  id: string;
  alunoId: string;
  nome: string;
  whatsapp: string;
  mesReferencia: string;
  plano: PlanoCodigo;
  valor: number;
  vencimento: string;
  status: MensalidadeStatus;
  dataPagamento: string | null;
  dataComprovante: string | null;
  metodo: MetodoPagamento;
  observacao: string;
}

export interface Desafio {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  meta: number;
  ativo: boolean;
  statusVisual: StatusVisualDesafio;
}

export interface ResumoFrequencia {
  aulasNoMes: number;
  sequenciaAtual: number;
  totalPresencas: number;
}

export interface ConquistaVisual {
  id: string;
  titulo: string;
  descricao: string;
  desbloqueada: boolean;
  accent: "pink" | "blue" | "purple" | "yellow";
}
