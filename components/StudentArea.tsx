"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarIcon,
  ClockIcon,
  HeartIcon,
  LockIcon,
  PinIcon,
  TrophyIcon,
  UsersIcon
} from "@/components/Icons";
import {
  alunos,
  conquistasPorAluno,
  frequencias,
  turmaOptions,
  type StatusAluno
} from "@/lib/data";

const statusStyles: Record<StatusAluno, string> = {
  Ativo: "bg-emerald-100 text-emerald-700",
  Pendente: "bg-cris-yellow/25 text-cris-navy",
  Pausado: "bg-cris-blue/15 text-cris-blue",
  Inativo: "bg-cris-navy/10 text-cris-navy/60"
};

const achievementStyles = {
  pink: "bg-cris-pink text-white",
  blue: "bg-cris-blue text-white",
  purple: "bg-cris-purple text-white",
  yellow: "bg-cris-yellow text-cris-navy"
};

function formatEntryDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function getNextClassLabel(
  weekdays: number[],
  schedule: string,
  now = new Date()
) {
  const [hourText, minuteText = "0"] = schedule.split("h");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  const candidates = weekdays.map((weekday) => {
    const candidate = new Date(now);
    const daysAhead = (weekday - now.getDay() + 7) % 7;

    candidate.setDate(now.getDate() + daysAhead);
    candidate.setHours(hour, minute, 0, 0);

    if (candidate.getTime() <= now.getTime()) {
      candidate.setDate(candidate.getDate() + 7);
    }

    return candidate;
  });

  const nextClass = candidates.sort(
    (first, second) => first.getTime() - second.getTime()
  )[0];

  const date = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(nextClass);

  return `${date} às ${schedule}`;
}

export function StudentArea() {
  const [selectedStudentId, setSelectedStudentId] = useState(alunos[0].id);
  const [nextClassLabel, setNextClassLabel] = useState("Calculando próxima aula...");

  const student = useMemo(
    () => alunos.find((item) => item.id === selectedStudentId) ?? alunos[0],
    [selectedStudentId]
  );

  const turma =
    turmaOptions.find((item) => item.nome === student.turma) ?? turmaOptions[0];
  const frequency =
    frequencias.find((item) => item.alunoId === student.id) ?? frequencias[0];
  const achievements = conquistasPorAluno[student.id] ?? [];

  useEffect(() => {
    setNextClassLabel(
      getNextClassLabel(turma.diasSemana, turma.horario)
    );
  }, [turma.diasSemana, turma.horario]);

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

        <label className="mt-6 block max-w-sm">
          <span className="text-xs font-black uppercase text-cris-pink">
            Visualizar como
          </span>
          <select
            className="mt-2 min-h-12 w-full rounded-lg border-2 border-cris-navy/10 bg-cris-paper px-4 py-3 text-base font-black text-cris-navy outline-none focus:border-cris-blue"
            onChange={(event) => setSelectedStudentId(event.target.value)}
            value={selectedStudentId}
          >
            {alunos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>
      </header>

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
              <dd className="mt-1 font-bold text-white">{student.plano}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase text-white/55">Status</dt>
              <dd className="mt-2">
                <span
                  className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-black uppercase ${statusStyles[student.status]}`}
                >
                  {student.status}
                </span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-black uppercase text-white/55">
                Data de entrada
              </dt>
              <dd className="mt-1 font-bold text-white">
                {formatEntryDate(student.dataEntrada)}
              </dd>
            </div>
          </dl>
        </article>

        <article className="premium-panel p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-cris-blue text-white">
              <UsersIcon className="size-6" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-cris-pink">
                Minha turma
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase text-cris-navy">
                {turma.nome}
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3 font-bold text-cris-navy/75">
            <p className="flex items-center gap-3">
              <CalendarIcon className="size-5 shrink-0 text-cris-pink" />
              {turma.dias}
            </p>
            <p className="flex items-center gap-3">
              <ClockIcon className="size-5 shrink-0 text-cris-blue" />
              {turma.horario}
            </p>
            <p className="flex items-center gap-3">
              <PinIcon className="size-5 shrink-0 text-cris-purple" />
              {turma.local}
            </p>
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
          <div>
            <p className="text-xs font-black uppercase text-white/70">
              Próxima aula
            </p>
            <h2 className="mt-1 text-2xl font-black capitalize sm:text-3xl">
              {nextClassLabel}
            </h2>
            <p className="mt-2 font-bold text-white/80">
              {turma.local} • {turma.nome}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-sm font-black uppercase text-cris-blue">
            Movimento que vira história
          </p>
          <h2 className="mt-1 text-3xl font-black uppercase text-cris-navy">
            Frequência
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
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
