import type { PavilionCode } from "../types";
import { supabase } from "./supabase";

export interface CheckInResult {
  ok: boolean;
  status: "checked_in" | "already_checked" | "invalid_phone" | "invalid_pavilion";
  message: string;
  participant_id?: string;
  pavilion_id?: string;
  pavilion_name?: string;
  progress?: number;
  visited?: PavilionCode[];
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
