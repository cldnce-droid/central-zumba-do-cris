"use client";

import { useEffect, useState } from "react";
import { MoneyIcon } from "@/components/Icons";
import { pixKey } from "@/lib/data";

export function PixPayment() {
  const [copied, setCopied] = useState(false);
  const [showManualCopy, setShowManualCopy] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 4500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!showManualCopy) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowManualCopy(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showManualCopy]);

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
    } catch {
      setShowManualCopy(true);
    }
  };

  return (
    <>
      <section className="ink-frame p-5 text-white">
        <p className="text-sm font-bold uppercase text-white/70">Pagamento</p>
        <h2 className="mt-2 text-4xl font-black uppercase text-cris-yellow">
          PIX
        </h2>
        <p className="mt-2 max-w-xl text-base font-bold text-white/80">
          Toque no botão para copiar a chave PIX.
        </p>

        <div className="mt-4">
          <button
            className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-lg bg-cris-yellow px-5 py-3 text-center text-base font-black uppercase leading-tight text-cris-navy shadow-[0_12px_28px_rgba(255,196,0,0.26)] transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-cris-pink/45"
            onClick={copyPixKey}
            type="button"
          >
            <span className="grid size-6 shrink-0 place-items-center">
              <MoneyIcon className="size-6" />
            </span>
            <span>Pagar com PIX</span>
          </button>
        </div>

        <p className="mt-3 text-sm font-bold text-white/65">
          Após o pagamento, envie o comprovante pelo WhatsApp.
        </p>

        <div aria-live="polite">
          {copied ? (
            <p className="mt-4 rounded-lg bg-cris-pink px-4 py-3 text-center text-sm font-black text-white">
              💖 Chave PIX copiada com sucesso!
            </p>
          ) : null}
        </div>
      </section>

      {showManualCopy ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-cris-navy/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowManualCopy(false);
            }
          }}
          role="presentation"
        >
          <section
            aria-labelledby="pix-manual-title"
            aria-modal="true"
            className="group-picker-sheet relative w-full max-w-md overflow-hidden rounded-lg bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[0_24px_80px_rgba(7,16,70,0.42)]"
            role="dialog"
          >
            <div
              aria-hidden="true"
              className="paint-stroke absolute -right-8 top-5 h-8 w-40 bg-cris-pink"
            />
            <p className="text-xs font-black uppercase text-cris-blue">
              Cópia manual
            </p>
            <h2
              className="mt-1 text-3xl font-black text-cris-navy"
              id="pix-manual-title"
            >
              Chave PIX
            </h2>
            <p className="mt-3 text-sm font-bold leading-relaxed text-cris-navy/70">
              Não foi possível copiar automaticamente. Pressione a chave abaixo
              para selecioná-la e copiar manualmente.
            </p>
            <p className="mt-4 select-all break-all rounded-lg bg-cris-paper p-4 font-mono text-sm font-black text-cris-navy ring-1 ring-cris-navy/10">
              {pixKey}
            </p>
            <button
              className="mt-5 min-h-12 w-full rounded-lg bg-cris-navy px-5 py-3 text-sm font-black uppercase text-white focus:outline-none focus:ring-4 focus:ring-cris-yellow/50"
              onClick={() => setShowManualCopy(false)}
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
