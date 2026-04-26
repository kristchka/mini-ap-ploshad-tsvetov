import { supabase } from "./supabase";

type OtpRpcResponse = {
  ok?: boolean;
  message?: string;
  debug_code?: string;
  expires_in_sec?: number;
  phone?: string;
};

export type SendOtpResult = {
  ok: boolean;
  message: string;
  phone: string;
  debugCode?: string;
  expiresInSec?: number;
};

export type VerifyOtpResult = {
  ok: boolean;
  message: string;
  phone?: string;
};

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

export async function sendOtp(phone: string): Promise<SendOtpResult> {
  const normalizedPhone = normalizePhone(phone);

  const { data, error } = await supabase.rpc("generate_otp_code", {
    input_phone: normalizedPhone,
  });

  if (error) {
    return {
      ok: false,
      message: error.message || "Не удалось создать код",
      phone: normalizedPhone,
    };
  }

  const payload = (data || {}) as OtpRpcResponse;

  return {
    ok: Boolean(payload.ok),
    message: payload.message || (payload.ok ? "Код создан" : "Не удалось создать код"),
    phone: normalizedPhone,
    debugCode: payload.debug_code,
    expiresInSec: payload.expires_in_sec,
  };
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<VerifyOtpResult> {
  const normalizedPhone = normalizePhone(phone);
  const normalizedCode = (code || "").replace(/\D/g, "");

  const { data, error } = await supabase.rpc("verify_otp_code", {
    input_phone: normalizedPhone,
    input_code: normalizedCode,
  });

  if (error) {
    return {
      ok: false,
      message: error.message || "Не удалось проверить код",
    };
  }

  const payload = (data || {}) as OtpRpcResponse;

  return {
    ok: Boolean(payload.ok),
    message: payload.message || (payload.ok ? "Код подтверждён" : "Неверный код"),
    phone: payload.phone,
  };
}
