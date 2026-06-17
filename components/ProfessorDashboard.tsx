"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarIcon,
  MoneyIcon,
  TrophyIcon,
  UsersIcon
} from "@/components/Icons";
import type {
  AlunoStatus,
  Confirmacao,
  Pagamento,
  PagamentoStatus,
  Presenca
} from "@/lib/student-data";
import {
  aceitarSolicitacaoPresenca,
  atualizarStatusAluno,
  atualizarStatusPagamento,
  getAlunosProfessor,
  getConfirmacoesProfessor,
  getPagamentosProfessor,
  getPresencasProfessor,
  getProximasAulasProfessor,
  recusarSolicitacaoPresenca,
  sincronizarDashboardProfessor
} from "@/lib/services/professorService";

type DashboardTab = "alunos" | "presencas";

const classFilters = ["Todas", "Ganchos de Fora", "Palmas", "Calheiros"];

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Data não informada";
  const parsedDate = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? "Data não informada"
    : new Intl.DateTimeFormat("pt-BR").format(parsedDate);
}

function formatDateTime(value: string) {
  if (!value) return "Data não informada";
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime())
    ? "Data não informada"
    : parsedDate.toLocaleString("pt-BR");
}

function selectedClasses(value: unknown, fallback: unknown) {
  const classes = Array.isArray(value)
    ? value.map(String)
    : String(value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return classes.length
    ? classes
    : String(fallback || "")
      ? [String(fallback)]
      : [];
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    ativo: "Ativo",
    inativo: "Inativo",
    pendente: "Pendente",
    atrasado: "Atrasado",
    pago: "Pago",
    solicitada: "Solicitada",
    aceita: "Aceita",
    recusada: "Recusada"
  };
  return labels[status] ?? status;
}

type ProfessorPayment = Omit<Pagamento, "status"> & {
  status: PagamentoStatus;
};

function latestPayment(payments: Pagamento[], alunoId: string): ProfessorPayment | undefined {
  const payment = payments
    .filter((payment) => payment.alunoId === alunoId)
    .sort((first, second) =>
      String(second.vencimento ?? "").localeCompare(String(first.vencimento ?? ""))
    )[0];

  if (!payment) return undefined;

  return {
    ...payment,
    status: payment.status === "pago" ? "pago" : "atrasado"
  };
}

function frequencySummary(presences: Presenca[], alunoId: string) {
  const accepted = presences
    .filter((presence) => presence.alunoId === alunoId && presence.compareceu)
    .sort((first, second) =>
      String(second.data ?? "").localeCompare(String(first.data ?? ""))
    );

  return {
    total: accepted.length,
    streak: accepted.length
  };
}

export function ProfessorDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("alunos");
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("Todas");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);

  const data = useMemo(() => {
    const students = getAlunosProfessor();
    return {
      students,
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

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    const numericQuery = onlyNumbers(search);

    if (!query && classFilter === "Todas") return [];

    return data.students.filter((student) => {
      const classes = selectedClasses(
        student.turmasEscolhidas,
        student.turmaPrincipal
      );
      const matchesClass =
        classFilter === "Todas" || classes.includes(classFilter);
      const matchesSearch =
        !query ||
        String(student.nome ?? "").toLowerCase().includes(query) ||
        onlyNumbers(String(student.whatsapp ?? "")).includes(numericQuery) ||
        classes.some((turma) => turma.toLowerCase().includes(query));

      return matchesClass && matchesSearch;
    });
  }, [classFilter, data.students, search]);

  const selectedStudent = data.students.find(
    (student) => student.id === selectedStudentId
  );
  const selectedPayment = selectedStudent
    ? latestPayment(data.payments, selectedStudent.id)
    : undefined;
  const selectedFrequency = selectedStudent
    ? frequencySummary(data.presences, selectedStudent.id)
    : { total: 0, streak: 0 };

  const requests = data.confirmations
    .map((confirmation) => ({
      confirmation,
      student: data.students.find((item) => item.id === confirmation.alunoId),
      lesson: data.classes.find((item) => item.id === confirmation.aulaId),
      presence: data.presences.find(
        (item) =>
          item.alunoId === confirmation.alunoId &&
          item.aulaId === confirmation.aulaId
      )
    }))
    .filter(({ confirmation }) => confirmation.status !== "recusada")
    .sort((first, second) =>
      String(second.confirmation.dataConfirmacao ?? "").localeCompare(
        String(first.confirmation.dataConfirmacao ?? "")
      )
    );

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
    <div className="flex flex-col gap-5">
      <header className="relative overflow-hidden rounded-lg bg-cris-navy p-6 text-white shadow-pop sm:p-8">
        <div
          aria-hidden="true"
          className="paint-stroke absolute -right-8 top-7 h-10 w-48 bg-cris-pink"
        />
        <p className="text-sm font-black uppercase text-cris-yellow">
          Central Zumba do Cris
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase leading-none sm:text-6xl">
          Área do Professor
        </h1>
        <p className="mt-4 max-w-2xl font-bold text-white/75">
          Consulta rápida de alunas e validação das solicitações de presença.
        </p>
        <button
          className="relative z-10 mt-5 min-h-11 rounded-lg border-2 border-white/40 px-5 py-2 font-black uppercase text-white transition hover:bg-white hover:text-cris-navy disabled:opacity-60"
          disabled={isLeaving}
          onClick={logout}
          type="button"
        >
          {isLeaving ? "Saindo..." : "Sair"}
        </button>
      </header>

      <nav className="grid gap-3 rounded-lg bg-white p-2 shadow-pop ring-1 ring-cris-navy/10 sm:grid-cols-2">
        <TabButton
          active={activeTab === "alunos"}
          icon={<UsersIcon className="size-5" />}
          onClick={() => setActiveTab("alunos")}
        >
          Alunos
        </TabButton>
        <TabButton
          active={activeTab === "presencas"}
          icon={<TrophyIcon className="size-5" />}
          onClick={() => setActiveTab("presencas")}
        >
          Presenças
        </TabButton>
      </nav>

      {activeTab === "alunos" ? (
        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <DashboardSection
            icon={<UsersIcon className="size-6" />}
            title="Consulta de Alunos"
          >
            <p className="mb-5 font-bold leading-relaxed text-cris-navy/60">
              Busque por nome, WhatsApp ou turma para consultar e atualizar
              dados principais.
            </p>

            <label className="text-sm font-black text-cris-navy">
              Buscar por nome ou WhatsApp
              <input
                className="mt-2 min-h-12 w-full rounded-lg border-2 border-cris-navy/10 bg-white px-4 py-3 text-base font-bold text-cris-navy outline-none focus:border-cris-blue"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelectedStudentId("");
                }}
                placeholder="Ex.: Cristiano ou 419..."
                type="search"
                value={search}
              />
            </label>

            <label className="mt-4 block text-sm font-black text-cris-navy">
              Filtrar por turma
              <select
                className="mt-2 min-h-12 w-full rounded-lg border-2 border-cris-navy/10 bg-white px-4 py-3 text-base font-bold text-cris-navy outline-none focus:border-cris-blue"
                onChange={(event) => {
                  setClassFilter(event.target.value);
                  setSelectedStudentId("");
                }}
                value={classFilter}
              >
                {classFilters.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <div className="mt-5 grid gap-3">
              {!search.trim() && classFilter === "Todas" ? (
                <p className="rounded-lg bg-cris-paper p-4 font-bold text-cris-navy/55">
                  Busque uma aluna por nome, WhatsApp ou turma.
                </p>
              ) : filteredStudents.length ? (
                filteredStudents.map((student) => {
                  const payment = latestPayment(data.payments, student.id);
                  return (
                    <article
                      className="rounded-lg bg-cris-paper p-4 ring-1 ring-cris-navy/10"
                      key={student.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-black text-cris-navy">
                            {student.nome}
                          </h3>
                          <p className="text-sm font-bold text-cris-navy/55">
                            {student.whatsapp}
                          </p>
                        </div>
                        <StatusBadge>{statusLabel(student.status)}</StatusBadge>
                      </div>
                      <p className="mt-3 font-bold text-cris-navy/70">
                        {student.planoDetalhes?.nome ?? student.plano}
                      </p>
                      <p className="mt-1 text-sm font-bold text-cris-navy/60">
                        {selectedClasses(
                          student.turmasEscolhidas,
                          student.turmaPrincipal
                        ).join(", ") || "Nenhuma turma escolhida"}
                      </p>
                      <p className="mt-1 text-sm font-bold text-cris-navy/60">
                        Pagamento: {statusLabel(payment?.status ?? "atrasado")}
                      </p>
                      <button
                        className="mt-4 min-h-11 rounded-lg bg-cris-pink px-4 py-2 text-sm font-black uppercase text-white"
                        onClick={() => setSelectedStudentId(student.id)}
                        type="button"
                      >
                        Abrir ficha
                      </button>
                    </article>
                  );
                })
              ) : (
                <p className="rounded-lg bg-cris-paper p-4 font-bold text-cris-navy/55">
                  Nenhum aluno encontrado.
                </p>
              )}
            </div>
          </DashboardSection>

          <DashboardSection
            icon={<MoneyIcon className="size-6" />}
            title="Ficha do Aluno"
          >
            {selectedStudent ? (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="text-3xl font-black text-cris-navy">
                    {selectedStudent.nome}
                  </h3>
                  <p className="mt-1 font-bold text-cris-navy/60">
                    {selectedStudent.whatsapp}
                  </p>
                  {selectedStudent.email ? (
                    <p className="font-bold text-cris-navy/60">
                      {selectedStudent.email}
                    </p>
                  ) : null}
                </div>

                <dl className="grid gap-3 sm:grid-cols-2">
                  <Info label="Plano">
                    {selectedStudent.planoDetalhes?.nome ??
                      selectedStudent.plano}
                  </Info>
                  <Info label="Turmas escolhidas">
                    {selectedClasses(
                      selectedStudent.turmasEscolhidas,
                      selectedStudent.turmaPrincipal
                    ).join(", ") || "Nenhuma turma escolhida"}
                  </Info>
                  <Info label="Data de entrada">
                    {formatDate(selectedStudent.dataEntrada)}
                  </Info>
                  <Info label="Vencimento">Todo dia 8</Info>
                  <Info label="Status do cadastro">
                    {statusLabel(selectedStudent.status)}
                  </Info>
                  <Info label="Status do pagamento">
                    {statusLabel(selectedPayment?.status ?? "atrasado")}
                  </Info>
                  <Info label="Presenças validadas">
                    {selectedFrequency.total}
                  </Info>
                  <Info label="Sequência atual">
                    {selectedFrequency.streak}
                  </Info>
                </dl>

                {selectedStudent.observacoes ? (
                  <div className="rounded-lg bg-cris-paper p-4 ring-1 ring-cris-navy/10">
                    <p className="text-xs font-black uppercase text-cris-pink">
                      Observações
                    </p>
                    <p className="mt-1 font-bold text-cris-navy/65">
                      {selectedStudent.observacoes}
                    </p>
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    className="min-h-12 rounded-lg bg-cris-blue px-4 py-3 text-sm font-black uppercase text-white"
                    onClick={async () => {
                      const nextStatus: AlunoStatus =
                        selectedStudent.status === "ativo"
                          ? "inativo"
                          : "ativo";
                      await atualizarStatusAluno(selectedStudent.id, nextStatus);
                      refresh();
                    }}
                    type="button"
                  >
                    {selectedStudent.status === "ativo"
                      ? "Inativar cadastro"
                      : "Ativar cadastro"}
                  </button>

                  <button
                    className="min-h-12 rounded-lg bg-cris-yellow px-4 py-3 text-sm font-black uppercase text-cris-navy disabled:opacity-50"
                    disabled={!selectedPayment}
                    onClick={async () => {
                      if (!selectedPayment) return;
                      await atualizarStatusPagamento(
                        selectedPayment.id,
                        selectedPayment.status === "pago"
                          ? "atrasado"
                          : "pago"
                      );
                      refresh();
                    }}
                    type="button"
                  >
                    {selectedPayment?.status === "pago"
                      ? "Marcar como atrasado"
                      : "Marcar como pago"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="rounded-lg bg-cris-paper p-4 font-bold text-cris-navy/55">
                Abra a ficha de uma aluna para consultar os detalhes.
              </p>
            )}
          </DashboardSection>
        </section>
      ) : (
        <DashboardSection
          icon={<CalendarIcon className="size-6" />}
          title="Solicitações de Presença"
        >
          <p className="mb-5 font-bold leading-relaxed text-cris-navy/60">
            Valide as solicitações de presença das alunas.
          </p>

          {!requests.length ? (
            <p className="rounded-lg bg-cris-paper p-4 font-bold text-cris-navy/55">
              Nenhuma solicitação de presença no momento.
            </p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {requests.map(({ confirmation, student, lesson, presence }) => (
                <PresenceRequestCard
                  confirmation={confirmation}
                  key={confirmation.id}
                  lesson={lesson}
                  onAccept={async () => {
                    await aceitarSolicitacaoPresenca(confirmation.id);
                    refresh();
                  }}
                  onReject={async () => {
                    await recusarSolicitacaoPresenca(confirmation.id);
                    refresh();
                  }}
                  presence={presence}
                  student={student}
                />
              ))}
            </div>
          )}
        </DashboardSection>
      )}
    </div>
  );
}

function TabButton({
  active,
  children,
  icon,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-black uppercase transition ${
        active
          ? "bg-cris-pink text-white shadow-pop"
          : "bg-cris-paper text-cris-navy hover:bg-cris-yellow/25"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {children}
    </button>
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

function Info({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="rounded-lg bg-cris-paper p-4 ring-1 ring-cris-navy/10">
      <dt className="text-xs font-black uppercase text-cris-navy/45">
        {label}
      </dt>
      <dd className="mt-1 font-black text-cris-navy">{children}</dd>
    </div>
  );
}

function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-lg bg-white px-3 py-1 text-xs font-black uppercase text-cris-pink">
      {children}
    </span>
  );
}

function PresenceRequestCard({
  confirmation,
  lesson,
  onAccept,
  onReject,
  presence,
  student
}: {
  confirmation: Confirmacao;
  lesson?: {
    data: string;
    endereco: string;
    horario: string;
    local: string;
  };
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  presence?: Presenca;
  student?: {
    nome: string;
    whatsapp: string;
  };
}) {
  const isPending =
    confirmation.status === "solicitada" || confirmation.status === "confirmado";
  const visibleStatus = presence?.compareceu
    ? "aceita"
    : confirmation.status === "confirmado"
      ? "solicitada"
      : confirmation.status;

  return (
    <article className="rounded-lg bg-cris-paper p-4 ring-1 ring-cris-navy/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-cris-navy">
            {student?.nome ?? confirmation.alunoId}
          </h3>
          <p className="text-sm font-bold text-cris-navy/55">
            {student?.whatsapp ?? "WhatsApp não encontrado"}
          </p>
        </div>
        <StatusBadge>{statusLabel(visibleStatus)}</StatusBadge>
      </div>

      <div className="mt-4 grid gap-2 text-sm font-bold text-cris-navy/65">
        <p>Turma/local: {lesson?.local ?? confirmation.aulaId}</p>
        <p>Data da aula: {formatDate(lesson?.data)}</p>
        <p>Horário: {lesson?.horario ?? "Horário não encontrado"}</p>
        <p>Solicitada em: {formatDateTime(confirmation.dataConfirmacao)}</p>
      </div>

      {isPending ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            className="min-h-11 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black uppercase text-white"
            onClick={onAccept}
            type="button"
          >
            Aceitar presença
          </button>
          <button
            className="min-h-11 rounded-lg bg-cris-pink px-4 py-2 text-xs font-black uppercase text-white"
            onClick={onReject}
            type="button"
          >
            Recusar
          </button>
        </div>
      ) : null}
    </article>
  );
}
