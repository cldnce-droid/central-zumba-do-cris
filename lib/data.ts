export const links = {
  officialLogo: "/references/story-1.png",
  whatsapp: "#",
  group: "#",
  pix: "#"
};

export const classes = [
  {
    city: "Ganchos de Fora",
    days: "Terça e quinta",
    time: "18h30",
    place: "Local a confirmar",
    accent: "pink",
    image: "/references/logo-oficial.png",
    note: "Duas chances na semana para entrar no ritmo."
  },
  {
    city: "Palmas",
    days: "Quarta",
    time: "19h",
    place: "2.0 Lounge",
    accent: "blue",
    image: "/references/flyer-palmas.png",
    note: "Noite de energia alta em um espaco com clima de encontro."
  },
  {
    city: "Calheiros",
    days: "Quinta",
    time: "20h15",
    place: "Ao lado do Berlanda",
    accent: "purple",
    image: "/references/flyer-calheiros.png",
    note: "Turma para fechar a quinta no modo alegria total."
  }
] as const;

export const plans = [
  {
    name: "1x na semana",
    price: "R$50"
  },
  {
    name: "2x na semana",
    price: "R$85"
  },
  {
    name: "3x na semana",
    price: "R$100"
  }
] as const;

export const notices = [
  {
    title: "Bem-vindo a Central",
    body: "Os avisos das turmas aparecem aqui. Edite este texto em lib/data.ts.",
    tag: "Geral"
  },
  {
    title: "Aulas em qualquer local",
    body: "Alunos com plano ativo podem participar em qualquer local disponível.",
    tag: "Planos"
  },
  {
    title: "Links em breve",
    body: "WhatsApp, grupo e PIX estão como placeholders para inserir depois.",
    tag: "Links"
  }
] as const;

export const highlights = [
  {
    label: "Locais",
    value: "3"
  },
  {
    label: "Planos",
    value: "3"
  },
  {
    label: "Energia",
    value: "100%"
  }
] as const;

export const referenceImages = [
  {
    title: "Palmas",
    src: "/references/flyer-palmas.png"
  },
  {
    title: "Calheiros",
    src: "/references/flyer-calheiros.png"
  },
  {
    title: "Story",
    src: "/references/story-2.png"
  }
] as const;
