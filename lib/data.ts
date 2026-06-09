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
