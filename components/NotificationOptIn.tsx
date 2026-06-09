"use client";

import { useEffect, useState } from "react";

type NotificationStatus = "idle" | "success" | "denied" | "unsupported";
type TestStatus = "idle" | "shown" | "permission-needed" | "failed";

const messages: Record<Exclude<NotificationStatus, "idle">, string> = {
  success: "💖 Notificações ativadas com sucesso!",
  denied: "Tudo bem! Você ainda pode acompanhar os avisos por aqui.",
  unsupported: "Seu navegador ainda não permite notificações."
};

export function NotificationOptIn() {
  const [status, setStatus] = useState<NotificationStatus>("idle");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");

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

  const testNotification = async () => {
    if (!("Notification" in window)) {
      setStatus("unsupported");
      return;
    }

    if (Notification.permission !== "granted") {
      setTestStatus("permission-needed");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Local preview only: no backend or push subscription is involved.
      await registration.showNotification("🔥 ALERTA DE MOVIMENTO", {
        body:
          "Foi detectado um risco elevado de preguiça hoje. 😅\n\n" +
          "A recomendação oficial é:\n\n" +
          "💃 Zumba do Cris\n" +
          "⏰ Hoje tem aula!\n\n" +
          "Seu sofá já foi avisado.\n\n" +
          "💖 Errou... continua!",
        icon: "/icons/icon-192.png?v=20260609",
        badge: "/icons/icon-192.png?v=20260609",
        data: { url: "/avisos" },
        tag: "zumba-do-cris-teste"
      });

      setTestStatus("shown");
    } catch {
      setTestStatus("failed");
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

        <div className="mt-5 border-t border-white/15 pt-5">
          <button
            className="min-h-12 rounded-lg border-2 border-cris-blue bg-white/5 px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-cris-blue/20 focus:outline-none focus:ring-4 focus:ring-cris-yellow/45"
            onClick={testNotification}
            type="button"
          >
            🧪 Testar Notificação
          </button>

          <div aria-live="polite">
            {testStatus === "shown" ? (
              <p className="mt-3 text-sm font-bold text-cris-yellow">
                Notificação de teste enviada para este dispositivo.
              </p>
            ) : null}
            {testStatus === "permission-needed" ? (
              <p className="mt-3 text-sm font-bold text-white/80">
                Ative as notificações antes de realizar o teste.
              </p>
            ) : null}
            {testStatus === "failed" ? (
              <p className="mt-3 text-sm font-bold text-white/80">
                Não foi possível exibir o teste neste navegador.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
