import { supabase } from "./supabase";
import { APP_CONFIG } from "../config";
import type { CheckInResponse, PavilionCode } from "../types";

export interface CheckInResult {
  ok: boolean;
  status: "checked_in" | "already_checked" | "invalid_phone" | "invalid_pavilion";
  message: string;
  participant_id?: string;
  pavilion_id?: string;
  pavilion_name?: string;
  progress?: number;
}

export async function submitCheckIn(
  phone: string,
  code: string
): Promise<CheckInResult> {
  const { data, error } = await supabase.rpc("submit_check_in", {
    input_phone: phone,
    input_code: code,
  });

  if (error) {
    throw error;
  }

  return data as CheckInResult;
}

export function mapCheckInResultToUi(
  result: CheckInResult,
  code: PavilionCode,
  currentVisited: PavilionCode[]
): CheckInResponse {
  if (result.status === "invalid_pavilion") {
    return { status: "invalid_qr", visited: currentVisited };
  }

  if (result.status === "already_checked") {
    return {
      status:
        currentVisited.length >= APP_CONFIG.TOTAL_PAVILIONS
          ? "completed"
          : "already_counted",
      visited: currentVisited,
    };
  }

  const visited = currentVisited.includes(code)
    ? currentVisited
    : [...currentVisited, code];

  return {
    status:
      visited.length >= APP_CONFIG.TOTAL_PAVILIONS ? "completed" : "success",
    visited,
  };
}
