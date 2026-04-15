import type { PavilionCode, UserProfile } from "../types";

const KEYS = {
  TOKEN: "pf_token",
  PHONE: "pf_phone",
  PROGRESS: "pf_progress",
} as const;

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // fail silently
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // fail silently
  }
}

export function getStoredUser(): UserProfile | null {
  const token = safeGet<string>(KEYS.TOKEN);
  const phone = safeGet<string>(KEYS.PHONE);
  if (!token || !phone) return null;
  return { token, phone };
}

export function setStoredUser(user: UserProfile): void {
  safeSet(KEYS.TOKEN, user.token);
  safeSet(KEYS.PHONE, user.phone);
}

export function clearStoredUser(): void {
  safeRemove(KEYS.TOKEN);
  safeRemove(KEYS.PHONE);
  safeRemove(KEYS.PROGRESS);
}

export function getStoredProgress(): PavilionCode[] {
  return safeGet<PavilionCode[]>(KEYS.PROGRESS) ?? [];
}

export function setStoredProgress(pavilions: PavilionCode[]): void {
  safeSet(KEYS.PROGRESS, pavilions);
}