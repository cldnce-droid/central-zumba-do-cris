export type TurmaNome = "Ganchos de Fora" | "Palmas" | "Calheiros";

export type PlanoNome =
  | "1x na semana — R$50"
  | "2x na semana — R$85"
  | "3x na semana — R$100";

export type Status = "Ativo" | "Pendente" | "Pausado" | "Inativo";
export type StatusAluno = Status;

export type AccentColor = "pink" | "blue" | "purple" | "yellow";

export interface Turma {
  nome: TurmaNome;
  dias: string;
  diasSemana: number[];
  horario: string;
  local: string;
}

export interface Plano {
  nome: PlanoNome;
  frequenciaSemanal: 1 | 2 | 3;
  valor: number;
}

export interface Aluno {
  id: string;
  nome: string;
  turma: TurmaNome;
  plano: PlanoNome;
  status: StatusAluno;
  dataEntrada: string;
}

export interface Frequencia {
  alunoId: string;
  aulasNoMes: number;
  sequenciaAtual: number;
  totalPresencas: number;
}

export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  desbloqueada: boolean;
  accent: AccentColor;
}

export const links = {
  officialLogo: "/references/logo-principal-1.png",
  whatsapp: "#"
};

export const pixKey = "4c1f81f8-95e8-4a9c-b7fa-58268fe36315";

export const whatsappGroups = [
  {
    city: "Calheiros",
    schedule: "Quinta-feira • 20h15",
    url: "https://chat.whatsapp.com/J8wN1cv3qdn9pZEoFpkVWj",
    accent: "pink"
  },
  {
    city: "Palmas",
    schedule: "Quarta-feira • 19h",
    url: "https://chat.whatsapp.com/B6c5JM9R5nx8IxpZNTK0jp",
    accent: "blue"
  },
  {
    city: "Ganchos de Fora",
    schedule: "Terça e quinta • 18h30",
    url: "https://chat.whatsapp.com/FPIReSms4UG6dFwk7RY10D",
    accent: "yellow"
  }
] as const;

export const classes = [
  {
    city: "Ganchos de Fora",
    days: "Terça e quinta",
    time: "18h30",
    place: "Salão da Capela",
    accent: "pink",
    image: "/references/local-ganchos-de-fora.png",
    mapUrl: "https://maps.app.goo.gl/zJRE6LH2uVFRMNd98",
    note: "Duas chances na semana para entrar no ritmo."
  },
  {
    city: "Palmas",
    days: "Quarta",
    time: "19h",
    place: "2.0 Lounge",
    accent: "blue",
    image: "/references/local-palmas.png",
    mapUrl: "https://maps.app.goo.gl/Tep8YnCCuLQ44Y6y9",
    note: "Noite de energia alta em um espaço com clima de encontro."
  },
  {
    city: "Calheiros",
    days: "Quinta",
    time: "20h15",
    place: "Ao lado do Berlanda",
    accent: "purple",
    image: "/references/local-calheiros.png",
    mapUrl: "https://maps.app.goo.gl/SAQjdw9UR8AZb2oXA",
    note: "Turma para fechar a quinta no modo alegria total."
  }
] as const;

export const turmaOptions: Turma[] = [
  {
    nome: "Ganchos de Fora",
    dias: "Terça e quinta",
    diasSemana: [2, 4],
    horario: "18h30",
    local: "Salão da Capela"
  },
  {
    nome: "Palmas",
    dias: "Quarta-feira",
    diasSemana: [3],
    horario: "19h",
    local: "2.0 Lounge"
  },
  {
    nome: "Calheiros",
    dias: "Quinta-feira",
    diasSemana: [4],
    horario: "20h15",
    local: "Ao lado do Berlanda"
  }
];

export const planoOptions: Plano[] = [
  {
    nome: "1x na semana — R$50",
    frequenciaSemanal: 1,
    valor: 50
  },
  {
    nome: "2x na semana — R$85",
    frequenciaSemanal: 2,
    valor: 85
  },
  {
    nome: "3x na semana — R$100",
    frequenciaSemanal: 3,
    valor: 100
  }
];

export const statusOptions: StatusAluno[] = [
  "Ativo",
  "Pendente",
  "Pausado",
  "Inativo"
];

export const alunos: Aluno[] = [
  {
    id: "aluna-maria",
    nome: "Maria",
    turma: "Ganchos de Fora",
    plano: "2x na semana — R$85",
    status: "Ativo",
    dataEntrada: "2026-03-12"
  },
  {
    id: "aluna-ana",
    nome: "Ana",
    turma: "Palmas",
    plano: "1x na semana — R$50",
    status: "Pendente",
    dataEntrada: "2026-05-20"
  },
  {
    id: "aluna-joana",
    nome: "Joana",
    turma: "Calheiros",
    plano: "3x na semana — R$100",
    status: "Ativo",
    dataEntrada: "2026-02-05"
  }
];

export const frequencias: Frequencia[] = [
  {
    alunoId: "aluna-maria",
    aulasNoMes: 6,
    sequenciaAtual: 4,
    totalPresencas: 21
  },
  {
    alunoId: "aluna-ana",
    aulasNoMes: 3,
    sequenciaAtual: 2,
    totalPresencas: 5
  },
  {
    alunoId: "aluna-joana",
    aulasNoMes: 8,
    sequenciaAtual: 7,
    totalPresencas: 29
  }
];

export const conquistasPorAluno: Record<string, Conquista[]> = {
  "aluna-maria": [
    {
      id: "primeira-aula",
      titulo: "Primeira aula",
      descricao: "O primeiro passo já foi dado.",
      desbloqueada: true,
      accent: "pink"
    },
    {
      id: "primeiro-mes",
      titulo: "Primeiro mês",
      descricao: "Um mês inteiro no ritmo.",
      desbloqueada: true,
      accent: "blue"
    },
    {
      id: "errou-continua",
      titulo: "Errou... continua!",
      descricao: "Persistência também dança.",
      desbloqueada: true,
      accent: "yellow"
    },
    {
      id: "aluna-fundadora",
      titulo: "Aluna fundadora",
      descricao: "Parte do começo dessa história.",
      desbloqueada: false,
      accent: "purple"
    }
  ],
  "aluna-ana": [
    {
      id: "primeira-aula",
      titulo: "Primeira aula",
      descricao: "O primeiro passo já foi dado.",
      desbloqueada: true,
      accent: "pink"
    },
    {
      id: "primeiro-mes",
      titulo: "Primeiro mês",
      descricao: "Um mês inteiro no ritmo.",
      desbloqueada: false,
      accent: "blue"
    },
    {
      id: "errou-continua",
      titulo: "Errou... continua!",
      descricao: "Persistência também dança.",
      desbloqueada: false,
      accent: "yellow"
    },
    {
      id: "aluna-fundadora",
      titulo: "Aluna fundadora",
      descricao: "Parte do começo dessa história.",
      desbloqueada: false,
      accent: "purple"
    }
  ],
  "aluna-joana": [
    {
      id: "primeira-aula",
      titulo: "Primeira aula",
      descricao: "O primeiro passo já foi dado.",
      desbloqueada: true,
      accent: "pink"
    },
    {
      id: "primeiro-mes",
      titulo: "Primeiro mês",
      descricao: "Um mês inteiro no ritmo.",
      desbloqueada: true,
      accent: "blue"
    },
    {
      id: "errou-continua",
      titulo: "Errou... continua!",
      descricao: "Persistência também dança.",
      desbloqueada: true,
      accent: "yellow"
    },
    {
      id: "aluna-fundadora",
      titulo: "Aluna fundadora",
      descricao: "Parte do começo dessa história.",
      desbloqueada: true,
      accent: "purple"
    }
  ]
};

export const plans = [
  {
    name: "1x na semana",
    price: "R$50",
    tagline: "Melhor dançando do que reclamando."
  },
  {
    name: "2x na semana",
    price: "R$85",
    tagline: "A evolução começou a aparecer."
  },
  {
    name: "3x na semana",
    price: "R$100",
    tagline: "O sofá não gostou deste plano."
  }
] as const;

export const notices = [
  {
    category: "Vagas",
    title: "Últimas vagas em Calheiros",
    description: "Restam apenas 7 vagas para a turma de quinta-feira.",
    accent: "pink",
    date: "08 de junho"
  },
  {
    category: "Turmas",
    title: "Palmas está crescendo",
    description: "Nossa turma de Palmas continua recebendo novas alunas.",
    accent: "blue",
    date: "07 de junho"
  },
  {
    category: "Comunidade",
    title: "Bem-vinda ao Zumba do Cris",
    description: "Aqui ninguém precisa ser perfeito. Basta continuar.",
    accent: "purple"
  },
  {
    category: "Lembrete",
    title: "Dia de pagamento",
    description: "As mensalidades vencem todo dia 05.",
    accent: "yellow"
  }
] as const;
