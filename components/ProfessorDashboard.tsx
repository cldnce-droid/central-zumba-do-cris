"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarIcon,
  MoneyIcon,
  TrophyIcon,
  UsersIcon
} from "@/components/Icons";
import { aulas } from "@/lib/student-data/mockData";
import type {
  AlunoStatus,
  PagamentoStatus
} from "@/lib/student-data";
import {
  atualizarStatusAluno,
  atualizarStatusPagamento,
  getAlunosProfessor,
  getConfirmacoesProfessor,
  getPagamentosProfessor,
  getPresencasProfessor,
  getProximasAulasProfessor,
  getResumoDashboard,
  sincronizarDashboardProfessor,
  validarPresenca
} from "@/lib/services/professorService";

const studentStatuses: AlunoStatus[] = [
  "ativo",
  "pendente",
  "atrasado",
  "inativo"
];
const paymentStatuses: PagamentoStatus[] = ["pago", "pendente", "atrasado"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${value}T12:00:00`)
  );
}

export function ProfessorDashboard() {
  const [revision, setRevision] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const data = useMemo(() => {
    const students = getAlunosProfessor();
    return {
      students,
      summary: getResumoDashboard(),
      confirmations: getConfirmacoesProfessor(),
      presences: getPresencasProfessor(),
      payments: getPagamentosProfessor(),
      classes: getProximasAulasProfessor()
    };
  }, [revision]);

  const refresh = () => setRevision((value) => value + 1);

  useEffect(() => {
    void sincronizarDashboardProfessor().then(refresh);
  }, []);

  const logout = async () => {
    setIsLeaving(true);
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin"
      });
    } finally {
      window.location.assign("/professor-login");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="relative overflow-hidden rounded-lg bg-cris-navy p-6 text-white shadow-pop sm:p-8">
        <div
          aria-hidden="true"
          className="paint-stroke absolute -right-8 top-7 h-10 w-48 bg-cris-pink"
        />
        <p className="text-sm font-black uppercase text-cris-yellow">
          Central Zumba do Cris
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase leading-none sm:text-6xl">
          Dashboard do Professor
        </h1>
        <button
          className="relative z-10 mt-5 min-h-11 rounded-lg border-2 border-white/40 px-5 py-2 font-black uppercase text-white transition hover:bg-white hover:text-cris-navy disabled:opacity-60"
          disabled={isLeaving}
          onClick={logout}
          type="button"
        >
          {isLeaving ? "Saindo..." : "Sair"}
        </button>
        <p className="mt-4 font-bold text-white/75">
          Gerencie alunos, pagamentos e confirmações da Central Zumba do Cris.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          {
            label: "Total de alunos",
            value: data.summary.total,
            style: "bg-cris-navy text-white"
          },
          {
            label: "Alunos ativos",
            value: data.summary.ativos,
            style: "bg-emerald-500 text-white"
          },
          {
            label: "Pendentes",
            value: data.summary.pendentes,
            style: "bg-cris-yellow text-cris-navy"
          },
          {
            label: "Atrasados",
            value: data.summary.atrasados,
            style: "bg-cris-pink text-white"
          },
          {
            label: "Confirmações",
            value: data.summary.confirmacoes,
            style: "bg-cris-blue text-white"
          }
        ].map((item) => (
          <article
            className={`rounded-lg p-4 shadow-pop ${item.style}`}
            key={item.label}
          >
            <p className="text-3xl font-black">{item.value}</p>
            <p className="mt-1 text-xs font-black uppercase opacity-75">
              {item.label}
            </p>
          </article>
        ))}
      </section>

      <DashboardSection icon={<UsersIcon className="size-6" />} title="Alunos">
        <div className="grid gap-3 lg:grid-cols-2">
          {data.students.map((student) => (
            <article
              className="rounded-lg bg-cris-paper p-4 ring-1 ring-cris-navy/10"
              key={student.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-black text-cris-navy">
                    {student.nome}
                  </h3>
                  <p className="text-sm font-bold text-cris-navy/55">
                    {student.whatsapp}
                  </p>
                </div>
                <span className="rounded-lg bg-white px-3 py-1 text-xs font-black uppercase text-cris-pink">
                  {student.status}
                </span>
              </div>
              <p className="mt-3 font-bold text-cris-navy/70">
                {student.planoDetalhes?.nome ?? student.plano} ·{" "}
                {student.turmaPrincipal}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {studentStatuses.map((status) => (
                  <button
                    className="rounded-lg border border-cris-navy/15 bg-white px-3 py-2 text-xs font-black uppercase text-cris-navy hover:bg-cris-yellow/30"
                    key={status}
                    onClick={async () => {
                      await atualizarStatusAluno(student.id, status);
                      refresh();
                    }}
                    type="button"
                  >
                    {status === "ativo"
                      ? "Ativar aluno"
                      : status === "inativo"
                        ? "Inativar"
                        : `Marcar ${status}`}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection
        icon={<TrophyIcon className="size-6" />}
        title="Confirmações de presença"
      >
        {data.confirmations.length ? (
          <div className="grid gap-3">
            {data.confirmations.map((confirmation) => {
              const student = data.students.find(
                (item) => item.id === confirmation.alunoId
              );
              const lesson = aulas.find(
                (item) => item.id === confirmation.aulaId
              );
              const presence = data.presences.find(
                (item) =>
                  item.alunoId === confirmation.alunoId &&
                  item.aulaId === confirmation.aulaId
              );

              return (
                <article
                  className="rounded-lg bg-cris-paper p-4 ring-1 ring-cris-navy/10"
                  key={confirmation.id}
                >
                  <h3 className="font-black text-cris-navy">
                    {student?.nome ?? confirmation.alunoId}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-cris-navy/65">
                    {lesson
                      ? `${lesson.local} · ${formatDate(lesson.data)} · ${lesson.horario}`
                      : confirmation.aulaId}
                  </p>
                  <p className="mt-1 text-xs font-bold text-cris-navy/45">
                    Confirmado em{" "}
                    {new Date(confirmation.dataConfirmacao).toLocaleString(
                      "pt-BR"
                    )}
                  </p>
                  {presence ? (
                    <p className="mt-2 text-sm font-black text-cris-blue">
                      Resultado: {presence.compareceu ? "Presença validada" : "Falta"}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black uppercase text-white"
                      onClick={async () => {
                        await validarPresenca(
                          confirmation.alunoId,
                          confirmation.aulaId,
                          true
                        );
                        refresh();
                      }}
                      type="button"
                    >
                      Validar presença
                    </button>
                    <button
                      className="rounded-lg bg-cris-pink px-4 py-2 text-xs font-black uppercase text-white"
                      onClick={async () => {
                        await validarPresenca(
                          confirmation.alunoId,
                          confirmation.aulaId,
                          false
                        );
                        refresh();
                      }}
                      type="button"
                    >
                      Marcar falta
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="font-bold text-cris-navy/55">
            Nenhuma confirmação local recebida ainda.
          </p>
        )}
      </DashboardSection>

      <DashboardSection
        icon={<MoneyIcon className="size-6" />}
        title="Pagamentos"
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {data.payments.map((payment) => {
            const student = data.students.find(
              (item) => item.id === payment.alunoId
            );
            return (
              <article
                className="rounded-lg bg-cris-paper p-4 ring-1 ring-cris-navy/10"
                key={payment.id}
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <h3 className="font-black text-cris-navy">
                      {student?.nome ?? payment.alunoId}
                    </h3>
                    <p className="text-sm font-bold text-cris-navy/60">
                      {payment.plano} · R${payment.valor} · vence{" "}
                      {formatDate(payment.vencimento)}
                    </p>
                  </div>
                  <span className="text-xs font-black uppercase text-cris-pink">
                    {payment.status}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-cris-navy/55">
                  Método: {payment.metodo}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {paymentStatuses.map((status) => (
                    <button
                      className="rounded-lg border border-cris-navy/15 bg-white px-3 py-2 text-xs font-black uppercase text-cris-navy"
                      key={status}
                      onClick={async () => {
                        await atualizarStatusPagamento(payment.id, status);
                        refresh();
                      }}
                      type="button"
                    >
                      Marcar {status}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </DashboardSection>

      <DashboardSection
        icon={<CalendarIcon className="size-6" />}
        title="Próximas aulas"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.classes.map((lesson) => (
            <article
              className="rounded-lg bg-cris-paper p-4 ring-1 ring-cris-navy/10"
              key={lesson.id}
            >
              <h3 className="text-lg font-black uppercase text-cris-navy">
                {lesson.local}
              </h3>
              <p className="mt-2 font-black text-cris-blue">
                {formatDate(lesson.data)} · {lesson.horario}
              </p>
              <p className="mt-1 text-sm font-bold text-cris-navy/60">
                {lesson.endereco}
              </p>
              <p className="mt-2 text-xs font-black uppercase text-cris-pink">
                {lesson.status}
              </p>
            </article>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}

function DashboardSection({
  icon,
  title,
  children
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="premium-panel p-5 sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-lg bg-cris-purple text-white">
          {icon}
        </span>
        <h2 className="text-2xl font-black uppercase text-cris-navy">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
