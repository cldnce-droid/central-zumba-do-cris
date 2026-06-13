"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarIcon,
  HeartIcon,
  MessageIcon,
  MoneyIcon,
  PinIcon,
  UsersIcon
} from "@/components/Icons";
import { pixKey } from "@/lib/data";
import {
  getPlanoCadastro,
  getPlanosParaCadastro,
  getTurmaCadastro,
  getTurmasParaCadastro,
  salvarAlunoPendente,
  type AlunoPendente,
  type CadastroAlunoFormData
} from "@/lib/services/cadastroService";

type FormErrors = Partial<Record<keyof CadastroAlunoFormData, string>>;

const initialForm: CadastroAlunoFormData = {
  nome: "",
  whatsapp: "",
  email: "",
  turmaIds: [],
  plano: "",
  formaPagamento: "",
  observacoes: ""
};

const fieldClassName =
  "mt-2 min-h-12 w-full rounded-lg border-2 border-cris-navy/10 bg-white px-4 py-3 text-base font-bold text-cris-navy outline-none transition placeholder:text-cris-navy/35 focus:border-cris-blue focus:ring-4 focus:ring-cris-blue/10";

function formatDays(days: string[]) {
  const text =
    days.length > 1
      ? `${days.slice(0, -1).join(", ")} e ${days.at(-1)}`
      : days[0] ?? "";

  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function formatPaymentMethod(method: string) {
  if (method === "pix") return "PIX";
  if (method === "dinheiro") return "Dinheiro";
  return "Outro";
}

function validateForm(form: CadastroAlunoFormData) {
  const errors: FormErrors = {};
  const phoneDigits = form.whatsapp.replace(/\D/g, "");

  if (!form.nome.trim()) {
    errors.nome = "Conte para a gente o seu nome completo.";
  }

  if (!phoneDigits) {
    errors.whatsapp = "Informe seu WhatsApp para continuarmos o contato.";
  } else if (phoneDigits.length < 10) {
    errors.whatsapp = "Digite um WhatsApp com DDD e pelo menos 10 números.";
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Confira se o e-mail foi digitado corretamente.";
  }

  if (!form.turmaIds.length) {
    errors.turmaIds = "Escolha pelo menos um local para começar.";
  }

  if (!form.plano) {
    errors.plano = "Escolha o plano que combina com seu ritmo.";
  }

  if (!form.formaPagamento) {
    errors.formaPagamento = "Escolha uma forma de pagamento.";
  }

  return errors;
}

export function StudentRegistrationForm() {
  const classes = useMemo(() => getTurmasParaCadastro(), []);
  const plans = useMemo(() => getPlanosParaCadastro(), []);
  const [form, setForm] = useState<CadastroAlunoFormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [registeredStudent, setRegisteredStudent] =
    useState<AlunoPendente | null>(null);
  const [pixFeedback, setPixFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedClasses = registeredStudent
    ? classes.filter((item) =>
        registeredStudent.turmasEscolhidas.includes(item.nome)
      )
    : form.turmaIds
        .map(getTurmaCadastro)
        .filter((item) => item !== undefined);
  const selectedPlan = registeredStudent
    ? getPlanoCadastro(registeredStudent.plano)
    : form.plano
      ? getPlanoCadastro(form.plano)
      : undefined;

  const updateField = <Key extends keyof CadastroAlunoFormData>(
    field: Key,
    value: CadastroAlunoFormData[Key]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const selectPlan = (plan: CadastroAlunoFormData["plano"]) => {
    const limit = plan ? Number(plan.replace("x", "")) : 0;
    setForm((current) => ({
      ...current,
      plano: plan,
      turmaIds: current.turmaIds.slice(0, limit)
    }));
    setErrors((current) => ({
      ...current,
      plano: undefined,
      turmaIds: undefined
    }));
  };

  const toggleClass = (classId: string) => {
    if (!form.plano) {
      setErrors((current) => ({
        ...current,
        turmaIds: "Escolha primeiro o plano para definir quantos locais pode selecionar."
      }));
      return;
    }

    const limit = Number(form.plano.replace("x", ""));
    const isSelected = form.turmaIds.includes(classId);

    if (!isSelected && form.turmaIds.length >= limit) {
      setErrors((current) => ({
        ...current,
        turmaIds: `Seu plano permite escolher até ${limit} ${limit === 1 ? "local" : "locais"}.`
      }));
      return;
    }

    updateField(
      "turmaIds",
      isSelected
        ? form.turmaIds.filter((id) => id !== classId)
        : [...form.turmaIds, classId]
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      document
        .querySelector("[data-registration-error='true']")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    try {
      setRegisteredStudent(await salvarAlunoPendente(form));
      setPixFeedback("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setPixFeedback("Chave PIX copiada!");
    } catch {
      setPixFeedback(`Copie a chave PIX: ${pixKey}`);
    }
  };

  if (registeredStudent) {
    const whatsappMessage = encodeURIComponent(
      `Olá, Cris! Fiz meu cadastro na Central Zumba do Cris. Meu nome é ${registeredStudent.nome}, escolhi os locais ${registeredStudent.turmasEscolhidas.join(", ")} e o plano ${selectedPlan?.nome ?? registeredStudent.plano}. Quero enviar meu comprovante. 💖`
    );

    return (
      <div className="flex flex-col gap-5">
        <section className="relative overflow-hidden rounded-lg bg-cris-navy p-6 text-white shadow-pop sm:p-8">
          <div
            aria-hidden="true"
            className="paint-stroke absolute -right-8 top-7 h-10 w-48 bg-cris-pink"
          />
          <span className="grid size-14 place-items-center rounded-lg bg-cris-yellow text-cris-navy">
            <HeartIcon className="size-7" />
          </span>
          <p className="mt-5 text-sm font-black uppercase text-cris-yellow">
            Seu movimento começa aqui
          </p>
          <h1 className="mt-2 max-w-3xl text-4xl font-black uppercase leading-none sm:text-6xl">
            Cadastro recebido!
          </h1>
          <p className="mt-4 max-w-2xl text-lg font-bold leading-relaxed text-white/85">
            Agora é só finalizar o pagamento para garantir sua vaga.
          </p>
          <p className="mt-2 max-w-2xl font-bold text-white/65">
            Após a confirmação do pagamento, sua Área do Aluno será liberada.
          </p>
        </section>

        <section className="premium-panel p-5 sm:p-7">
          <p className="text-sm font-black uppercase text-cris-blue">
            Vem fazer parte dessa história
          </p>
          <h2 className="mt-1 text-3xl font-black uppercase text-cris-navy">
            Resumo do cadastro
          </h2>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-black uppercase text-cris-navy/45">
                Nome
              </dt>
              <dd className="mt-1 font-black text-cris-navy">
                {registeredStudent.nome}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase text-cris-navy/45">
                WhatsApp
              </dt>
              <dd className="mt-1 font-black text-cris-navy">
                {registeredStudent.whatsapp}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase text-cris-navy/45">
                Locais escolhidos
              </dt>
              <dd className="mt-1 font-black text-cris-navy">
                {selectedClasses.map((item) => item.nome).join(", ")}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase text-cris-navy/45">
                Plano
              </dt>
              <dd className="mt-1 font-black text-cris-navy">
                {selectedPlan?.nome ?? registeredStudent.plano}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase text-cris-navy/45">
                Valor
              </dt>
              <dd className="mt-1 text-2xl font-black text-cris-pink">
                {selectedPlan ? `R$${selectedPlan.valor}` : "A confirmar"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase text-cris-navy/45">
                Forma de pagamento
              </dt>
              <dd className="mt-1 font-black text-cris-navy">
                {formatPaymentMethod(registeredStudent.formaPagamento)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-black uppercase text-cris-navy/45">
                Status
              </dt>
              <dd className="mt-2">
                <span className="inline-flex rounded-lg bg-cris-yellow px-4 py-2 text-xs font-black uppercase text-cris-navy">
                  Pendente
                </span>
              </dd>
            </div>
          </dl>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <button
            className="flex min-h-14 items-center justify-center gap-3 rounded-lg bg-cris-yellow px-5 py-4 text-sm font-black uppercase text-cris-navy shadow-pop transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-cris-pink/25"
            onClick={copyPix}
            type="button"
          >
            <MoneyIcon className="size-6" />
            Copiar chave PIX
          </button>
          <a
            className="flex min-h-14 items-center justify-center gap-3 rounded-lg bg-cris-blue px-5 py-4 text-center text-sm font-black uppercase text-white shadow-pop transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-cris-yellow/40"
            href={`https://wa.me/5541984723756?text=${whatsappMessage}`}
            rel="noreferrer"
            target="_blank"
          >
            <MessageIcon className="size-6" />
            Falar com o Cris no WhatsApp
          </a>
        </section>

        <div className="text-center">
          <p aria-live="polite" className="min-h-6 font-black text-cris-pink">
            {pixFeedback}
          </p>
          <p className="mt-2 font-bold text-cris-navy/65">
            Envie o comprovante para confirmar sua vaga.
          </p>
          <p className="mt-4 text-xl font-black text-cris-navy">
            💖 Errou... continua!
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
      <header className="relative overflow-hidden rounded-lg bg-cris-navy p-6 text-white shadow-pop sm:p-8">
        <div
          aria-hidden="true"
          className="paint-stroke absolute -right-8 top-7 h-10 w-48 bg-cris-pink"
        />
        <p className="text-sm font-black uppercase text-cris-yellow">
          Seu movimento começa aqui
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase leading-none sm:text-6xl">
          Cadastro do Aluno
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-bold leading-relaxed text-white/80">
          Preencha seus dados para entrar na Central Zumba do Cris.
        </p>
      </header>

      <section className="premium-panel p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-lg bg-cris-pink text-white">
            <UsersIcon className="size-6" />
          </span>
          <h2 className="text-2xl font-black uppercase text-cris-navy">
            Dados pessoais
          </h2>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label>
            <span className="text-sm font-black text-cris-navy">
              Nome completo *
            </span>
            <input
              className={fieldClassName}
              data-registration-error={Boolean(errors.nome)}
              onChange={(event) => updateField("nome", event.target.value)}
              placeholder="Seu nome"
              type="text"
              value={form.nome}
            />
            {errors.nome ? (
              <span className="mt-2 block text-sm font-bold text-cris-pink">
                {errors.nome}
              </span>
            ) : null}
          </label>

          <label>
            <span className="text-sm font-black text-cris-navy">
              WhatsApp *
            </span>
            <input
              className={fieldClassName}
              data-registration-error={Boolean(errors.whatsapp)}
              inputMode="tel"
              onChange={(event) => updateField("whatsapp", event.target.value)}
              placeholder="(48) 99999-9999"
              type="tel"
              value={form.whatsapp}
            />
            {errors.whatsapp ? (
              <span className="mt-2 block text-sm font-bold text-cris-pink">
                {errors.whatsapp}
              </span>
            ) : null}
          </label>

          <label className="sm:col-span-2">
            <span className="text-sm font-black text-cris-navy">
              E-mail <span className="text-cris-navy/45">(opcional)</span>
            </span>
            <input
              className={fieldClassName}
              data-registration-error={Boolean(errors.email)}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="voce@email.com"
              type="email"
              value={form.email}
            />
            {errors.email ? (
              <span className="mt-2 block text-sm font-bold text-cris-pink">
                {errors.email}
              </span>
            ) : null}
          </label>
        </div>
      </section>

      <section className="premium-panel p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-lg bg-cris-blue text-white">
            <PinIcon className="size-6" />
          </span>
          <h2 className="text-2xl font-black uppercase text-cris-navy">
            Escolha seus locais
          </h2>
        </div>

        <p className="mt-4 font-bold text-cris-navy/65">
          {form.plano
            ? `Seu plano permite escolher até ${Number(form.plano.replace("x", ""))} ${form.plano === "1x" ? "local" : "locais"}.`
            : "Escolha primeiro seu plano para liberar a seleção de locais."}
        </p>

        <div
          className="mt-6 grid gap-3 md:grid-cols-3"
          data-registration-error={Boolean(errors.turmaIds)}
        >
          {classes.map((item) => (
            <label
              className={`cursor-pointer rounded-lg border-2 p-4 transition ${
                form.turmaIds.includes(item.id)
                  ? "border-cris-blue bg-cris-blue/10 shadow-pop"
                  : "border-cris-navy/10 bg-white hover:border-cris-blue/45"
              } ${!form.plano ? "opacity-60" : ""}`}
              key={item.id}
            >
              <input
                checked={form.turmaIds.includes(item.id)}
                className="sr-only"
                name="turma"
                onChange={() => toggleClass(item.id)}
                type="checkbox"
              />
              <span className="text-lg font-black uppercase text-cris-navy">
                {item.nome}
              </span>
              <span className="mt-2 block text-sm font-bold text-cris-blue">
                {formatDays(item.dias)} às {item.horario}
              </span>
              <span className="mt-1 block text-sm font-bold text-cris-navy/60">
                {item.endereco}
              </span>
            </label>
          ))}
        </div>
        {errors.turmaIds ? (
          <p className="mt-3 text-sm font-bold text-cris-pink">
            {errors.turmaIds}
          </p>
        ) : null}
      </section>

      <section className="premium-panel p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-lg bg-cris-yellow text-cris-navy">
            <CalendarIcon className="size-6" />
          </span>
          <h2 className="text-2xl font-black uppercase text-cris-navy">
            Escolha seu plano
          </h2>
        </div>

        <div
          className="mt-6 grid gap-3 md:grid-cols-3"
          data-registration-error={Boolean(errors.plano)}
        >
          {plans.map((item) => {
            const code = `${item.aulasPorSemana}x` as CadastroAlunoFormData["plano"];

            return (
              <label
                className={`relative cursor-pointer overflow-hidden rounded-lg border-2 p-4 transition ${
                  form.plano === code
                    ? "border-cris-pink bg-cris-pink/10 shadow-pop"
                    : "border-cris-navy/10 bg-white hover:border-cris-pink/45"
                } ${item.destaque ? "ring-2 ring-cris-yellow" : ""}`}
                key={item.id}
              >
                <input
                  checked={form.plano === code}
                  className="sr-only"
                  name="plano"
                  onChange={() => selectPlan(code)}
                  type="radio"
                />
                {item.destaque ? (
                  <span className="absolute right-0 top-0 bg-cris-yellow px-3 py-1 text-[0.65rem] font-black uppercase text-cris-navy">
                    Melhor valor
                  </span>
                ) : null}
                <span className="block text-lg font-black uppercase text-cris-navy">
                  {item.nome}
                </span>
                <span className="mt-3 block text-3xl font-black text-cris-pink">
                  R${item.valor}
                </span>
                <span className="mt-2 block text-sm font-bold leading-relaxed text-cris-navy/60">
                  {item.descricao}
                </span>
              </label>
            );
          })}
        </div>
        {errors.plano ? (
          <p className="mt-3 text-sm font-bold text-cris-pink">
            {errors.plano}
          </p>
        ) : null}
      </section>

      <section className="premium-panel p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-lg bg-cris-purple text-white">
            <MoneyIcon className="size-6" />
          </span>
          <h2 className="text-2xl font-black uppercase text-cris-navy">
            Pagamento
          </h2>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-black text-cris-navy">
            Forma de pagamento preferida *
          </legend>
          <div
            className="mt-3 grid gap-3 sm:grid-cols-3"
            data-registration-error={Boolean(errors.formaPagamento)}
          >
            {[
              ["pix", "PIX"],
              ["dinheiro", "Dinheiro"],
              ["outro", "Outro"]
            ].map(([value, label]) => (
              <label
                className={`cursor-pointer rounded-lg border-2 p-4 text-center font-black transition ${
                  form.formaPagamento === value
                    ? "border-cris-purple bg-cris-purple text-white"
                    : "border-cris-navy/10 bg-white text-cris-navy hover:border-cris-purple/45"
                }`}
                key={value}
              >
                <input
                  checked={form.formaPagamento === value}
                  className="sr-only"
                  name="formaPagamento"
                  onChange={() =>
                    updateField(
                      "formaPagamento",
                      value as CadastroAlunoFormData["formaPagamento"]
                    )
                  }
                  type="radio"
                />
                {label}
              </label>
            ))}
          </div>
          {errors.formaPagamento ? (
            <p className="mt-3 text-sm font-bold text-cris-pink">
              {errors.formaPagamento}
            </p>
          ) : null}
        </fieldset>

        <label className="mt-6 block">
          <span className="text-sm font-black text-cris-navy">
            Observações <span className="text-cris-navy/45">(opcional)</span>
          </span>
          <textarea
            className={`${fieldClassName} min-h-28 resize-y`}
            onChange={(event) => updateField("observacoes", event.target.value)}
            placeholder="Conte algo importante para o Cris"
            value={form.observacoes}
          />
        </label>
      </section>

      <button
        className="min-h-16 rounded-lg bg-cris-pink px-6 py-4 text-lg font-black uppercase text-white shadow-pop transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-cris-yellow/60"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enviando..." : "Enviar cadastro"}
      </button>

      <p className="text-center text-lg font-black text-cris-navy">
        Vem fazer parte dessa história. 💖
      </p>
    </form>
  );
}
