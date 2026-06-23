"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    // OneSignal owns the root service worker when push is enabled.
    if (process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
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
