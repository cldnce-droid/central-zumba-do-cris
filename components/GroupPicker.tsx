"use client";

import { useEffect, useState } from "react";
import { MessageIcon, UsersIcon } from "@/components/Icons";
import { whatsappGroups } from "@/lib/data";

const accentStyles = {
  pink: "bg-cris-pink text-white",
  blue: "bg-cris-blue text-white",
  yellow: "bg-cris-yellow text-cris-navy"
};

export function GroupPicker() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-lg bg-cris-purple px-5 py-3 text-center text-base font-black uppercase leading-tight text-white shadow-[0_12px_28px_rgba(109,43,191,0.24)] transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-cris-yellow/45"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <span className="grid size-6 shrink-0 place-items-center">
          <UsersIcon className="size-6" />
        </span>
        <span>Entrar no Grupo</span>
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-cris-navy/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
          role="presentation"
        >
          <section
            aria-labelledby="group-picker-title"
            aria-modal="true"
            className="group-picker-sheet relative w-full max-w-lg overflow-hidden rounded-lg border border-white/40 bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[0_24px_80px_rgba(7,16,70,0.42)] sm:p-6"
            role="dialog"
          >
            <div
              aria-hidden="true"
              className="paint-stroke absolute -right-8 top-5 h-8 w-40 bg-cris-pink"
            />

            <p className="text-xs font-black uppercase text-cris-blue">
              Grupos oficiais
            </p>
            <h2
              className="mt-1 pr-12 text-3xl font-black leading-tight text-cris-navy"
              id="group-picker-title"
            >
              Escolha sua turma 💖
            </h2>
            <p className="mt-3 max-w-md text-base font-bold leading-relaxed text-cris-navy/70">
              Entre no grupo do bairro onde você vai dançar com a gente.
            </p>

            <div className="mt-5 grid gap-3">
              {whatsappGroups.map((group) => (
                <a
                  className="group flex min-h-20 items-center gap-4 rounded-lg border border-cris-navy/10 bg-cris-paper p-4 shadow-[0_8px_24px_rgba(7,16,70,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-cris-pink/30 focus:outline-none focus:ring-4 focus:ring-cris-yellow/45"
                  href={group.url}
                  key={group.city}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-lg ${accentStyles[group.accent]}`}
                  >
                    <MessageIcon className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-black uppercase leading-tight text-cris-navy">
                      {group.city}
                    </span>
                    <span className="mt-1 block text-sm font-bold text-cris-navy/65">
                      {group.schedule}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-2xl font-black text-cris-pink transition group-hover:translate-x-1"
                  >
                    →
                  </span>
                </a>
              ))}
            </div>

            <button
              className="mt-5 min-h-12 w-full rounded-lg px-5 py-3 text-sm font-black uppercase text-cris-navy transition hover:bg-cris-navy/5 focus:outline-none focus:ring-4 focus:ring-cris-yellow/45"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Fechar
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
