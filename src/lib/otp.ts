import { APP_CONFIG } from "../config";

type OtpRecord = {
  phone: string;
  code: string;
  sentAt: number;
  expiresAt: number;
};

type OtpProvider = {
  sendOtp: (phone: string) => Promise<SendOtpResult>;
  verifyOtp: (phone: string, code: string) => Promise<VerifyOtpResult>;
};

export type SendOtpResult = {
  ok: boolean;
  message: string;
  phone: string;
  debugCode?: string;
  expiresInSec?: number;
  retryAfterSec?: number;
};

export type VerifyOtpResult = {
  ok: boolean;
  message: string;
  phone?: string;
};

const MOCK_OTP_STORAGE_KEY = "promo_mock_otp";
const MOCK_OTP_TTL_SEC = 5 * 60;
const OTP_RESEND_LIMIT_SEC = 60;

let memoryOtpRecord: OtpRecord | null = null;

export function normalizePhone(input: string): string {
  const digits = (input || "").replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `7${digits}`;
  }

  return digits;
}

function isPhoneValid(phone: string): boolean {
  return /^7\d{10}$/.test(phone);
}

function createMockCode(): string {
  const length = APP_CONFIG.OTP_LENGTH;
  const max = 10 ** length;

  return Math.floor(Math.random() * max)
    .toString()
    .padStart(length, "0");
}

function isLocalDev(): boolean {
  if (typeof window === "undefined") return false;

  return (
    import.meta.env.DEV &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "::1")
  );
}

function readMockOtpRecord(): OtpRecord | null {
  if (typeof window === "undefined") return memoryOtpRecord;

  try {
    const raw = window.localStorage.getItem(MOCK_OTP_STORAGE_KEY);
    if (!raw) return memoryOtpRecord;

    return JSON.parse(raw) as OtpRecord;
  } catch {
    return memoryOtpRecord;
  }
}

function writeMockOtpRecord(record: OtpRecord): void {
  memoryOtpRecord = record;

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(MOCK_OTP_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // In private browsing or restricted storage, in-memory OTP is enough.
  }
}

function clearMockOtpRecord(): void {
  memoryOtpRecord = null;

  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(MOCK_OTP_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup errors.
  }
}

const mockOtpProvider: OtpProvider = {
  async sendOtp(phone: string): Promise<SendOtpResult> {
    const normalizedPhone = normalizePhone(phone);

    if (!isPhoneValid(normalizedPhone)) {
      return {
        ok: false,
        message: "Введите корректный номер телефона",
        phone: normalizedPhone,
      };
    }

    const code = createMockCode();
    const existingRecord = readMockOtpRecord();

    if (
      existingRecord?.phone === normalizedPhone &&
      Date.now() - existingRecord.sentAt < OTP_RESEND_LIMIT_SEC * 1000
    ) {
      const retryAfterSec = Math.ceil(
        (OTP_RESEND_LIMIT_SEC * 1000 - (Date.now() - existingRecord.sentAt)) /
          1000
      );

      return {
        ok: false,
        message: `Повторно отправить код можно через ${retryAfterSec} сек`,
        phone: normalizedPhone,
        retryAfterSec,
      };
    }

    const record: OtpRecord = {
      phone: normalizedPhone,
      code,
      sentAt: Date.now(),
      expiresAt: Date.now() + MOCK_OTP_TTL_SEC * 1000,
    };

    writeMockOtpRecord(record);

    return {
      ok: true,
      message: "Код создан",
      phone: normalizedPhone,
      debugCode: code,
      expiresInSec: MOCK_OTP_TTL_SEC,
    };
  },

  async verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
    const normalizedPhone = normalizePhone(phone);
    const normalizedCode = (code || "").replace(/\D/g, "");
    const record = readMockOtpRecord();

    if (!record || record.phone !== normalizedPhone) {
      return {
        ok: false,
        message: "Сначала запросите SMS-код",
      };
    }

    if (Date.now() > record.expiresAt) {
      clearMockOtpRecord();

      return {
        ok: false,
        message: "Код истёк. Запросите новый",
      };
    }

    if (record.code !== normalizedCode) {
      return {
        ok: false,
        message: "Неверный код",
      };
    }

    clearMockOtpRecord();

    return {
      ok: true,
      message: "Код подтверждён",
      phone: normalizedPhone,
    };
  },
};

const realOtpProvider: OtpProvider = {
  async sendOtp(phone: string): Promise<SendOtpResult> {
    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    return res.json() as Promise<SendOtpResult>;
  },

  async verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
    const res = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });

    return res.json() as Promise<VerifyOtpResult>;
  },
};

function getOtpProvider(): OtpProvider {
  return isLocalDev() ? mockOtpProvider : realOtpProvider;
}

export async function sendOtp(phone: string): Promise<SendOtpResult> {
  return getOtpProvider().sendOtp(phone);
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<VerifyOtpResult> {
  return getOtpProvider().verifyOtp(phone, code);
}
