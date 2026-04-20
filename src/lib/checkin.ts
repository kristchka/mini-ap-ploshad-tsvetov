import type { PavilionCode } from "../types";
import { supabase } from "./supabase";

export interface CheckInResult {
  ok: boolean;
  status:
    | "checked_in"
    | "already_checked"
    | "invalid_phone"
    | "invalid_pavilion";
  message: string;
  participant_id?: string;
  pavilion_id?: string;
  pavilion_name?: string;
  progress?: number;
  visited?: PavilionCode[];
}

export interface ProgressResult {
  ok: boolean;
  message?: string;
  participant_id?: string | null;
  progress?: number;
  visited?: PavilionCode[];
}

interface RpcSignatureCandidate {
  name: string;
  args: Record<string, string>;
}

function isMissingCheckInRpcError(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
} | null): boolean {
  if (!error) {
    return false;
  }

  const text = [
    error.code,
    error.message,
    error.details,
    error.hint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    text.includes("could not find the function") ||
    text.includes("does not exist") ||
    text.includes("no function matches") ||
    text.includes("schema cache")
  );
}

export async function submitCheckInByToken(
  phone: string,
  qrToken: string
): Promise<CheckInResult> {
  const candidates: RpcSignatureCandidate[] = [
    {
      name: "submit_check_in_by_token",
      args: {
        input_phone: phone,
        input_qr_token: qrToken,
      },
    },
    {
      name: "submit_check_in",
      args: {
        input_phone: phone,
        input_qr_token: qrToken,
      },
    },
    {
      name: "submit_check_in_by_token",
      args: {
        input_phone: phone,
        input_code: qrToken,
      },
    },
    {
      name: "submit_check_in",
      args: {
        input_phone: phone,
        input_code: qrToken,
      },
    },
  ];

  let lastMissingRpcError: unknown = null;

  for (const candidate of candidates) {
    const { data, error } = await supabase.rpc(candidate.name, candidate.args);

    if (!error) {
      return data as CheckInResult;
    }

    if (isMissingCheckInRpcError(error)) {
      lastMissingRpcError = error;
      continue;
    }

    throw error;
  }

  throw lastMissingRpcError;
}

export async function getProgressByPhone(
  phone: string
): Promise<ProgressResult> {
  const { data, error } = await supabase.rpc("get_progress_by_phone", {
    input_phone: phone,
  });

  if (error) {
    throw error;
  }

  return data as ProgressResult;
}
