"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon, MessageIcon, MoneyIcon } from "@/components/Icons";
import { pixKey } from "@/lib/data";
import { getAlunoByWhatsappRemoto } from "@/lib/services/alunoService";
import type { Aluno } from "@/lib/student-data";

export function StudentLogin() {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState("");
  const [pendingStudent, setPendingStudent] = useState<Aluno | null>(null);
  const [pixFeedback, setPixFeedback] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = whatsapp.replace(/\D/g, "");

    if (!normalized) {
      setError("Digite o WhatsApp usado no cadastro.");
      return;
    }

    const student = await getAlunoByWhatsappRemoto(normalized);

    if (!student) {
      setError("Cadastro não encontrado. Confira o número ou faça seu cadastro.");
      setPendingStudent(null);
      return;
    }

    if (student.status === "pendente") {
      setPendingStudent(student);
      setError("");
      return;
    }

    if (student.status === "inativo") {
      setError("Seu cadastro está inativo. Fale com o Cris para regularizar.");
      setPendingStudent(null);
      return;
    }

    localStorage.setItem("alunoAtualId", student.id);
    router.push("/minha-area");
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setPixFeedback("Chave PIX copiada!");
    } catch {
      setPixFeedback(`Copie a chave PIX: ${pixKey}`);
    }
  };

  if (pendingStudent) {
    const message = encodeURIComponent(
      `Olá, Cris! Meu cadastro está pendente. Sou ${pendingStudent.nome} e quero enviar meu comprovante. 💖`
    );

    return (
      <section className="premium-panel mx-auto max-w-2xl p-6 text-center sm:p-8">
        <span className="mx-auto grid size-14 place-items-center rounded-lg bg-cris-yellow text-cris-navy">
          <HeartIcon className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-black uppercase text-cris-navy sm:text-4xl">
          Seu cadastro está pendente de confirmação.
        </h1>
        <p className="mt-4 font-bold leading-relaxed text-cris-navy/65">
          Após a confirmação do pagamento, sua Área do Aluno será liberada.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            className="flex min-h-14 items-center justify-center gap-3 rounded-lg bg-cris-yellow px-5 py-3 font-black uppercase text-cris-navy shadow-pop"
            onClick={copyPix}
            type="button"
          >
            <MoneyIcon className="size-6" />
            Copiar chave PIX
          </button>
          <a
            className="flex min-h-14 items-center justify-center gap-3 rounded-lg bg-cris-blue px-5 py-3 font-black uppercase text-white shadow-pop"
            href={`https://wa.me/5541984723756?text=${message}`}
            rel="noreferrer"
            target="_blank"
          >
            <MessageIcon className="size-6" />
            Falar com o Cris
          </a>
        </div>
        <p aria-live="polite" className="mt-4 font-black text-cris-pink">
          {pixFeedback}
        </p>
      </section>
    );
  }

  return (
    <section className="premium-panel mx-auto max-w-xl p-6 sm:p-8">
      <p className="text-sm font-black uppercase text-cris-pink">
        Central Zumba do Cris
      </p>
      <h1 className="mt-2 text-4xl font-black uppercase leading-none text-cris-navy sm:text-5xl">
        Entrar na minha área
      </h1>
      <p className="mt-4 font-bold leading-relaxed text-cris-navy/65">
        Digite o WhatsApp usado no cadastro para acessar sua Área do Aluno.
      </p>

      <form className="mt-6" onSubmit={handleSubmit}>
        <label className="text-sm font-black text-cris-navy">
          WhatsApp
          <input
            className="mt-2 min-h-12 w-full rounded-lg border-2 border-cris-navy/10 bg-white px-4 py-3 text-base font-bold text-cris-navy outline-none focus:border-cris-blue"
            inputMode="tel"
            onChange={(event) => {
              setWhatsapp(event.target.value);
              setError("");
            }}
            placeholder="(48) 99999-9999"
            type="tel"
            value={whatsapp}
          />
        </label>
        {error ? (
          <p className="mt-3 font-bold text-cris-pink">{error}</p>
        ) : null}
        <button
          className="mt-5 min-h-14 w-full rounded-lg bg-cris-pink px-5 py-3 font-black uppercase text-white shadow-pop"
          type="submit"
        >
          Entrar
        </button>
      </form>

      <Link
        className="mt-4 flex min-h-12 items-center justify-center rounded-lg border-2 border-cris-purple px-4 py-3 text-center font-black uppercase text-cris-purple"
        href="/cadastro"
      >
        Fazer cadastro
      </Link>
    </section>
  );
}
