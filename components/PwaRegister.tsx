"use client";

import { useEffect } from "react";
import { hasOneSignalAppId } from "@/lib/onesignalClient";

export function PwaRegister() {
  useEffect(() => {
    if (hasOneSignalAppId()) {
      if ("caches" in window) {
        // Remove somente caches antigos do app; o worker do OneSignal permanece intacto.
        void caches.keys().then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith("central-zumba-do-cris-"))
              .map((key) => caches.delete(key))
          )
        );
      }

      if ("serviceWorker" in navigator) {
        // OneSignal precisa controlar a raiz; remove apenas o worker antigo da PWA.
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(
              registrations
                .filter((registration) =>
                  String(registration.active?.scriptURL ?? "").endsWith(
                    "/sw.js"
                  )
                )
                .map((registration) => registration.unregister())
            )
          )
          .catch(() => undefined);
      }

      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;

    // Recarrega uma vez quando a nova versão da PWA assume o controle.
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => undefined);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  return null;
}
