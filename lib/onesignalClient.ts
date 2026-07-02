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
  };
  User?: {
    PushSubscription?: {
      id?: string | null;
      token?: string | null;
      optedIn?: boolean;
      optIn?: () => Promise<void>;
    };
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalSdk) => void | Promise<void>>;
  }
}

const ONESIGNAL_APP_ID = normalizeAppId(
  process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
);

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

export function isAppIdMismatch(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  return (
    detail.toLowerCase().includes("appid") &&
    detail.toLowerCase().includes("match")
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

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }

  const databaseNames = await getOneSignalDatabaseNames();
  await Promise.all(databaseNames.map(deleteDatabase));

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister())
    );
  }

  oneSignalReady = null;
}

export async function getOneSignal() {
  if (!ONESIGNAL_APP_ID) return null;

  if (!oneSignalReady) {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    oneSignalReady = new Promise<OneSignalSdk>((resolve, reject) => {
      window.OneSignalDeferred?.push(async (oneSignal) => {
        try {
          await oneSignal.init({
            appId: ONESIGNAL_APP_ID,
            serviceWorkerPath: "/OneSignalSDKWorker.js",
            serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
            serviceWorkerParam: { scope: "/" }
          });
          resolve(oneSignal);
        } catch (error) {
          reject(error);
        }
      });

      loadOneSignalScript().catch(reject);
    });
  }

  return oneSignalReady;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function waitForOneSignalSubscription(oneSignal: OneSignalSdk) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const subscription = oneSignal.User?.PushSubscription;
    if (subscription?.id || subscription?.token || subscription?.optedIn) {
      return true;
    }
    await wait(400);
  }

  return false;
}
