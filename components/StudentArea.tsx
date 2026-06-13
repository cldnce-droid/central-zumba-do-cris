"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarIcon,
  HeartIcon,
  LockIcon,
  PinIcon,
  TrophyIcon,
  UsersIcon
} from "@/components/Icons";
import {
  getAlunoById,
  getConquistasDoAluno,
  getDesafiosDisponiveis,
  getPlanoByAluno,
  getProximaAula,
  getResumoFrequencia,
  getStatusPagamento,
  getTurmasDisponiveisPorPlano
} from "@/lib/services/alunoService";
import { syncGoogleSheetsData } from "@/lib/services/googleSheetsService";
import {
  confirmarPresenca,
  getConfirmacaoPorAlunoEAula
} from "@/lib/services/confirmacaoService";
import { createGoogleCalendarUrl } from "@/lib/utils/calendar";
import type {
  AlunoStatus,
  Aula,
  PagamentoStatus
} from "@/lib/student-data";

const statusStyles: Record<AlunoStatus, string> = {
  ativo: "bg-emerald-100 text-emerald-700",
  pendente: "bg-cris-yellow/25 text-cris-navy",
  atrasado: "bg-cris-pink/20 text-cris-pink",
  inativo: "bg-cris-navy/10 text-cris-navy/60"
};

const paymentStyles: Record<PagamentoStatus, string> = {
  pago: "bg-emerald-100 text-emerald-700",
  pendente: "bg-cris-yellow/25 text-cris-navy",
  atrasado: "bg-cris-pink/20 text-cris-pink"
};

const achievementStyles = {
  pink: "bg-cris-pink text-white",
  blue: "bg-cris-blue text-white",
  purple: "bg-cris-purple text-white",
  yellow: "bg-cris-yellow text-cris-navy"
};

const challengeStyles = [
  "border-cris-pink/30 bg-cris-pink/10 text-cris-pink",
  "border-cris-yellow bg-cris-yellow/15 text-cris-navy",
  "border-cris-blue/30 bg-cris-blue/10 text-cris-blue",
  "border-cris-purple/30 bg-cris-purple/10 text-cris-purple"
];

function formatEntryDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function formatNextClassDate(aula: Aula) {
  const date = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(new Date(`${aula.data}T12:00:00`));

  return `${date} às ${aula.horario}`;
}

function formatDays(days: string[]) {
  const text =
    days.length > 1
      ? `${days.slice(0, -1).join(", ")} e ${days.at(-1)}`
      : days[0] ?? "";

  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function formatStatus(status: string) {
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function formatChallengeStatus(status: string) {
  return status === "em_breve"
    ? "Em breve"
    : status === "disponivel"
      ? "Disponível"
      : "Bloqueado";
}

export function StudentArea() {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [accessChecked, setAccessChecked] = useState(false);
  const [nextClass, setNextClass] = useState<Aula | null>(null);
  const [nextClassLoaded, setNextClassLoaded] = useState(false);
  const [presenceConfirmed, setPresenceConfirmed] = useState(false);
  const [dataRevision, setDataRevision] = useState(0);
  const [agendaFeedbackKey, setAgendaFeedbackKey] = useState<string | null>(
    null
  );

  const student = useMemo(
    () => getAlunoById(selectedStudentId),
    [selectedStudentId, dataRevision]
  );

  const studentId = student?.id ?? selectedStudentId;
  const plano = useMemo(
    () => getPlanoByAluno(studentId),
    [studentId, dataRevision]
  );
  const availableClasses = useMemo(
    () => getTurmasDisponiveisPorPlano(studentId),
    [studentId, dataRevision]
  );
  const frequency = useMemo(
    () => getResumoFrequencia(studentId),
    [studentId, dataRevision]
  );
  const achievements = useMemo(
    () => getConquistasDoAluno(studentId),
    [studentId, dataRevision]
  );
  const availableChallenges = useMemo(
    () => getDesafiosDisponiveis(studentId),
    [studentId, dataRevision]
  );
  const paymentStatus = useMemo(
    () => getStatusPagamento(studentId),
    [studentId, dataRevision]
  );
  const mainClass = availableClasses[0];
  const presenceKey = nextClass
    ? `${studentId}-${nextClass.id}`
    : `${studentId}-loading`;
  useEffect(() => {
    setSelectedStudentId(localStorage.getItem("alunoAtualId") ?? "");
    setAccessChecked(true);
    void syncGoogleSheetsData().then((synced) => {
      if (synced) setDataRevision((current) => current + 1);
    });
  }, []);

  useEffect(() => {
    if (!studentId) return;
    setNextClassLoaded(false);
    const nextClassResult = getProximaAula(studentId);
    setNextClass(nextClassResult);
    setPresenceConfirmed(
      nextClassResult
        ? Boolean(
            getConfirmacaoPorAlunoEAula(studentId, nextClassResult.id)
          )
        : false
    );
    setNextClassLoaded(true);
    setAgendaFeedbackKey(null);
  }, [studentId, dataRevision]);

  const confirmPresence = () => {
    if (!nextClass) return;

    void confirmarPresenca(studentId, nextClass.id);
    setPresenceConfirmed(true);
    setAgendaFeedbackKey(null);
  };

  const addToCalendar = () => {
    if (!nextClass || !presenceConfirmed) return;

    const calendarWindow = window.open(createGoogleCalendarUrl(nextClass), "_blank");

    if (calendarWindow) {
      calendarWindow.opener = null;
    }

    setAgendaFeedbackKey(
      calendarWindow ? presenceKey : `${presenceKey}-error`
    );
  };

  if (!accessChecked) {
    return null;
  }

  if (!student || student.status === "pendente" || student.status === "inativo") {
    const accessMessage =
      student?.status === "pendente"
        ? "Sua Área do Aluno ainda está pendente de confirmação. Finalize o pagamento para liberar as confirmações."
        : student?.status === "inativo"
          ? "Seu cadastro está inativo. Fale com o Cris para regularizar seu acesso."
          : "Entre com seu WhatsApp para acessar sua área.";

    return (
      <section className="premium-panel p-6 text-center sm:p-8">
        <HeartIcon className="mx-auto size-12 text-cris-pink" />
        <h1 className="mt-4 text-3xl font-black uppercase text-cris-navy">
          {accessMessage}
        </h1>
        <p className="mt-3 font-bold text-cris-navy/65">
          Errou... continua!
        </p>
        <Link
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-cris-pink px-6 py-3 font-black uppercase text-white shadow-pop"
          href="/entrar"
        >
          Entrar na minha área
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <header className="relative overflow-hidden rounded-lg bg-white p-5 shadow-pop ring-1 ring-cris-navy/10 sm:p-7">
        <div
          aria-hidden="true"
          className="paint-stroke absolute -right-10 top-5 h-9 w-44 bg-cris-pink"
        />
        <p className="text-sm font-black uppercase text-cris-blue">
          Seu cantinho no Zumba do Cris
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase leading-none text-cris-navy sm:text-6xl">
          💖 Minha Área
        </h1>
        <p className="mt-3 max-w-2xl text-base font-bold leading-relaxed text-cris-navy/70">
          Acompanhe sua turma, sua evolução e cada conquista dessa caminhada.
        </p>
      </header>

      {student.status === "atrasado" ? (
        <aside className="rounded-lg bg-cris-yellow p-4 font-black text-cris-navy shadow-pop">
          Seu plano está com pagamento pendente. Regularize para manter seu
          acesso.
        </aside>
      ) : null}

      <section className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
        <article className="relative overflow-hidden rounded-lg bg-cris-navy p-5 text-white shadow-pop sm:p-6">
          <div
            aria-hidden="true"
            className="paint-stroke absolute -right-8 top-6 h-8 w-36 bg-cris-yellow"
          />
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-cris-pink">
              <HeartIcon className="size-7" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-cris-yellow">
                Meu perfil
              </p>
              <h2 className="mt-1 text-3xl font-black">{student.nome}</h2>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-black uppercase text-white/55">Plano</dt>
              <dd className="mt-1 font-bold text-white">
                {plano
                  ? `${plano.nome} — R$${plano.valor}`
                  : "Plano não identificado"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase text-white/55">Status</dt>
              <dd className="mt-2">
                <span
                  className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-black uppercase ${statusStyles[student.status]}`}
                >
                  {formatStatus(student.status)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase text-white/55">
                Data de entrada
              </dt>
              <dd className="mt-1 font-bold text-white">
                {formatEntryDate(student.dataEntrada)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase text-white/55">
                Vencimento
              </dt>
              <dd className="mt-1 font-bold text-white">
                {student.diaVencimento
                  ? `Todo dia ${student.diaVencimento}`
                  : "Pagamento não informado."}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-black uppercase text-white/55">
                Pagamento
              </dt>
              <dd className="mt-2">
                {paymentStatus ? (
                  <span
                    className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-black uppercase ${paymentStyles[paymentStatus]}`}
                  >
                    {formatStatus(paymentStatus)}
                  </span>
                ) : (
                  <span className="font-bold text-white/70">
                    Pagamento não informado.
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </article>

        <article
          className={`p-5 sm:p-6 ${
            plano?.aulasPorSemana === 3
              ? "relative overflow-hidden rounded-lg bg-cris-navy text-white shadow-pop ring-4 ring-cris-yellow"
              : "premium-panel"
          }`}
        >
          {plano?.aulasPorSemana === 3 ? (
            <div
              aria-hidden="true"
              className="paint-stroke absolute -right-8 top-5 h-8 w-40 bg-cris-pink"
            />
          ) : null}
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-cris-blue text-white">
              <UsersIcon className="size-6" />
            </span>
            <div>
              <p
                className={`text-xs font-black uppercase ${
                  plano?.aulasPorSemana === 3
                    ? "text-cris-yellow"
                    : "text-cris-pink"
                }`}
              >
                {plano?.aulasPorSemana === 1
                  ? "Minha turma"
                  : plano?.aulasPorSemana === 2
                    ? "Minhas aulas disponíveis"
                    : plano?.aulasPorSemana === 3
                      ? "Passe 3x na semana"
                      : "Minhas aulas"}
              </p>
              <h2
                className={`mt-1 text-2xl font-black uppercase ${
                  plano?.aulasPorSemana === 3
                    ? "text-white"
                    : "text-cris-navy"
                }`}
              >
                {!plano
                  ? "Plano não identificado"
                  : plano.aulasPorSemana === 1
                    ? mainClass?.nome ?? student.turmaPrincipal
                    : `${availableClasses.length} opções para você`}
              </h2>
            </div>
          </div>

          {plano?.aulasPorSemana === 2 ? (
            <p className="mt-4 rounded-lg bg-cris-blue/10 p-3 text-sm font-bold leading-relaxed text-cris-navy/70">
              Seu plano permite participar de até 2 aulas por semana.
            </p>
          ) : null}

          {plano?.aulasPorSemana === 3 ? (
            <p className="mt-4 rounded-lg bg-cris-yellow px-4 py-3 text-sm font-black text-cris-navy">
              Você está no plano mais completo do Zumba do Cris.
            </p>
          ) : null}

          <div className="mt-5 grid gap-3">
            {availableClasses.length ? (
              availableClasses.map((turma) => (
                <div
                  className={`rounded-lg p-4 ${
                    plano?.aulasPorSemana === 3
                      ? "bg-white/10 ring-1 ring-white/15"
                      : "bg-cris-paper ring-1 ring-cris-navy/10"
                  }`}
                  key={turma.nome}
                >
                  <h3
                    className={`text-lg font-black uppercase ${
                      plano?.aulasPorSemana === 3
                        ? "text-cris-yellow"
                        : "text-cris-navy"
                    }`}
                  >
                    {turma.nome}
                  </h3>
                  <div
                    className={`mt-3 space-y-2 text-sm font-bold ${
                      plano?.aulasPorSemana === 3
                        ? "text-white/80"
                        : "text-cris-navy/70"
                    }`}
                  >
                    <p className="flex items-start gap-2">
                      <CalendarIcon className="mt-0.5 size-4 shrink-0 text-cris-pink" />
                      {formatDays(turma.dias)} às {turma.horario}
                    </p>
                    <p className="flex items-start gap-2">
                      <PinIcon className="mt-0.5 size-4 shrink-0 text-cris-blue" />
                      {turma.endereco}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-cris-paper p-4 font-bold text-cris-navy/65 ring-1 ring-cris-navy/10">
                Nenhuma turma disponível no momento.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="relative overflow-hidden rounded-lg bg-cris-pink p-5 text-white shadow-pop sm:p-6">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-12 size-40 rounded-full bg-cris-yellow/90"
        />
        <div className="relative flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-white text-cris-pink">
            <CalendarIcon className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase text-white/70">
              Próxima aula
            </p>
            <h2 className="mt-1 text-2xl font-black capitalize sm:text-3xl">
              {!nextClassLoaded
                ? "Calculando próxima aula..."
                : nextClass
                ? formatNextClassDate(nextClass)
                : "Nenhuma aula disponível para confirmação no momento."}
            </h2>
            <p className="mt-2 font-bold text-white/80">
              {nextClass
                ? `${nextClass.endereco} • ${nextClass.local}`
                : nextClassLoaded
                  ? "Assim que uma nova aula for agendada, ela aparecerá aqui."
                  : "Sua próxima oportunidade de dançar aparecerá aqui."}
            </p>

            <div className="mt-5">
              {nextClass && !presenceConfirmed ? (
                <button
                  className="min-h-12 w-full rounded-lg bg-cris-yellow px-5 py-3 text-sm font-black uppercase text-cris-navy shadow-[0_12px_28px_rgba(7,16,70,0.16)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-white/50 sm:w-auto"
                  disabled={!nextClass}
                  onClick={confirmPresence}
                  type="button"
                >
                  Confirmar presença
                </button>
              ) : nextClass && presenceConfirmed ? (
                <div className="rounded-lg bg-white/[0.12] p-4 ring-1 ring-white/20">
                  <p className="text-lg font-black text-cris-yellow">
                    Presença confirmada
                  </p>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-white/85">
                    Te esperamos na aula! Adicione na sua agenda para não
                    esquecer.
                  </p>
                  <button
                    className="mt-4 min-h-11 w-full rounded-lg border-2 border-white bg-transparent px-4 py-2.5 text-sm font-black uppercase text-white transition hover:bg-white hover:text-cris-pink focus:outline-none focus:ring-4 focus:ring-cris-yellow/50 sm:w-auto"
                    onClick={addToCalendar}
                    type="button"
                  >
                    Adicionar à agenda
                  </button>
                  {agendaFeedbackKey === presenceKey ? (
                    <p
                      aria-live="polite"
                      className="mt-3 text-xs font-bold text-white/70"
                    >
                      Agenda aberta! Confirme o evento no seu calendário.
                    </p>
                  ) : null}
                  {agendaFeedbackKey === `${presenceKey}-error` ? (
                    <p
                      aria-live="polite"
                      className="mt-3 text-xs font-bold text-white/70"
                    >
                      Não foi possível abrir a agenda automaticamente. Tente
                      novamente.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      <p className="-mt-3 px-1 text-xs font-bold leading-relaxed text-cris-navy/50">
        A confirmação registra apenas sua intenção de participar. A presença
        real será validada pelo professor futuramente.
      </p>

      <section>
        <div className="mb-4">
          <p className="text-sm font-black uppercase text-cris-blue">
            Movimento que vira história
          </p>
          <h2 className="mt-1 text-3xl font-black uppercase text-cris-navy">
            Frequência
          </h2>
        </div>

        <div className="grid gap-3 min-[420px]:grid-cols-3">
          <article className="rounded-lg bg-white p-4 text-center shadow-pop ring-1 ring-cris-navy/10">
            <p className="text-3xl font-black text-cris-pink">
              {frequency.aulasNoMes}
            </p>
            <p className="mt-2 text-xs font-black uppercase leading-tight text-cris-navy/60">
              Aulas no mês
            </p>
          </article>
          <article className="rounded-lg bg-cris-yellow p-4 text-center shadow-pop">
            <p className="text-3xl font-black text-cris-navy">
              {frequency.sequenciaAtual}
            </p>
            <p className="mt-2 text-xs font-black uppercase leading-tight text-cris-navy/60">
              Sequência atual
            </p>
          </article>
          <article className="rounded-lg bg-cris-blue p-4 text-center text-white shadow-pop">
            <p className="text-3xl font-black">{frequency.totalPresencas}</p>
            <p className="mt-2 text-xs font-black uppercase leading-tight text-white/70">
              Total de presenças
            </p>
          </article>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-cris-blue">
              Novos motivos para continuar
            </p>
            <h2 className="mt-1 text-3xl font-black uppercase text-cris-navy">
              Desafios
            </h2>
          </div>
          <span aria-hidden="true" className="text-3xl">
            🔥
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {availableChallenges.map((desafio, index) => (
            <article
              className={`relative overflow-hidden rounded-lg border-2 p-4 shadow-[0_12px_32px_rgba(7,16,70,0.08)] ${challengeStyles[index % challengeStyles.length]}`}
              key={desafio.id}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white/70">
                  <LockIcon className="size-5" />
                </span>
                <span className="rounded-lg bg-cris-navy px-3 py-1.5 text-[0.65rem] font-black uppercase text-white">
                  {formatChallengeStatus(desafio.statusVisual)}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-black uppercase leading-tight text-cris-navy">
                {desafio.titulo}
              </h3>
              <p className="mt-2 text-sm font-bold leading-relaxed text-cris-navy/65">
                {desafio.descricao}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-cris-pink">
              Cada passo merece festa
            </p>
            <h2 className="mt-1 text-3xl font-black uppercase text-cris-navy">
              Conquistas
            </h2>
          </div>
          <TrophyIcon className="size-9 text-cris-yellow" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map((achievement) => (
            <article
              className={`relative flex min-h-28 items-start gap-4 overflow-hidden rounded-lg p-4 shadow-pop ${
                achievement.desbloqueada
                  ? achievementStyles[achievement.accent]
                  : "bg-white text-cris-navy opacity-55 ring-1 ring-cris-navy/10"
              }`}
              key={achievement.id}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white/20">
                {achievement.desbloqueada ? (
                  <TrophyIcon className="size-6" />
                ) : (
                  <LockIcon className="size-5" />
                )}
              </span>
              <div>
                <h3 className="text-lg font-black uppercase leading-tight">
                  {achievement.titulo}
                </h3>
                <p className="mt-1 text-sm font-bold opacity-75">
                  {achievement.descricao}
                </p>
                <p className="mt-2 text-[0.65rem] font-black uppercase opacity-65">
                  {achievement.desbloqueada ? "Desbloqueada" : "Bloqueada"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
