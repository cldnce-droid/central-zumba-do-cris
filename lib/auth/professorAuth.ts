import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const PROFESSOR_COOKIE = "zdc_professor_session";
const SESSION_VALUE = "professor-authenticated-v1";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

function safeEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return (
    firstBuffer.length === secondBuffer.length &&
    timingSafeEqual(firstBuffer, secondBuffer)
  );
}

function createSessionToken() {
  const password = getAdminPassword();
  if (!password) return "";
  return createHmac("sha256", password).update(SESSION_VALUE).digest("hex");
}

export function isAdminPasswordConfigured() {
  return Boolean(getAdminPassword());
}

export function isValidAdminPassword(password: string) {
  const configuredPassword = getAdminPassword();
  return Boolean(configuredPassword) && safeEqual(password, configuredPassword);
}

export function isProfessorTokenValid(token?: string) {
  const expectedToken = createSessionToken();
  return Boolean(token && expectedToken) && safeEqual(token, expectedToken);
}

export function isProfessorRequestAuthenticated(request: NextRequest) {
  return isProfessorTokenValid(request.cookies.get(PROFESSOR_COOKIE)?.value);
}

export function setProfessorSession(response: NextResponse) {
  response.cookies.set(PROFESSOR_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export function clearProfessorSession(response: NextResponse) {
  response.cookies.set(PROFESSOR_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0
  });
}
