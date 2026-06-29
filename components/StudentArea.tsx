"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
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
  getConfirmacaoRemotaPorAlunoEAula
} from "@/lib/services/confirmacaoService";
import { syncGoogleSheetsData } from "@/lib/services/googleSheetsService";
import {
  copiarPixMensalidade,
  enviarComprovanteMensalidade,
  getMensalidadeAtualDoAluno
} from "@/lib/services/financeiroService";
import type { AlunoStatus, Aula, PagamentoStatus } from "@/lib/student-data";
import { createGoogleCalendarUrl } from "@/lib/utils/calendar";

const studentStatusStyles: Record<AlunoStatus, string> = {
  ativo: "bg-emerald-100 text-emerald-700",
  pendente: "bg-cris-yellow/25 text-cris-navy",
  atrasado: "bg-cris-pink/20 text-cris-pink",
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
  const [studentId, setStudentId] = useState("");
  const [accessChecked, setAccessChecked] = useState(false);
  const [revision, setRevision] = useState(0);
  const [nextClass, setNextClass] = useState<Aula | null>(null);
  const [presenceRequested, setPresenceRequested] = useState(false);
  const [requestingPresence, setRequestingPresence] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [pixCopied, setPixCopied] = useState(false);
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

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
  const mensalidadeAtual = useMemo(
    () => getMensalidadeAtualDoAluno(studentId),
    [studentId, revision]
  );
  const currentPaymentStatus: PagamentoStatus =
    mensalidadeAtual?.status === "pago" ? "pago" : paymentStatus;

  useEffect(() => {
    if (!studentId) return;
    let active = true;

    void (async () => {
      let lesson = getProximaAula(studentId) ?? null;
      let requested = false;

      for (let index = 0; lesson && index < 8; index += 1) {
        const confirmation = await getConfirmacaoRemotaPorAlunoEAula(
          studentId,
          lesson.id
        );
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

    const timer = window.setInterval(() => {
      void getConfirmacaoRemotaPorAlunoEAula(studentId, nextClass.id).then(
        (confirmation) => {
          if (String(confirmation?.status).toLowerCase() === "aceita") {
            void syncGoogleSheetsData(["Confirmacoes", "Presencas"]).then(() =>
              setRevision((current) => current + 1)
            );
          }
        }
      );
    }, 10000);

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

  const copyMonthlyPix = async () => {
    setPaymentActionLoading(true);
    setPaymentMessage("");
    try {
      await copiarPixMensalidade(studentId);
      setPixCopied(true);
      setPaymentMessage("Chave PIX copiada. Agora envie seu comprovante.");
      setRevision((current) => current + 1);
    } catch {
      setPaymentMessage("PIX copiado, mas nao consegui registrar na planilha. Tente novamente.");
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const sendPaymentReceipt = async () => {
    setPaymentActionLoading(true);
    setPaymentMessage("");
    try {
      await enviarComprovanteMensalidade(studentId);
      setPaymentMessage("Comprovante enviado! Agora aguarde a confirmacao.");
      setRevision((current) => current + 1);
    } catch {
      setPaymentMessage("Nao consegui registrar o comprovante na planilha. Tente novamente.");
    } finally {
      setPaymentActionLoading(false);
    }
  };

  if (!accessChecked) return null;

  if (!student || student.status === "pendente" || student.status === "inativo") {
    const message =
      student?.status === "pendente"
        ? "Sua Área do Aluno está pendente de confirmação."
        : student?.status === "inativo"
          ? "Seu cadastro está inativo. Fale com o Cris para regularizar."
          : "Entre com seu WhatsApp para acessar sua área.";

    return (
      <section className="premium-panel p-6 text-center sm:p-8">
        <HeartIcon className="mx-auto size-12 text-cris-pink" />
        <h1 className="mt-4 text-3xl font-black uppercase text-cris-navy">
          {message}
        </h1>
        <p className="mt-3 font-bold text-cris-navy/65">Errou... continua!</p>
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

      {mensalidadeAtual ? (
        <section className="rounded-lg bg-white p-5 shadow-pop ring-1 ring-cris-navy/10 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-cris-yellow text-cris-navy">
              <MoneyIcon className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase text-cris-pink">
                Mensalidade do mes
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase text-cris-navy">
                {mensalidadeAtual.mesReferencia} - R${mensalidadeAtual.valor}
              </h2>
              <p className="mt-2 font-bold text-cris-navy/65">
                Vencimento dia 8. Status:{" "}
                {mensalidadeAtual.status.replace("_", " ")}
              </p>

              {mensalidadeAtual.status === "pago" ? (
                <p className="mt-4 rounded-lg bg-emerald-100 p-4 font-black text-emerald-700">
                  Pagamento confirmado. Obrigado!
                </p>
              ) : mensalidadeAtual.status === "comprovante_enviado" ? (
                <p className="mt-4 rounded-lg bg-cris-yellow/25 p-4 font-black text-cris-navy">
                  Comprovante enviado. Aguarde a confirmacao do professor.
                </p>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    className="min-h-12 rounded-lg bg-cris-yellow px-5 py-3 text-sm font-black uppercase text-cris-navy shadow-pop disabled:opacity-60"
                    disabled={paymentActionLoading}
                    onClick={copyMonthlyPix}
                    type="button"
                  >
                    Copiar chave PIX
                  </button>
                  <button
                    className="min-h-12 rounded-lg bg-cris-pink px-5 py-3 text-sm font-black uppercase text-white shadow-pop disabled:opacity-50"
                    disabled={!pixCopied || paymentActionLoading}
                    onClick={sendPaymentReceipt}
                    type="button"
                  >
                    Comprovante enviado
                  </button>
                </div>
              )}
              {paymentMessage ? (
                <p className="mt-3 font-black text-cris-pink" aria-live="polite">
                  {paymentMessage}
                </p>
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
                {plan?.aulasPorSemana === 1 ? "Minha aula" : "Minhas aulas"}
              </p>
              <h2 className="text-2xl font-black uppercase text-cris-navy">
                Turmas escolhidas
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
        {challenges.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {challenges.map((challenge) => (
              <article className="rounded-lg bg-white p-4 shadow-pop ring-1 ring-cris-navy/10" key={challenge.id}>
                <p className="text-xs font-black uppercase text-cris-purple">Em breve</p>
                <h3 className="mt-2 text-xl font-black text-cris-navy">{challenge.titulo}</h3>
                <p className="mt-2 font-bold text-cris-navy/60">{challenge.descricao}</p>
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
              <article className="rounded-lg bg-white p-4 shadow-pop ring-1 ring-cris-navy/10" key={achievement.id}>
                <h3 className="text-lg font-black uppercase text-cris-navy">{achievement.titulo}</h3>
                <p className="mt-2 font-bold text-cris-navy/60">{achievement.descricao}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-white p-4 font-bold text-cris-navy/60 ring-1 ring-cris-navy/10">
            Suas conquistas aparecerão aqui conforme sua evolução nas aulas.
          </p>
        )}
      </section>
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
