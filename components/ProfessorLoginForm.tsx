"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ProfessorLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/professor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Não foi possível entrar.");
        return;
      }

      router.replace("/professor");
      router.refresh();
    } catch {
      setError("Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="premium-panel mx-auto max-w-xl p-6 sm:p-8">
      <p className="text-sm font-black uppercase text-cris-pink">
        Central Zumba do Cris
      </p>
      <h1 className="mt-2 text-4xl font-black uppercase leading-none text-cris-navy sm:text-5xl">
        Acesso do Professor
      </h1>
      <p className="mt-4 font-bold text-cris-navy/65">
        Entre com a senha administrativa para acessar o dashboard.
      </p>

      <form className="mt-6" onSubmit={handleSubmit}>
        <label className="text-sm font-black text-cris-navy">
          Senha
          <input
            autoComplete="current-password"
            className="mt-2 min-h-12 w-full rounded-lg border-2 border-cris-navy/10 bg-white px-4 py-3 text-base font-bold text-cris-navy outline-none focus:border-cris-blue"
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            required
            type="password"
            value={password}
          />
        </label>
        {error ? (
          <p className="mt-3 font-bold text-cris-pink">{error}</p>
        ) : null}
        <button
          className="mt-5 min-h-14 w-full rounded-lg bg-cris-pink px-5 py-3 font-black uppercase text-white shadow-pop disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </section>
  );
}
