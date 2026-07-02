"use client";

import { useEffect } from "react";
import { getOneSignal } from "@/lib/onesignalClient";

export function OneSignalInitializer() {
  useEffect(() => {
    void getOneSignal().catch(() => undefined);
  }, []);

  return null;
}
