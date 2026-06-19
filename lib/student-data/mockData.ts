import type {
  Aluno,
  Aula,
  Confirmacao,
  Desafio,
  Pagamento,
  Plano,
  Presenca,
  Turma
} from "./types";

// Cada coleção representa uma futura aba da planilha mãe.
export const alunos: Aluno[] = [
  {
    id: "ALU001",
    nome: "Maria",
    whatsapp: "48999999999",
    email: "maria@email.com",
    plano: "2x",
    status: "ativo",
    dataEntrada: "2026-03-12",
    diaVencimento: 10,
    turmaPrincipal: "Ganchos de Fora",
    observacoes: "Aluna ativa"
  },
  {
    id: "ALU002",
    nome: "Ana",
    whatsapp: "48988888888",
    email: "ana@email.com",
    plano: "1x",
    status: "pendente",
    statusCadastro: "pendente",
    statusPagamento: "atrasado",
    dataEntrada: "2026-05-20",
    diaVencimento: 5,
    turmaPrincipal: "Palmas",
    observacoes: "Aguardando confirmação da mensalidade"
  },
  {
    id: "ALU003",
    nome: "Joana",
    whatsapp: "48977777777",
    email: "joana@email.com",
    plano: "3x",
    status: "ativo",
    dataEntrada: "2026-02-05",
    diaVencimento: 10,
    turmaPrincipal: "Calheiros",
    observacoes: "Aluna do passe completo"
  },
  {
    id: "ALU004",
    nome: "Carla",
    whatsapp: "48966666666",
    email: "carla@email.com",
    plano: "2x",
    status: "atrasado",
    dataEntrada: "2026-04-08",
    diaVencimento: 5,
    turmaPrincipal: "Palmas",
    observacoes: "Pagamento em atraso"
  }
];

export const planos: Plano[] = [
  {
    id: "PLANO_1X",
    nome: "1x por semana",
    valor: 50,
    aulasPorSemana: 1,
    descricao: "Uma aula por semana para manter o corpo em movimento.",
    destaque: false
  },
  {
    id: "PLANO_2X",
    nome: "2x por semana",
    valor: 85,
    aulasPorSemana: 2,
    descricao: "Mais ritmo e evolução com até duas aulas por semana.",
    destaque: false
  },
  {
    id: "PLANO_3X",
    nome: "3x por semana",
    valor: 100,
    aulasPorSemana: 3,
    descricao: "Acesso ao plano mais completo do Zumba do Cris.",
    destaque: true
  }
];

export const turmas: Turma[] = [
  {
    id: "TURMA_GANCHOS",
    nome: "Ganchos de Fora",
    local: "Ganchos de Fora",
    dias: ["terça", "quinta"],
    horario: "18h30",
    endereco: "Salão da Capela",
    capacidade: null,
    ativa: true
  },
  {
    id: "TURMA_PALMAS",
    nome: "Palmas",
    local: "Palmas",
    dias: ["quarta"],
    horario: "19h",
    endereco: "2.0 Lounge",
    capacidade: null,
    ativa: true
  },
  {
    id: "TURMA_CALHEIROS",
    nome: "Calheiros",
    local: "Calheiros",
    dias: ["quinta"],
    horario: "20h15",
    endereco: "Ao lado do Berlanda",
    capacidade: null,
    ativa: true
  }
];

export const aulas: Aula[] = [
  {
    id: "AULA001",
    turmaId: "TURMA_GANCHOS",
    data: "2026-06-11",
    diaSemana: "quinta",
    horario: "18h30",
    local: "Ganchos de Fora",
    endereco: "Salão da Capela",
    status: "agendada"
  },
  {
    id: "AULA002",
    turmaId: "TURMA_CALHEIROS",
    data: "2026-06-11",
    diaSemana: "quinta",
    horario: "20h15",
    local: "Calheiros",
    endereco: "Ao lado do Berlanda",
    status: "agendada"
  },
  {
    id: "AULA003",
    turmaId: "TURMA_GANCHOS",
    data: "2026-06-16",
    diaSemana: "terça",
    horario: "18h30",
    local: "Ganchos de Fora",
    endereco: "Salão da Capela",
    status: "agendada"
  },
  {
    id: "AULA004",
    turmaId: "TURMA_PALMAS",
    data: "2026-06-17",
    diaSemana: "quarta",
    horario: "19h",
    local: "Palmas",
    endereco: "2.0 Lounge",
    status: "agendada"
  },
  {
    id: "AULA005",
    turmaId: "TURMA_GANCHOS",
    data: "2026-06-18",
    diaSemana: "quinta",
    horario: "18h30",
    local: "Ganchos de Fora",
    endereco: "Salão da Capela",
    status: "agendada"
  },
  {
    id: "AULA006",
    turmaId: "TURMA_CALHEIROS",
    data: "2026-06-18",
    diaSemana: "quinta",
    horario: "20h15",
    local: "Calheiros",
    endereco: "Ao lado do Berlanda",
    status: "agendada"
  }
];

export const confirmacoes: Confirmacao[] = [
  {
    id: "CONF001",
    alunoId: "ALU001",
    aulaId: "AULA001",
    dataConfirmacao: "2026-06-10T21:30:00",
    status: "confirmado"
  }
];

export const presencas: Presenca[] = [
  {
    id: "PRES001",
    alunoId: "ALU001",
    aulaId: "AULA_HIST_001",
    data: "2026-06-02",
    compareceu: true,
    validadoPor: "professor",
    observacao: ""
  },
  {
    id: "PRES002",
    alunoId: "ALU001",
    aulaId: "AULA_HIST_002",
    data: "2026-06-04",
    compareceu: true,
    validadoPor: "professor",
    observacao: ""
  },
  {
    id: "PRES003",
    alunoId: "ALU001",
    aulaId: "AULA_HIST_003",
    data: "2026-06-09",
    compareceu: true,
    validadoPor: "professor",
    observacao: ""
  },
  {
    id: "PRES004",
    alunoId: "ALU002",
    aulaId: "AULA_HIST_004",
    data: "2026-06-03",
    compareceu: true,
    validadoPor: "professor",
    observacao: ""
  },
  {
    id: "PRES005",
    alunoId: "ALU003",
    aulaId: "AULA_HIST_005",
    data: "2026-06-02",
    compareceu: true,
    validadoPor: "professor",
    observacao: ""
  },
  {
    id: "PRES006",
    alunoId: "ALU003",
    aulaId: "AULA_HIST_006",
    data: "2026-06-03",
    compareceu: true,
    validadoPor: "professor",
    observacao: ""
  },
  {
    id: "PRES007",
    alunoId: "ALU003",
    aulaId: "AULA_HIST_007",
    data: "2026-06-04",
    compareceu: true,
    validadoPor: "professor",
    observacao: ""
  },
  {
    id: "PRES008",
    alunoId: "ALU003",
    aulaId: "AULA_HIST_008",
    data: "2026-06-09",
    compareceu: true,
    validadoPor: "professor",
    observacao: ""
  },
  {
    id: "PRES009",
    alunoId: "ALU004",
    aulaId: "AULA_HIST_009",
    data: "2026-06-03",
    compareceu: false,
    validadoPor: "professor",
    observacao: "Ausência validada"
  }
];

export const pagamentos: Pagamento[] = [
  {
    id: "PAG001",
    alunoId: "ALU001",
    plano: "2x",
    valor: 85,
    vencimento: "2026-06-10",
    dataPagamento: "2026-06-09",
    status: "pago",
    metodo: "pix"
  },
  {
    id: "PAG002",
    alunoId: "ALU002",
    plano: "1x",
    valor: 50,
    vencimento: "2026-06-05",
    dataPagamento: null,
    status: "atrasado",
    metodo: "pix"
  },
  {
    id: "PAG003",
    alunoId: "ALU003",
    plano: "3x",
    valor: 100,
    vencimento: "2026-06-10",
    dataPagamento: "2026-06-08",
    status: "pago",
    metodo: "dinheiro"
  },
  {
    id: "PAG004",
    alunoId: "ALU004",
    plano: "2x",
    valor: 85,
    vencimento: "2026-06-05",
    dataPagamento: null,
    status: "atrasado",
    metodo: "pix"
  }
];

export const desafios: Desafio[] = [
  {
    id: "DES001",
    titulo: "Desafio 4 aulas no mês",
    descricao: "Complete 4 presenças no mês e desbloqueie essa conquista.",
    tipo: "frequencia",
    meta: 4,
    ativo: false,
    statusVisual: "em_breve"
  },
  {
    id: "DES002",
    titulo: "Desafio Errou... continua!",
    descricao: "Continue em movimento mesmo quando a coreografia apertar.",
    tipo: "sequencia",
    meta: 3,
    ativo: false,
    statusVisual: "bloqueado"
  },
  {
    id: "DES003",
    titulo: "Desafio Mês no Ritmo",
    descricao: "Mantenha uma sequência de aulas durante todo o mês.",
    tipo: "frequencia",
    meta: 8,
    ativo: false,
    statusVisual: "em_breve"
  },
  {
    id: "DES004",
    titulo: "Desafio Convide uma amiga",
    descricao: "Compartilhe a energia do Zumba do Cris com alguém especial.",
    tipo: "indicacao",
    meta: 1,
    ativo: false,
    statusVisual: "bloqueado"
  },
  {
    id: "DES005",
    titulo: "Desafio Primeira Fileira",
    descricao: "Chegue na frente e dance com coragem do começo ao fim.",
    tipo: "comunidade",
    meta: 1,
    ativo: false,
    statusVisual: "em_breve"
  }
];
