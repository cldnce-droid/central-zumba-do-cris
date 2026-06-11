import {
  alunos,
  aulas,
  confirmacoes,
  desafios,
  pagamentos,
  planos,
  presencas,
  turmas
} from "./mockData";
import type {
  Aula,
  ConquistaVisual,
  DiaSemana,
  ResumoFrequencia,
  Turma
} from "./types";

const planoPorCodigo = {
  "1x": "PLANO_1X",
  "2x": "PLANO_2X",
  "3x": "PLANO_3X"
} as const;

const diaDaSemana: Record<DiaSemana, number> = {
  domingo: 0,
  segunda: 1,
  terça: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sábado: 6
};

function criarDataDaAula(data: string, horario: string) {
  const [hora, minuto = "0"] = horario.split("h");
  return new Date(
    `${data}T${hora.padStart(2, "0")}:${minuto.padStart(2, "0")}:00`
  );
}

function criarProximaAulaRecorrente(
  turmasDisponiveis: Turma[],
  referencia: Date
): Aula | null {
  const candidatas = turmasDisponiveis.flatMap((turma) =>
    turma.dias.map((dia) => {
      const [hora, minuto = "0"] = turma.horario.split("h");
      const data = new Date(referencia);
      const diasAteAula =
        (diaDaSemana[dia] - referencia.getDay() + 7) % 7;

      data.setDate(referencia.getDate() + diasAteAula);
      data.setHours(Number(hora), Number(minuto), 0, 0);

      if (data.getTime() <= referencia.getTime()) {
        data.setDate(data.getDate() + 7);
      }

      return { data, turma, dia };
    })
  );

  const proxima = candidatas.sort(
    (primeira, segunda) => primeira.data.getTime() - segunda.data.getTime()
  )[0];

  if (!proxima) return null;

  const data = [
    proxima.data.getFullYear(),
    String(proxima.data.getMonth() + 1).padStart(2, "0"),
    String(proxima.data.getDate()).padStart(2, "0")
  ].join("-");

  return {
    id: `AULA_PREVISTA_${proxima.turma.id}_${data}`,
    turmaId: proxima.turma.id,
    data,
    diaSemana: proxima.dia,
    horario: proxima.turma.horario,
    local: proxima.turma.local,
    endereco: proxima.turma.endereco,
    status: "agendada"
  };
}

export function getAlunoById(id: string) {
  return alunos.find((aluno) => aluno.id === id);
}

export function getPlanoByAluno(alunoId: string) {
  const aluno = getAlunoById(alunoId);
  if (!aluno) return undefined;

  return planos.find((plano) => plano.id === planoPorCodigo[aluno.plano]);
}

export function getTurmasDisponiveisPorPlano(alunoId: string) {
  const aluno = getAlunoById(alunoId);
  const plano = getPlanoByAluno(alunoId);

  if (!aluno || !plano) return [];

  const turmasAtivas = turmas.filter((turma) => turma.ativa);
  const principal = turmasAtivas.find(
    (turma) => turma.nome === aluno.turmaPrincipal
  );

  if (!principal) return turmasAtivas.slice(0, plano.aulasPorSemana);
  if (plano.aulasPorSemana === 1) return [principal];
  if (plano.aulasPorSemana === 3) return turmasAtivas;

  return [
    principal,
    ...turmasAtivas.filter((turma) => turma.id !== principal.id)
  ].slice(0, 2);
}

export function getProximaAula(alunoId: string, referencia = new Date()) {
  const turmasDisponiveis = getTurmasDisponiveisPorPlano(alunoId);
  const idsDisponiveis = new Set(turmasDisponiveis.map((turma) => turma.id));

  const proximaAgendada = aulas
    .filter(
      (aula) =>
        aula.status === "agendada" &&
        idsDisponiveis.has(aula.turmaId) &&
        criarDataDaAula(aula.data, aula.horario).getTime() > referencia.getTime()
    )
    .sort(
      (primeira, segunda) =>
        criarDataDaAula(primeira.data, primeira.horario).getTime() -
        criarDataDaAula(segunda.data, segunda.horario).getTime()
    )[0];

  return (
    proximaAgendada ??
    criarProximaAulaRecorrente(turmasDisponiveis, referencia)
  );
}

export function getStatusPagamento(alunoId: string) {
  const ultimoPagamento = pagamentos
    .filter((pagamento) => pagamento.alunoId === alunoId)
    .sort((primeiro, segundo) =>
      segundo.vencimento.localeCompare(primeiro.vencimento)
    )[0];

  return ultimoPagamento?.status ?? "pendente";
}

export function getResumoFrequencia(
  alunoId: string,
  referencia = new Date()
): ResumoFrequencia {
  const registros = presencas
    .filter((presenca) => presenca.alunoId === alunoId)
    .sort((primeira, segunda) => segunda.data.localeCompare(primeira.data));
  const presencasReais = registros.filter((presenca) => presenca.compareceu);
  const prefixoMes = `${referencia.getFullYear()}-${String(
    referencia.getMonth() + 1
  ).padStart(2, "0")}`;
  let sequenciaAtual = 0;

  for (const registro of registros) {
    if (!registro.compareceu) break;
    sequenciaAtual += 1;
  }

  return {
    aulasNoMes: presencasReais.filter((presenca) =>
      presenca.data.startsWith(prefixoMes)
    ).length,
    sequenciaAtual,
    totalPresencas: presencasReais.length
  };
}

export function getDesafiosDisponiveis(_alunoId: string) {
  return [...desafios].sort(
    (primeiro, segundo) => Number(segundo.ativo) - Number(primeiro.ativo)
  );
}

export function getConfirmacaoDaAula(alunoId: string, aulaId: string) {
  return confirmacoes.find(
    (confirmacao) =>
      confirmacao.alunoId === alunoId &&
      confirmacao.aulaId === aulaId &&
      confirmacao.status === "confirmado"
  );
}

export function getConquistasAluno(alunoId: string): ConquistaVisual[] {
  const aluno = getAlunoById(alunoId);
  const frequencia = getResumoFrequencia(alunoId);
  const entrouNoInicio =
    aluno !== undefined && aluno.dataEntrada <= "2026-03-31";

  return [
    {
      id: "primeira-aula",
      titulo: "Primeira aula",
      descricao: "O primeiro passo já foi dado.",
      desbloqueada: frequencia.totalPresencas >= 1,
      accent: "pink"
    },
    {
      id: "primeiro-mes",
      titulo: "Primeiro mês",
      descricao: "Um mês inteiro no ritmo.",
      desbloqueada:
        aluno !== undefined &&
        Date.now() - new Date(`${aluno.dataEntrada}T12:00:00`).getTime() >=
          30 * 24 * 60 * 60 * 1000,
      accent: "blue"
    },
    {
      id: "errou-continua",
      titulo: "Errou... continua!",
      descricao: "Persistência também dança.",
      desbloqueada: frequencia.totalPresencas >= 3,
      accent: "yellow"
    },
    {
      id: "aluna-fundadora",
      titulo: "Aluna fundadora",
      descricao: "Parte do começo dessa história.",
      desbloqueada: entrouNoInicio,
      accent: "purple"
    }
  ];
}
