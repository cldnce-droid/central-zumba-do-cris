"use client";

type OneSignalSdk = {
  init: (options: {
    appId: string;
    serviceWorkerPath?: string;
    serviceWorkerUpdaterPath?: string;
    serviceWorkerParam?: { scope: string };
  }) => Promise<void> | void;
  Notifications?: {
    requestPermission: () => Promise<boolean>;
    isPushSupported?: () => boolean;
    permission?: boolean;
  };
  User?: {
    PushSubscription?: {
      id?: string | null;
      token?: string | null;
      optedIn?: boolean;
      optIn?: () => Promise<void>;
      addEventListener?: (
        event: "change",
        listener: (event: {
          current?: {
            id?: string | null;
            token?: string | null;
            optedIn?: boolean;
          };
        }) => void
      ) => void;
      removeEventListener?: (
        event: "change",
        listener: (event: {
          current?: {
            id?: string | null;
            token?: string | null;
            optedIn?: boolean;
          };
        }) => void
      ) => void;
    };
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalSdk) => void | Promise<void>>;
    OneSignal?: OneSignalSdk;
  }
}

const ONESIGNAL_APP_ID = normalizeAppId(
  process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
) || "19a68934-e56f-4cb4-9f32-f98a6db13e0e";

let oneSignalReady: Promise<OneSignalSdk> | null = null;

export function hasOneSignalAppId() {
  return Boolean(ONESIGNAL_APP_ID);
}

export function normalizeAppId(value: string | undefined) {
  const match = String(value ?? "").match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  return match?.[0] ?? "";
}

function loadOneSignalScript() {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="OneSignalSDK.page.js"]'
    );

    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar OneSignal."));
    document.head.appendChild(script);
  });
}

async function ensureOneSignalServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) =>
        String(registration.active?.scriptURL ?? "").endsWith("/sw.js")
      )
      .map((registration) => registration.unregister())
  );

  const registration = await navigator.serviceWorker.register(
    "/OneSignalSDKWorker.js",
    {
      scope: "/",
      updateViaCache: "none"
    }
  );

  await registration.update().catch(() => undefined);
}

async function initOneSignal(oneSignal: OneSignalSdk) {
  try {
    await ensureOneSignalServiceWorker();

    await oneSignal.init({
      appId: ONESIGNAL_APP_ID,
      serviceWorkerPath: "/OneSignalSDKWorker.js",
      serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
      serviceWorkerParam: {
        scope: "/"
      }
    });
  } catch (error) {
    if (!isAlreadyInitialized(error)) {
      throw error;
    }
  }

  return oneSignal;
}

export function isAppIdMismatch(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  return (
    detail.toLowerCase().includes("appid") &&
    detail.toLowerCase().includes("match")
  );
}

function isAlreadyInitialized(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  return (
    detail.toLowerCase().includes("already") &&
    detail.toLowerCase().includes("init")
  );
}

function deleteDatabase(name: string) {
  return new Promise<void>((resolve) => {
    if (!("indexedDB" in window)) {
      resolve();
      return;
    }

    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

async function getOneSignalDatabaseNames() {
  const indexedDbWithList = indexedDB as IDBFactory & {
    databases?: () => Promise<Array<{ name?: string }>>;
  };

  if (!indexedDbWithList.databases) {
    return ["ONE_SIGNAL_SDK_DB", "OneSignalSDK"];
  }

  const databases = await indexedDbWithList.databases();
  const discovered = databases
    .map((database) => database.name)
    .filter((name): name is string => Boolean(name))
    .filter((name) => name.toLowerCase().includes("onesignal"));

  return Array.from(
    new Set([...discovered, "ONE_SIGNAL_SDK_DB", "OneSignalSDK"])
  );
}

export async function resetOneSignalRegistration(welcomeKey?: string) {
  if (welcomeKey) localStorage.removeItem(welcomeKey);
  [localStorage, sessionStorage].forEach((storage) => {
    Object.keys(storage)
      .filter((key) => key.toLowerCase().includes("onesignal"))
      .forEach((key) => storage.removeItem(key));
  });

  const databaseNames = await getOneSignalDatabaseNames();
  await Promise.all(databaseNames.map(deleteDatabase));

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) =>
          String(registration.active?.scriptURL ?? "").includes("OneSignal")
        )
        .map((registration) => registration.unregister())
    );
  }

  oneSignalReady = null;
}

export async function getOneSignal() {
  if (!ONESIGNAL_APP_ID) return null;

  if (window.OneSignal) {
    return initOneSignal(window.OneSignal);
  }

  if (!oneSignalReady) {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    const deferredReady = new Promise<OneSignalSdk>((resolve, reject) => {
      window.OneSignalDeferred?.push(async (oneSignal) => {
        try {
          resolve(await initOneSignal(oneSignal));
        } catch (error) {
          reject(error);
        }
      });
    });

    const globalReady = loadOneSignalScript().then(async () => {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        if (window.OneSignal) {
          return initOneSignal(window.OneSignal);
        }
        await wait(100);
      }
      throw new Error("OneSignal carregou, mas nao inicializou no navegador.");
    });

    oneSignalReady = Promise.race([
      deferredReady,
      globalReady,
      timeout(10000, "Tempo esgotado ao carregar o OneSignal.")
    ]).catch((error) => {
      oneSignalReady = null;
      throw error;
    });
  }

  return oneSignalReady;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function timeout(ms: number, message: string) {
  return new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error(message)), ms);
  });
}

export async function waitForOneSignalSubscription(oneSignal: OneSignalSdk) {
  const hasSubscription = () => {
    const subscription = oneSignal.User?.PushSubscription;
    return Boolean(subscription?.id || subscription?.token || subscription?.optedIn);
  };

  if (hasSubscription()) return true;

  const changed = new Promise<boolean>((resolve) => {
    const listener = (event: {
      current?: {
        id?: string | null;
        token?: string | null;
        optedIn?: boolean;
      };
    }) => {
      if (event.current?.id || event.current?.token || event.current?.optedIn) {
        oneSignal.User?.PushSubscription?.removeEventListener?.(
          "change",
          listener
        );
        resolve(true);
      }
    };

    oneSignal.User?.PushSubscription?.addEventListener?.("change", listener);
  });

  const polled = (async () => {
    for (let attempt = 0; attempt < 75; attempt += 1) {
      if (hasSubscription()) return true;
      await wait(400);
    }

    return false;
  })();

  return Promise.race([changed, polled]);
}

export async function getOneSignalDebugInfo() {
  if (!("serviceWorker" in navigator)) {
    return "Service worker indisponivel neste navegador.";
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  const workers = registrations
    .map((registration) => {
      const scriptURL =
        registration.active?.scriptURL ??
        registration.installing?.scriptURL ??
        registration.waiting?.scriptURL ??
        "sem script ativo";
      return scriptURL.split("/").pop() ?? scriptURL;
    })
    .join(", ");

  const subscription = window.OneSignal?.User?.PushSubscription;
  const pushSupported = window.OneSignal?.Notifications?.isPushSupported?.();
  const oneSignalPermission = window.OneSignal?.Notifications?.permission;
  const browserPermission =
    "Notification" in window ? Notification.permission : "indisponivel";
  const subscriptionInfo = `Push suportado: ${
    pushSupported ?? "desconhecido"
  }. Permissao navegador: ${browserPermission}. Permissao OneSignal: ${
    oneSignalPermission ?? "desconhecida"
  }. ID: ${subscription?.id ?? "sem id"}. Token: ${
    subscription?.token ? "existe" : "sem token"
  }. OptedIn: ${subscription?.optedIn ?? "desconhecido"}.`;

  return workers
    ? `Service worker atual: ${workers}. ${subscriptionInfo}`
    : `Nenhum service worker registrado. ${subscriptionInfo}`;
}
