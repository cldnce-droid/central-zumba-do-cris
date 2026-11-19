export const links = {
  officialLogo: "/references/logo-principal-1.png",
  whatsapp: "#"
};

export const pixKey = "4c1f81f8-95e8-4a9c-b7fa-58268fe36315";

export const whatsappGroups = [
  {
    city: "Palmas",
    schedule: "Segunda e quarta • 19h",
    url: "https://chat.whatsapp.com/B6c5JM9R5nx8IxpZNTK0jp",
    accent: "blue" as "pink" | "blue" | "yellow" | "purple"
  },
  {
    city: "Ganchos de Fora",
    schedule: "Terça e quinta • 18h30",
    url: "https://chat.whatsapp.com/FPIReSms4UG6dFwk7RY10D",
    accent: "yellow" as "pink" | "blue" | "yellow" | "purple"
  },
  {
    city: "Armação",
    schedule: "Segunda e quarta • 20h30",
    url: "https://chat.whatsapp.com/GYSoPMm0rGxEMlmANShgGb?s=cl&p=a&ilr=0",
    accent: "pink" as "pink" | "blue" | "yellow" | "purple"
  }
] as const;

export const classes = [
  {
    city: "Ganchos de Fora",
    days: "Terça e quinta",
    time: "18h30",
    place: "Salão da Capela",
    accent: "pink" as "pink" | "blue" | "yellow" | "purple",
    image: "/references/local-ganchos-de-fora.png",
    mapUrl: "https://maps.app.goo.gl/zJRE6LH2uVFRMNd98",
    note: "Duas chances na semana para entrar no ritmo."
  },
  {
    city: "Palmas",
    days: "Segunda e quarta",
    time: "19h",
    place: "Novo local em Palmas",
    accent: "blue" as "pink" | "blue" | "yellow" | "purple",
    image: "/references/local-palmas.png",
    mapUrl: "https://maps.app.goo.gl/AGdKbo8jwwS1PfJe9",
    note: "Segunda e quarta em um novo espaço preparado para a nossa turma."
  },
  {
    city: "Armação",
    days: "Segunda e quarta",
    time: "20h30",
    place: "Novo local em Armação",
    accent: "pink" as "pink" | "blue" | "yellow" | "purple",
    image: "/references/local-armacao.png",
    mapUrl: "https://maps.app.goo.gl/HgFsyB2v64qairPG8",
    note: "Uma nova turma para dançar no meio e no final da semana."
  }
] as const;

export const plans = [
  {
    name: "2x na semana",
    price: "R$100",
    tagline: "Acesso a 2 aulas por semana.",
    featured: false,
    benefits: [] as string[]
  },
  {
    name: "Plano Apoiadora Premium",
    price: "R$150",
    tagline: "Acesso livre a todas as aulas em qualquer local.",
    featured: true,
    benefits: [
      "Acesso ilimitado a todas as aulas",
      "Grupo exclusivo",
      "Descontos em eventos",
      "Apoio direto ao crescimento do Zumba do Cris"
    ]
  }
] as const;

export const notices = [
  {
    category: "Turmas",
    title: "Palmas está crescendo",
    description: "Nossa turma de Palmas continua recebendo novas alunas.",
    accent: "blue" as "pink" | "blue" | "yellow" | "purple",
    date: "07 de junho"
  },
  {
    category: "Comunidade",
    title: "Bem-vinda ao Zumba do Cris",
    description: "Aqui ninguém precisa ser perfeito. Basta continuar.",
    accent: "purple" as "pink" | "blue" | "yellow" | "purple"
  },
  {
    category: "Lembrete",
    title: "Dia de pagamento",
    description: "As mensalidades vencem todo dia 08.",
    accent: "yellow" as "pink" | "blue" | "yellow" | "purple"
  }
] as const;
