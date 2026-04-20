import { useState, useEffect, useCallback } from "react";
import type { PavilionCode, CheckInStatus, PageName } from "../types";
import { api } from "../lib/api";
import { submitCheckInByToken, getProgressByPhone } from "../lib/checkin";
import { getStoredUser, clearStoredUser } from "../lib/storage";
import { APP_CONFIG } from "../config";

const DEMO_QR_TOKENS: Record<PavilionCode, string> = {
  p1: "flower-pav-01-x8d2",
  p2: "flower-pav-02-k4m1",
  p3: "flower-pav-03-u7n9",
  p4: "flower-pav-04-w2r6",
  p5: "flower-pav-05-z8q3",
  p6: "flower-pav-06-t1b7",
  p7: "flower-pav-07-p6x4",
  p8: "flower-pav-08-l9c2",
  p9: "flower-pav-09-v5h8",
  p10: "flower-pav-10-j3s6",
};

// Если в Supabase у тебя другие qr_token, просто замени значения выше на свои.

function hasQrTokenInUrl(): boolean {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  return params.has("qr");
}

function getInitialQrToken(): string {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  return params.get("qr") ?? "";
}

function getInitialDemoQrCode(): PavilionCode {
  const token = getInitialQrToken();

  const found = Object.entries(DEMO_QR_TOKENS).find(
    ([, value]) => value === token
  );

  return (found?.[0] as PavilionCode) ?? ("p1" as PavilionCode);
}

function normalizePhoneForBackend(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (!digits) return "";

  if (
    digits.length === 11 &&
    (digits.startsWith("7") || digits.startsWith("8"))
  ) {
    return `+7${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `+7${digits}`;
  }

  return `+${digits}`;
}

function mapRemoteStatus(
  remoteStatus:
    | "checked_in"
    | "already_checked"
    | "invalid_phone"
    | "invalid_pavilion",
  progress: number
): CheckInStatus {
  if (progress >= APP_CONFIG.TOTAL_PAVILIONS) {
    return "completed";
  }

  if (remoteStatus === "already_checked") {
    return "already_counted";
  }

  return "success";
}

export function useTimer(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const reset = useCallback(() => setSeconds(initialSeconds), [initialSeconds]);

  return { seconds, isExpired: seconds <= 0, reset };
}

export function usePhoneFormatter(initial = "") {
  const [phone, setPhone] = useState(initial);

  const format = useCallback((raw: string): string => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";

    const normalized =
      digits[0] === "7" || digits[0] === "8"
        ? digits.slice(1, 11)
        : digits.slice(0, 10);

    let result = "+7";
    if (normalized.length > 0) result += ` (${normalized.slice(0, 3)}`;
    if (normalized.length >= 3) result += `) ${normalized.slice(3, 6)}`;
    if (normalized.length >= 6) result += `-${normalized.slice(6, 8)}`;
    if (normalized.length >= 8) result += `-${normalized.slice(8, 10)}`;
    return result;
  }, []);

  const handleChange = useCallback(
    (value: string) => setPhone(format(value)),
    [format]
  );

  const rawDigits = phone.replace(/\D/g, "");
  const isValid = rawDigits.length >= 11;

  return { phone, handleChange, rawDigits, isValid };
}

export function useOTP(length = APP_CONFIG.OTP_LENGTH) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));

  const setDigit = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    setDigits((prev) => {
      const next = [...prev];
      next[index] = value.slice(-1);
      return next;
    });
  }, []);

  const clear = useCallback(() => setDigits(Array(length).fill("")), [length]);

  const code = digits.join("");
  const isComplete = code.length === length && digits.every((d) => d !== "");

  return { digits, setDigit, clear, code, isComplete };
}

export function useApp() {
  const [page, setPage] = useState<PageName>("loading");
  const [prevPage, setPrevPage] = useState<PageName>("welcome");
  const [phone, setPhone] = useState("");
  const [qrToken, setQrToken] = useState<string>(getInitialQrToken());
  const [hasQrToken, setHasQrToken] = useState<boolean>(hasQrTokenInUrl());
  const [demoQrCode, setDemoQrCode] = useState<PavilionCode>(getInitialDemoQrCode());
  const [pavilions, setPavilions] = useState<PavilionCode[]>([]);
  const [resultStatus, setResultStatus] = useState<CheckInStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loginError, setLoginError] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const setQrCode = useCallback((code: PavilionCode) => {
    setDemoQrCode(code);
    setQrToken(DEMO_QR_TOKENS[code]);
    setHasQrToken(true);
  }, []);

  const clearQrToken = useCallback(() => {
    setQrToken("");
    setHasQrToken(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);

    if (hasQrToken && qrToken) {
      url.searchParams.set("qr", qrToken);
    } else {
      url.searchParams.delete("qr");
    }

    window.history.replaceState({}, "", url.toString());
  }, [qrToken, hasQrToken]);

  const navigate = useCallback(
    (next: PageName) => {
      setPrevPage(page);
      setPage(next);
    },
    [page]
  );

  const loadProgress = useCallback(async (phoneForLoad: string) => {
    const activePhone = normalizePhoneForBackend(phoneForLoad);

    if (!activePhone) {
      setErrorMessage("Не удалось определить номер телефона участника.");
      setPage("error");
      return;
    }

    setPage("loading");

    try {
      const remoteRes = await getProgressByPhone(activePhone);

      if (!remoteRes.ok) {
        setErrorMessage(remoteRes.message || "Не удалось загрузить прогресс.");
        setPage("error");
        return;
      }

      const visited = (remoteRes.visited ?? []) as PavilionCode[];
      setPavilions(visited);
      setResultStatus(
        visited.length >= APP_CONFIG.TOTAL_PAVILIONS ? "completed" : null
      );
      setPage("cabinet");
    } catch (error) {
      console.error("LOAD_PROGRESS_ERROR:", error);
      setErrorMessage("Не удалось загрузить прогресс. Попробуйте ещё раз.");
      setPage("error");
    }
  }, []);

  const doCheckInByToken = useCallback(
    async (token: string, phoneForCheckIn: string) => {
      const activePhone = normalizePhoneForBackend(phoneForCheckIn);

      if (!activePhone) {
        setErrorMessage("Не удалось определить номер телефона участника.");
        setPage("error");
        return;
      }

      if (!token) {
        setErrorMessage("QR-токен не найден.");
        setPage("error");
        return;
      }

      setPage("loading");

      try {
        const remoteRes = await submitCheckInByToken(activePhone, token);

        if (!remoteRes.ok) {
          setErrorMessage(remoteRes.message || "Не удалось засчитать павильон.");
          setPage("error");
          return;
        }

        const visited = (remoteRes.visited ?? []) as PavilionCode[];
        const progress = remoteRes.progress ?? visited.length;

        setPavilions(visited);
        setResultStatus(mapRemoteStatus(remoteRes.status, progress));
        setPage("result");
      } catch (error) {
        console.error("CHECK_IN_BY_TOKEN_ERROR:", error);
        setErrorMessage("Не удалось засчитать павильон. Попробуйте ещё раз.");
        setPage("error");
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const user = getStoredUser();

      if (!user) {
        if (!cancelled) setPage("welcome");
        return;
      }

      if (cancelled) return;
      setPhone(user.phone);

      if (hasQrToken && qrToken) {
        await doCheckInByToken(qrToken, user.phone);
      } else {
        await loadProgress(user.phone);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [qrToken, hasQrToken, doCheckInByToken, loadProgress]);

  const handleStart = useCallback(async () => {
    const user = getStoredUser();

    if (user) {
      if (hasQrToken && qrToken) {
        await doCheckInByToken(qrToken, user.phone);
      } else {
        await loadProgress(user.phone);
      }
    } else {
      setPage("login");
    }
  }, [qrToken, hasQrToken, doCheckInByToken, loadProgress]);

  const handleSendCode = useCallback(async (rawPhone: string) => {
    setIsLoading(true);
    setLoginError("");

    try {
      await api.sendCode({ phone: rawPhone });
      setPhone(rawPhone);
      setPage("verify");
    } catch {
      setLoginError("Ошибка отправки. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleVerify = useCallback(
    async (code: string) => {
      setIsLoading(true);
      setVerifyError("");

      try {
        const res = await api.verifyCode({ phone, code });

        if (!res.ok) {
          setVerifyError("Неверный код. Попробуйте ещё раз.");
          return;
        }

        if (hasQrToken && qrToken) {
          await doCheckInByToken(qrToken, phone);
        } else {
          await loadProgress(phone);
        }
      } catch {
        setVerifyError("Ошибка сети. Попробуйте ещё раз.");
      } finally {
        setIsLoading(false);
      }
    },
    [phone, qrToken, hasQrToken, doCheckInByToken, loadProgress]
  );

  const handleLogout = useCallback(() => {
    clearStoredUser();
    setPavilions([]);
    setPhone("");
    setResultStatus(null);
    clearQrToken();
    setPage("welcome");
  }, [clearQrToken]);

  const handleResend = useCallback(async () => {
    try {
      await api.sendCode({ phone });
    } catch {
      // silently fail on resend
    }
  }, [phone]);

  return {
    page,
    prevPage,
    phone,
    qrCode: demoQrCode,
    qrToken,
    hasQrToken,
    pavilions,
    resultStatus,
    errorMessage,
    loginError,
    verifyError,
    isLoading,
    navigate,
    setQrToken: setQrCode,
    setQrTokenFromScan: setQrCode,
    setQrCode,
    handleStart,
    handleSendCode,
    handleVerify,
    handleLogout,
    handleResend,
  };
}
