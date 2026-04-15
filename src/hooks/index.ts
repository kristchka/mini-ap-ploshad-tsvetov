import { useState, useEffect, useCallback } from "react";
import type { PavilionCode, CheckInStatus, PageName } from "../types";
import { api } from "../lib/api";
import {
  getStoredUser,
  clearStoredUser,
  getStoredProgress,
} from "../lib/storage";
import { APP_CONFIG } from "../config";

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

  const setDigit = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      setDigits((prev) => {
        const next = [...prev];
        next[index] = value.slice(-1);
        return next;
      });
    },
    []
  );

  const clear = useCallback(() => setDigits(Array(length).fill("")), [length]);

  const code = digits.join("");
  const isComplete = code.length === length && digits.every((d) => d !== "");

  return { digits, setDigit, clear, code, isComplete };
}

export function useApp(initialQrCode: PavilionCode = "p1" as PavilionCode) {
  const [page, setPage] = useState<PageName>("loading");
  const [prevPage, setPrevPage] = useState<PageName>("welcome");
  const [phone, setPhone] = useState("");
  const [qrCode, setQrCode] = useState<PavilionCode>(initialQrCode);
  const [pavilions, setPavilions] = useState<PavilionCode[]>([]);
  const [resultStatus, setResultStatus] = useState<CheckInStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loginError, setLoginError] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useCallback(
    (next: PageName) => {
      setPrevPage(page);
      setPage(next);
    },
    [page]
  );

  const doCheckIn = useCallback(
    async (code: PavilionCode) => {
      setPage("loading");
      try {
        const res = await api.checkIn({ pavilionCode: code });
        setPavilions(res.visited);
        setResultStatus(res.status);
        setPage("result");
      } catch {
        setErrorMessage("Не удалось засчитать павильон. Попробуйте ещё раз.");
        setPage("error");
      }
    },
    []
  );

  useEffect(() => {
    (async () => {
      const user = getStoredUser();
      if (user) {
        setPhone(user.phone);
        const progress = getStoredProgress();
        setPavilions(progress);
        await doCheckIn(qrCode);
      } else {
        setPage("welcome");
      }
    })();
  }, [doCheckIn, qrCode]);

  const handleStart = useCallback(async () => {
    const user = getStoredUser();
    if (user) {
      const progress = getStoredProgress();
      setPavilions(progress);
      await doCheckIn(qrCode);
    } else {
      setPage("login");
    }
  }, [qrCode, doCheckIn]);

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
        if (res.ok) {
          await doCheckIn(qrCode);
        } else {
          setVerifyError("Неверный код. Попробуйте ещё раз.");
        }
      } catch {
        setVerifyError("Ошибка сети. Попробуйте ещё раз.");
      } finally {
        setIsLoading(false);
      }
    },
    [phone, qrCode, doCheckIn]
  );

  const handleLogout = useCallback(() => {
    clearStoredUser();
    setPavilions([]);
    setPhone("");
    setResultStatus(null);
    setPage("welcome");
  }, []);

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
    qrCode,
    pavilions,
    resultStatus,
    errorMessage,
    loginError,
    verifyError,
    isLoading,
    navigate,
    setQrCode,
    handleStart,
    handleSendCode,
    handleVerify,
    handleLogout,
    handleResend,
  };
}