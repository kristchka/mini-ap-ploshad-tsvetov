import type { PavilionCode } from "../types";
import { hasSupabaseConfig, supabase } from "./supabase";

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
  if (!hasSupabaseConfig) {
    console.error("CHECK_IN_SKIPPED: Supabase config is missing");
    return {
      ok: false,
      status: "invalid_pavilion",
      message: "Supabase недоступен",
      visited: [],
    };
  }

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

  try {
    for (const candidate of candidates) {
      const { data, error } = await supabase.rpc(candidate.name, candidate.args);

      if (!error) {
        return data as CheckInResult;
      }

      if (isMissingCheckInRpcError(error)) {
        lastMissingRpcError = error;
        continue;
      }

      console.error("CHECK_IN_RPC_ERROR:", error);
      return {
        ok: false,
        status: "invalid_pavilion",
        message: "Supabase недоступен",
        visited: [],
      };
    }

    console.error("CHECK_IN_RPC_MISSING:", lastMissingRpcError);
    return {
      ok: false,
      status: "invalid_pavilion",
      message: "Supabase недоступен",
      visited: [],
    };
  } catch (error) {
    console.error("CHECK_IN_SUPABASE_ERROR:", error);
    return {
      ok: false,
      status: "invalid_pavilion",
      message: "Supabase недоступен",
      visited: [],
    };
  }
}

export async function getProgressByPhone(
  phone: string
): Promise<ProgressResult> {
  if (!hasSupabaseConfig) {
    console.error("LOAD_PROGRESS_SKIPPED: Supabase config is missing");
    return { ok: false, message: "Supabase недоступен", visited: [] };
  }

  try {
    const { data, error } = await supabase.rpc("get_progress_by_phone", {
      input_phone: phone,
    });

    if (error) {
      console.error("LOAD_PROGRESS_RPC_ERROR:", error);
      return { ok: false, message: "Supabase недоступен", visited: [] };
    }

    return data as ProgressResult;
  } catch (error) {
    console.error("LOAD_PROGRESS_SUPABASE_ERROR:", error);
    return { ok: false, message: "Supabase недоступен", visited: [] };
  }
}
