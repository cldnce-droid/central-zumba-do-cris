"use client";

import { useEffect } from "react";
import {
  getOneSignal,
  isAppIdMismatch,
  resetOneSignalRegistration
} from "@/lib/onesignalClient";

export function OneSignalInitializer() {
  useEffect(() => {
    void getOneSignal().catch(async (error) => {
      if (!isAppIdMismatch(error)) return;
      await resetOneSignalRegistration();
      window.location.reload();
    });
  }, []);

  return null;
}
