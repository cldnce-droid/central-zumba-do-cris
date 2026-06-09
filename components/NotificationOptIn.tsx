"use client";

import { useEffect, useState } from "react";

type NotificationStatus = "idle" | "success" | "denied" | "unsupported";

const messages: Record<Exclude<NotificationStatus, "idle">, string> = {
  success: "💖 Notificações ativadas com sucesso!",
  denied: "Tudo bem! Você ainda pode acompanhar os avisos por aqui.",
  unsupported: "Seu navegador ainda não permite notificações."
};

export function NotificationOptIn() {
  const [status, setStatus] = useState<NotificationStatus>("idle");

  useEffect(() => {
    if (!("Notification" in window)) {
      setStatus("unsupported");
      return;
    }

    if (Notification.permission === "granted") setStatus("success");
    if (Notification.permission === "denied") setStatus("denied");
  }, []);

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      setStatus("unsupported");
      return;
    }

    try {
      // This registration is also the base for a future PushManager subscription.
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/sw.js");
      }

      const permission = await Notification.requestPermission();
      setStatus(permission === "granted" ? "success" : "denied");
    } catch {
      setStatus("unsupported");
    }
  };

  const isFinished = status !== "idle";

  return (
    <section className="relative overflow-hidden rounded-lg bg-cris-navy p-5 text-white shadow-[0_20px_55px_rgba(7,16,70,0.22)] sm:p-6">
      <div
        aria-hidden="true"
        className="paint-stroke absolute -right-10 top-6 h-9 w-44 bg-cris-pink"
      />
      <div className="relative max-w-2xl">
        <p className="text-sm font-black uppercase text-cris-yellow">
          🔔 Ative as notificações
        </p>
        <p className="mt-3 text-base font-bold leading-relaxed text-white/80">
          Receba novidades, lembretes das aulas e avisos importantes do Zumba do
          Cris direto no seu celular.
        </p>

        <button
          className="mt-5 min-h-12 rounded-lg bg-cris-yellow px-5 py-3 text-sm font-black uppercase text-cris-navy shadow-[0_10px_25px_rgba(255,196,0,0.22)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-cris-pink/45 disabled:cursor-default disabled:opacity-70"
          disabled={isFinished}
          onClick={requestNotifications}
          type="button"
        >
          Ativar notificações
        </button>

        <div aria-live="polite">
          {isFinished ? (
            <p
              className={`mt-4 rounded-lg px-4 py-3 text-sm font-black ${
                status === "success"
                  ? "bg-cris-pink text-white"
                  : "bg-white/10 text-white"
              }`}
            >
              {messages[status]}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
