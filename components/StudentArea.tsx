"use client";

import Link from "next/link";
import { PatriotaChallenge } from "@/components/PatriotaChallenge";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarIcon,
  HeartIcon,
  MoneyIcon,
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
import {
  confirmarPresenca,
  getConfirmacaoRemotaPorAlunoEAula,
  getConfirmacoesRemotasDoAluno
} from "@/lib/services/confirmacaoService";
import { syncGoogleSheetsData } from "@/lib/services/googleSheetsService";
import {
  copiarPixMensalidade,
  formatMesReferencia,
  getMensalidadeAtualDoAluno
} from "@/lib/services/financeiroService";
import { pixKey } from "@/lib/data";
import type { AlunoStatus, Aula, PagamentoStatus, ConquistaVisual } from "@/lib/student-data";
import { createGoogleCalendarUrl } from "@/lib/utils/calendar";

const studentStatusStyles: Record<AlunoStatus, string> = {
  ativo: "bg-emerald-100 text-emerald-700",
  pendente: "bg-cris-yellow/25 text-cris-navy",
  inativo: "bg-cris-navy/10 text-cris-navy/60"
};

function getPaymentStyle(status: PagamentoStatus) {
  return status === "pago"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-cris-pink/20 text-cris-pink";
}

function capitalize(value: string) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "";
}

function formatDate(value: string) {
  if (!value) return "Data não informada";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatLessonDate(aula: Aula) {
  if (!aula.data) return `${capitalize(aula.diaSemana)} às ${aula.horario}`;
  const date = new Date(`${aula.data}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return `${capitalize(aula.diaSemana)} às ${aula.horario}`;
  }
  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(date);
  return `${label} às ${aula.horario}`;
}

function formatDays(days: string[]) {
  if (!Array.isArray(days) || !days.length) return "Dias não informados";
  const text =
    days.length > 1
      ? `${days.slice(0, -1).join(", ")} e ${days.at(-1)}`
      : days[0];
  return capitalize(text);
}

function localDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

export function StudentArea() {
  const [shareAchievement, setShareAchievement] = useState<ConquistaVisual | null>(null);
  const [studentId, setStudentId] = useState("");
  const [accessChecked, setAccessChecked] = useState(false);
  const [revision, setRevision] = useState(0);
  const [nextClass, setNextClass] = useState<Aula | null>(null);
  const [presenceRequested, setPresenceRequested] = useState(false);
  const [requestingPresence, setRequestingPresence] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [copyingPix, setCopyingPix] = useState(false);
  const [pixFeedback, setPixFeedback] = useState("");

  useEffect(() => {
    setStudentId(localStorage.getItem("alunoAtualId") ?? "");
    setAccessChecked(true);
    void syncGoogleSheetsData([
      "Alunos",
      "Presencas",
      "Conquistas",
      "Mensalidades"
    ]).then((synced) => {
      if (synced) setRevision((current) => current + 1);
    });
  }, []);

  const student = useMemo(
    () => getAlunoById(studentId),
    [studentId, revision]
  );
  const plan = useMemo(() => getPlanoByAluno(studentId), [studentId, revision]);
  const classes = useMemo(
    () => getTurmasDisponiveisPorPlano(studentId),
    [studentId, revision]
  );
  const frequency = useMemo(
    () => getResumoFrequencia(studentId),
    [studentId, revision]
  );
  const challenges = useMemo(
    () => getDesafiosDisponiveis(studentId),
    [studentId, revision]
  );
  const achievements = useMemo(
    () => getConquistasDoAluno(studentId),
    [studentId, revision]
  );
  const paymentStatus = useMemo(
    () => getStatusPagamento(studentId),
    [studentId, revision]
  );
  const currentPaymentStatus: PagamentoStatus = paymentStatus;
  const currentMonthlyPayment = useMemo(
    () => (studentId ? getMensalidadeAtualDoAluno(studentId) : null),
    [studentId, revision]
  );

  const copyPix = async () => {
    if (!studentId || copyingPix) return;
    setCopyingPix(true);
    setPixFeedback("");
    try {
      await copiarPixMensalidade(studentId);
      setPixFeedback(
        "Chave PIX copiada com sucesso. Envie o comprovante e aguarde a baixa no sistema."
      );
      setRevision((current) => current + 1);
    } catch (error) {
      setPixFeedback(
        error instanceof Error
          ? `A chave esta abaixo para copia manual. ${error.message}`
          : "A chave esta abaixo para copia manual."
      );
    } finally {
      setCopyingPix(false);
    }
  };

  useEffect(() => {
    if (!studentId) return;
    let active = true;

    void (async () => {
      let lesson = getProximaAula(studentId) ?? null;
      const confirmations = lesson ? await getConfirmacoesRemotasDoAluno(studentId) : [];
      let requested = false;

      for (let index = 0; lesson && index < 8; index += 1) {
        const lessonId = lesson.id;
        const confirmation = confirmations.find(row => String(row.alunoId) === studentId && String(row.aulaId) === lessonId);
        const status = String(confirmation?.status ?? "").toLowerCase();

        if (status !== "aceita") {
          requested = status === "solicitada" || status === "confirmado";
          break;
        }

        const afterAcceptedLesson = new Date(`${lesson.data}T23:59:59`);
        lesson = getProximaAula(studentId, afterAcceptedLesson) ?? null;
      }

      if (active) {
        setNextClass(lesson);
        setPresenceRequested(requested);
      }
    })();

    return () => {
      active = false;
    };
  }, [studentId, revision]);

  useEffect(() => {
    if (!presenceRequested || !nextClass) return;

    let checking = false;
    const timer = window.setInterval(() => {
      if (document.hidden || checking) return;
      checking = true;
      void getConfirmacaoRemotaPorAlunoEAula(studentId, nextClass.id).then(
        (confirmation) => {
          if (String(confirmation?.status).toLowerCase() === "aceita") {
            void syncGoogleSheetsData(["Confirmacoes", "Presencas"]).then(() =>
              setRevision((current) => current + 1)
            );
          }
        }
      ).finally(() => { checking = false; });
    }, 30000);

    return () => window.clearInterval(timer);
  }, [nextClass, presenceRequested, studentId]);

  const canRequestPresence = nextClass?.data === localDateKey();

  const requestPresence = async () => {
    if (!nextClass || !canRequestPresence || requestingPresence) return;
    setRequestingPresence(true);
    setRequestError("");
    try {
      await confirmarPresenca(studentId, nextClass);
      setPresenceRequested(true);
    } catch {
      setRequestError("Não foi possível enviar agora. Tente novamente.");
    } finally {
      setRequestingPresence(false);
    }
  };

  const addToCalendar = () => {
    if (!nextClass) return;
    const calendarWindow = window.open(
      createGoogleCalendarUrl(nextClass),
      "_blank",
      "noopener,noreferrer"
    );
    if (calendarWindow) calendarWindow.opener = null;
  };

  if (!accessChecked) return null;

  if (!student || student.status === "pendente" || student.status === "inativo") {
    const message =
      student?.status === "pendente"
        ? "Seu cadastro está em análise."
        : student?.status === "inativo"
          ? "Seu cadastro está inativo. Fale com o Cris para regularizar."
          : "Entre com seu WhatsApp para acessar sua área.";

    return (
      <section className="premium-panel p-6 text-center sm:p-8">
        <HeartIcon className="mx-auto size-12 text-cris-pink" />
        <h1 className="mt-4 text-3xl font-black uppercase text-cris-navy">
          {message}
        </h1>
        <p className="mt-3 font-bold text-cris-navy/65">
          {student?.status === "pendente"
            ? "Assim que for liberado, sua Área do Aluno ficará disponível."
            : "Errou... continua!"}
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
        <div className="paint-stroke absolute -right-10 top-5 h-9 w-44 bg-cris-pink" />
        <p className="text-sm font-black uppercase text-cris-blue">
          Seu cantinho no Zumba do Cris
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase leading-none text-cris-navy sm:text-6xl">
          Minha Área
        </h1>
        <p className="mt-3 font-bold text-cris-navy/65">
          Movimento que vira história. Cada passo merece festa.
        </p>
      </header>

      {currentPaymentStatus === "atrasado" ? (
        <aside className="rounded-lg bg-cris-yellow p-4 font-black text-cris-navy shadow-pop">
          Seu plano está em atraso. Regularize para manter seu acesso.
        </aside>
      ) : null}

      {currentMonthlyPayment && currentMonthlyPayment.status !== "pago" ? (
        <section className="premium-panel p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-cris-yellow text-cris-navy">
              <MoneyIcon className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase text-cris-pink">
                Mensalidade do mes
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase text-cris-navy sm:text-3xl">
                {formatMesReferencia(currentMonthlyPayment.mesReferencia)} - R${currentMonthlyPayment.valor}
              </h2>
              <p className="mt-2 font-bold text-cris-navy/60">
                Vencimento todo dia 8.
              </p>
              <button
                className="mt-4 min-h-12 w-full rounded-lg bg-cris-yellow px-5 py-3 text-sm font-black uppercase text-cris-navy disabled:opacity-50 sm:w-auto"
                disabled={copyingPix || currentMonthlyPayment.status === "comprovante_enviado"}
                onClick={copyPix}
                type="button"
              >
                {copyingPix
                  ? "Copiando..."
                  : currentMonthlyPayment.status === "comprovante_enviado"
                    ? "Solicitacao enviada"
                    : "Copiar chave PIX"}
              </button>
              <p className="mt-3 break-all rounded-lg bg-cris-paper p-3 text-sm font-black text-cris-navy ring-1 ring-cris-navy/10">
                Chave PIX: {pixKey}
              </p>
              {pixFeedback ? (
                <p className="mt-3 font-bold text-cris-pink">{pixFeedback}</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg bg-cris-navy p-5 text-white shadow-pop sm:p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-lg bg-cris-pink">
              <HeartIcon className="size-7" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-cris-yellow">Meu perfil</p>
              <h2 className="mt-1 text-3xl font-black">{student.nome}</h2>
            </div>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <ProfileItem label="Plano">
              {plan ? `${plan.nome} — R$${plan.valor}` : student.plano}
            </ProfileItem>
            <ProfileItem label="Cadastro">
              <span className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase ${studentStatusStyles[student.status]}`}>
                {capitalize(student.status)}
              </span>
            </ProfileItem>
            <ProfileItem label="Pagamento">
              <span className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase ${getPaymentStyle(currentPaymentStatus)}`}>
                {capitalize(currentPaymentStatus)}
              </span>
            </ProfileItem>
            <ProfileItem label="Data de entrada">{formatDate(student.dataEntrada)}</ProfileItem>
            <ProfileItem label="Vencimento">Todo dia 8</ProfileItem>
          </dl>
        </article>

        <article className="premium-panel p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-lg bg-cris-blue text-white">
              <UsersIcon className="size-6" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-cris-pink">
                {plan?.aulasPorSemana === "ilimitado"
                  ? "Acesso livre"
                  : plan?.aulasPorSemana === 1
                    ? "Minha aula"
                    : "Minhas aulas"}
              </p>
              <h2 className="text-2xl font-black uppercase text-cris-navy">
                {plan?.aulasPorSemana === "ilimitado"
                  ? "Todas as aulas liberadas"
                  : "Turmas escolhidas"}
              </h2>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {classes.length ? classes.map((item) => (
              <div className="rounded-lg bg-cris-paper p-4 ring-1 ring-cris-navy/10" key={item.id}>
                <h3 className="text-lg font-black uppercase text-cris-navy">{item.nome}</h3>
                <p className="mt-2 flex gap-2 text-sm font-bold text-cris-navy/65">
                  <CalendarIcon className="size-4 shrink-0 text-cris-pink" />
                  {formatDays(item.dias)} às {item.horario}
                </p>
                <p className="mt-2 flex gap-2 text-sm font-bold text-cris-navy/65">
                  <PinIcon className="size-4 shrink-0 text-cris-blue" />
                  {item.endereco}
                </p>
              </div>
            )) : (
              <p className="rounded-lg bg-cris-paper p-4 font-bold text-cris-navy/60">
                Nenhuma turma escolhida no cadastro.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-lg bg-cris-pink p-5 text-white shadow-pop sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-white text-cris-pink">
            <CalendarIcon className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase text-white/70">Próxima aula</p>
            <h2 className="mt-1 text-2xl font-black capitalize sm:text-3xl">
              {nextClass ? formatLessonDate(nextClass) : "Nenhuma aula disponível"}
            </h2>
            <p className="mt-2 font-bold text-white/80">
              {nextClass ? `${nextClass.local} • ${nextClass.endereco}` : "Confira suas turmas escolhidas."}
            </p>

            {nextClass ? (
              presenceRequested ? (
                <div className="mt-5 rounded-lg bg-white/15 p-4 ring-1 ring-white/20">
                  <p className="text-lg font-black text-cris-yellow">Solicitação enviada</p>
                  <p className="mt-2 text-sm font-bold text-white/85">
                    O professor ainda precisa validar sua presença.
                  </p>
                  <button className="mt-4 min-h-11 rounded-lg border-2 border-white px-4 py-2 text-sm font-black uppercase" onClick={addToCalendar} type="button">
                    Adicionar à agenda
                  </button>
                </div>
              ) : canRequestPresence ? (
                <button
                  className="mt-5 min-h-12 w-full rounded-lg bg-cris-yellow px-5 py-3 text-sm font-black uppercase text-cris-navy sm:w-auto"
                  disabled={requestingPresence}
                  onClick={requestPresence}
                  type="button"
                >
                  {requestingPresence ? "Enviando..." : "Solicitar presença"}
                </button>
              ) : (
                <div className="mt-5 rounded-lg bg-white/15 p-4 ring-1 ring-white/20">
                  <p className="font-black text-cris-yellow">
                    Confirmação disponível no dia da aula
                  </p>
                  <p className="mt-2 text-sm font-bold text-white/85">
                    Você poderá solicitar presença em {formatDate(nextClass.data)}.
                  </p>
                  <button
                    className="mt-4 min-h-11 rounded-lg border-2 border-white px-4 py-2 text-sm font-black uppercase"
                    onClick={addToCalendar}
                    type="button"
                  >
                    Adicionar à agenda
                  </button>
                </div>
              )
            ) : null}
            {requestError ? <p className="mt-3 font-bold text-white">{requestError}</p> : null}
          </div>
        </div>
      </section>

      <section>
        <p className="text-sm font-black uppercase text-cris-blue">Movimento que vira história</p>
        <h2 className="mt-1 text-3xl font-black uppercase text-cris-navy">Frequência</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Metric value={frequency.aulasNoMes} label="Aulas no mês" color="pink" />
          <Metric value={frequency.sequenciaAtual} label="Sequência" color="yellow" />
          <Metric value={frequency.totalPresencas} label="Total" color="blue" />
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-black uppercase text-cris-navy">Desafios</h2>
        <PatriotaChallenge alunoId={student.id} whatsapp={student.whatsapp} onAwarded={() => setRevision(v => v + 1)} />
        {challenges.length ? (
          <div className="mt-4 grid gap-4">
            {challenges.map((challenge) => (
              <article
                className="relative overflow-hidden rounded-lg border border-cris-purple/15 bg-[linear-gradient(145deg,#fff7fb_0%,#f5eaff_38%,#e7f7ff_72%,#fff4c8_100%)] p-5 shadow-[0_20px_48px_rgba(104,42,167,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] sm:p-6"
                key={challenge.id}
              >
                <div
                  aria-hidden="true"
                  className="absolute -right-12 -top-12 size-40 rounded-full bg-cris-yellow/35 blur-2xl"
                />
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 right-2 h-24 w-44 opacity-20 sm:opacity-100"
                >
                  <div className="absolute bottom-3 left-2 h-12 w-40 rounded-[1.4rem_1.4rem_0.7rem_0.7rem] bg-cris-purple shadow-[inset_0_5px_0_rgba(255,255,255,0.18),0_8px_0_#071046]" />
                  <div className="absolute bottom-11 left-5 h-10 w-[4.3rem] rotate-[-3deg] rounded-lg bg-cris-pink shadow-inner" />
                  <div className="absolute bottom-11 right-5 h-10 w-[4.3rem] rotate-[3deg] rounded-lg bg-cris-blue shadow-inner" />
                  <div className="absolute bottom-0 left-5 h-4 w-3 rounded-b bg-cris-navy" />
                  <div className="absolute bottom-0 right-5 h-4 w-3 rounded-b bg-cris-navy" />
                </div>
                <div className="relative">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase text-cris-purple">
                        {challenge.periodo} ·{" "}
                        {challenge.statusExecucao === "concluido"
                          ? "Concluído"
                          : challenge.statusExecucao === "em_andamento"
                            ? "Em andamento"
                            : "Fora do período"}
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-cris-navy">
                        <span className="mr-2" aria-hidden="true">🛋️</span>
                        {challenge.titulo.replace("🛋️", "").trim()}
                      </h3>
                    </div>
                    <span className="rounded-lg border border-white/80 bg-cris-navy px-3 py-2 text-xs font-black uppercase text-cris-yellow shadow-sm">
                      {challenge.recompensa}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-black text-cris-purple">
                    {challenge.chamada}
                  </p>
                  <p className="mt-2 font-bold leading-relaxed text-cris-navy/65">
                    {challenge.descricao}
                  </p>

                  <div className="mt-5 flex items-end justify-between gap-4">
                    <p className="text-sm font-black uppercase text-cris-navy">
                      Progresso
                    </p>
                    <p className="text-2xl font-black text-cris-blue">
                      {challenge.progresso ?? 0}/{challenge.meta}
                    </p>
                  </div>
                  <div
                    aria-label={`${challenge.progresso ?? 0} de ${challenge.meta} presenças`}
                    className="mt-2 h-3 overflow-hidden rounded-full bg-white/80 ring-1 ring-cris-purple/15 sm:max-w-[70%]"
                    role="progressbar"
                    aria-valuemax={challenge.meta}
                    aria-valuemin={0}
                    aria-valuenow={challenge.progresso ?? 0}
                  >
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#f20772,#7128ce,#25b8ec,#ffc400)] transition-[width] duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          ((challenge.progresso ?? 0) / challenge.meta) * 100
                        )}%`
                      }}
                    />
                  </div>
                  <p className="mt-4 rounded-lg bg-white/75 p-3 font-black text-cris-navy/75 backdrop-blur sm:max-w-[70%]">
                    {challenge.mensagem}
                  </p>
                  <p className="mt-3 text-xs font-bold text-cris-navy/50 sm:max-w-[70%]">
                    A meta já considera a semana especial com uma aula por turma.
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-white p-4 font-bold text-cris-navy/60 ring-1 ring-cris-navy/10">
            Novos desafios aparecerão aqui em breve.
          </p>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black uppercase text-cris-navy">Conquistas</h2>
          <TrophyIcon className="size-9 text-cris-yellow" />
        </div>
        {achievements.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {achievements.map((achievement) => (
              <button type="button" disabled={!achievement.desbloqueada}
                aria-label={achievement.desbloqueada ? `Compartilhar selo ${achievement.titulo}` : `${achievement.titulo}: selo bloqueado`}
                onClick={() => setShareAchievement(achievement)}
                className={`w-full text-left rounded-lg p-4 shadow-pop ring-1 focus-visible:outline-2 focus-visible:outline-cris-blue ${
                  achievement.accent === "sofa"
                    ? "bg-[linear-gradient(145deg,#fff7fb,#f1e6ff,#e3f7ff)] ring-cris-purple/20"
                    : "bg-white ring-cris-navy/10"
                }`}
                key={achievement.id}
              >
                <div className="flex items-center gap-3">
                  <span className={`grid size-12 shrink-0 place-items-center rounded-full border-2 ${
                    achievement.desbloqueada
                      ? "border-white bg-cris-blue text-white shadow-[0_6px_18px_rgba(37,184,236,0.35)]"
                      : "border-cris-navy/10 bg-white/60 text-cris-navy/30"
                  }`}>
                    {achievement.accent === "sofa" ? (
                      <span className="text-xl" aria-hidden="true">🛋️</span>
                    ) : achievement.id === "patriota-2026" ? (
                      <span className="text-xl" aria-hidden="true">🇧🇷</span>
                    ) : (
                      <TrophyIcon className="size-6" />
                    )}
                  </span>
                  <div>
                    <p className="text-[0.65rem] font-black uppercase text-cris-purple">
                      {achievement.desbloqueada ? "Selo conquistado" : "Selo bloqueado"}
                    </p>
                    <h3 className="text-lg font-black uppercase text-cris-navy">{achievement.titulo}</h3>
                  </div>
                </div>
                <p className="mt-2 font-bold text-cris-navy/60">{achievement.descricao}</p>
                {achievement.desbloqueada && <p className="mt-3 text-sm font-black text-cris-purple">Toque para compartilhar ↗</p>}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-white p-4 font-bold text-cris-navy/60 ring-1 ring-cris-navy/10">
            Suas conquistas aparecerão aqui conforme sua evolução nas aulas.
          </p>
        )}
      </section>
      {shareAchievement && <AchievementShare achievement={shareAchievement} nome={student.nome} onClose={() => setShareAchievement(null)} />}
    </div>
  );
}

function ProfileItem({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase text-white/55">{label}</dt>
      <dd className="mt-2 font-bold text-white">{children}</dd>
    </div>
  );
}

function Metric({ value, label, color }: { value: number; label: string; color: "pink" | "yellow" | "blue" }) {
  const styles = {
    pink: "bg-cris-pink text-white",
    yellow: "bg-cris-yellow text-cris-navy",
    blue: "bg-cris-blue text-white"
  };
  return (
    <article className={`rounded-lg p-4 text-center shadow-pop ${styles[color]}`}>
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-2 text-xs font-black uppercase leading-tight opacity-75">{label}</p>
    </article>
  );
}


// Generate the actual Story image locally: no upload, API call or new dependency.
async function achievementStory(achievement: ConquistaVisual, nome: string): Promise<Blob> {
  const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível preparar a imagem neste navegador.");
  const logo = new Image();
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Não foi possível carregar a logo. Tente novamente.")), 12000);
    logo.onload = () => { clearTimeout(timer); resolve(); };
    logo.onerror = () => { clearTimeout(timer); reject(new Error("Não foi possível carregar a logo. Tente novamente.")); };
    logo.src = "/references/logo-sem-fundo.png";
  });
  const patriota = achievement.id === "patriota-2026";
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#fffaf0"); gradient.addColorStop(.55, patriota ? "#e6f6e9" : "#f0e6ff"); gradient.addColorStop(1, "#e1f5ff");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1920);
  function circle(x: number, y: number, radius: number, color: string) { ctx!.fillStyle=color; ctx!.beginPath(); ctx!.arc(x,y,radius,0,Math.PI*2); ctx!.fill(); }
  circle(-90,620,150,"#ffc400"); circle(1200,1440,170,"#f20772"); circle(1140,180,130,"#25b8ec");
  // Transparent source has wide margins; the visible mark stays smaller than the badge.
  const ratio = Math.min(560/logo.naturalWidth,840/logo.naturalHeight);
  ctx.drawImage(logo,540-logo.naturalWidth*ratio/2,-110,logo.naturalWidth*ratio,logo.naturalHeight*ratio);
  function text(value: string,y: number,size: number,color="#071046",weight=900) {
    ctx!.textAlign="center";ctx!.fillStyle=color;
    do {ctx!.font=`${weight} ${size}px Arial, sans-serif`;size--;} while(ctx!.measureText(value).width>900 && size>14);
    ctx!.fillText(value,540,y);
  }
  text("MAIS UMA CONQUISTA!",510,36,"#7128ce");
  circle(540,810,245,"#071046");circle(540,790,232,"#ffc400");circle(540,790,207,"#ffffff");
  if(patriota){
    ctx.fillStyle="#168144";ctx.fillRect(375,680,330,220);
    ctx.fillStyle="#ffc400";ctx.beginPath();ctx.moveTo(540,702);ctx.lineTo(683,790);ctx.lineTo(540,878);ctx.lineTo(397,790);ctx.closePath();ctx.fill();
    circle(540,790,62,"#183a8b");ctx.strokeStyle="white";ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(483,775);ctx.quadraticCurveTo(540,767,595,807);ctx.stroke();
  } else {
    ctx.fillStyle="#7128ce";ctx.fillRect(391,720,298,143);
    ctx.fillStyle="#f20772";ctx.fillRect(402,725,132,89);ctx.fillStyle="#25b8ec";ctx.fillRect(546,725,132,89);
    ctx.fillStyle="#7128ce";ctx.fillRect(365,799,350,75);ctx.fillRect(365,773,34,77);ctx.fillRect(681,773,34,77);
    ctx.fillStyle="#071046";ctx.fillRect(390,874,23,32);ctx.fillRect(666,874,23,32);
  }
  text("SELO DESBLOQUEADO",1100,30,"#7128ce");
  text(patriota ? "EU SOU PATRIOTA!" : "VENCI O SOFÁ!",1200,78);
  const firstName=nome.trim().split(/\s+/)[0] || "Eu";
  text(firstName,1320,60,"#7128ce");
  text(patriota ? "Participei do aulão especial" : "Completei a meta de presenças",1410,39,"#071046",700);
  text(patriota ? "de 7 de setembro e ganhei este selo!" : "do meu plano nas aulas de agosto!",1470,39,"#071046",700);
  text(patriota ? "7 DE SETEMBRO · 2026" : "AGOSTO · 2026",1570,28,"#7128ce");
  text("ERROU... CONTINUA!",1720,43);text("ZUMBA DO CRIS",1780,29,"#7128ce");
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Não foi possível gerar a imagem.")),"image/png"));
}

function AchievementShare({ achievement, nome, onClose }: { achievement: ConquistaVisual; nome: string; onClose: () => void }) {
  const dialog=useRef<HTMLDialogElement>(null);
  const [file,setFile]=useState<File|null>(null);
  const [url,setUrl]=useState("");
  const [message,setMessage]=useState("");
  const [sharing,setSharing]=useState(false);
  const [attempt,setAttempt]=useState(0);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    const element=dialog.current; const previous=document.activeElement as HTMLElement|null;
    const overflow=document.body.style.overflow;document.body.style.overflow="hidden";
    element?.showModal();
    return()=>{element?.close();document.body.style.overflow=overflow;previous?.focus({preventScroll:true});};
  },[]);
  useEffect(()=>{
    let active=true;let imageUrl="";setFailed(false);setMessage("");setFile(null);setUrl("");
    void achievementStory(achievement,nome).then(blob=>{
      if(!active)return;imageUrl=URL.createObjectURL(blob);setUrl(imageUrl);
      setFile(new File([blob],`zumba-do-cris-${achievement.id}.png`,{type:"image/png"}));
    }).catch(error=>{if(active){setFailed(true);setMessage(error instanceof Error?error.message:"Não foi possível gerar o card.");}});
    return()=>{active=false;if(imageUrl)URL.revokeObjectURL(imageUrl);};
  },[achievement,nome,attempt]);
  async function share(){
    if(!file||sharing)return;
    if(!navigator.canShare?.({files:[file]})||!navigator.share){setMessage("Salve a imagem e abra o Instagram para adicioná-la ao seu Story.");return;}
    setSharing(true);setMessage("");
    try{await navigator.share({files:[file]});}
    catch(error){if(!(error instanceof Error && error.name==="AbortError"))setMessage("O compartilhamento não abriu. Use Salvar imagem e publique pelo Instagram.");}
    finally{setSharing(false);}
  }
  return <dialog ref={dialog} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}
    aria-labelledby="share-selo-title" className="m-auto max-h-[92dvh] w-[min(94vw,440px)] overflow-y-auto rounded-2xl bg-white p-4 text-cris-navy shadow-xl backdrop:bg-cris-navy/70">
    <div className="flex items-center justify-between gap-2"><h2 id="share-selo-title" className="text-xl font-black">Minha conquista</h2><button type="button" onClick={onClose} className="min-h-11 px-3 font-bold" aria-label="Fechar card">✕</button></div>
    {url?<img src={url} alt={`Card ${achievement.titulo} de ${nome}`} className="mx-auto mt-2 max-h-[52dvh] w-auto rounded-lg" />:<p role="status" className="py-10 text-center">{failed?"Não foi possível preparar o card.":"Preparando seu card..."}</p>}
    <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={!file||sharing} onClick={share} className="min-h-12 rounded-lg bg-cris-purple px-3 font-black text-white disabled:opacity-50">{sharing?"Abrindo...":"Compartilhar"}</button>
    <button type="button" disabled={!file} className="min-h-12 rounded-lg border-2 border-cris-purple px-3 font-black disabled:opacity-50" onClick={()=>{if(!file)return;const a=document.createElement("a");a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setMessage("Se a imagem abrir em outra tela, toque e segure para salvá-la. Depois publique nos Stories.");}}>Salvar imagem</button></div>
    <p className="mt-3 text-sm">Compartilhe pelo menu do celular ou salve a imagem para publicar nos Stories do Instagram.</p>
    {message&&<p role="status" className="mt-3 text-sm font-bold">{message}</p>}
    {failed&&<button type="button" onClick={()=>setAttempt(v=>v+1)} className="mt-3 min-h-11 font-bold underline">Tentar novamente</button>}
  </dialog>;
}
