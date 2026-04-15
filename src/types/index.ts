export type PavilionCode = `p${number}`;

export interface Pavilion {
  code: PavilionCode;
  name: string;
}

export type CheckInStatus =
  | "success"
  | "already_counted"
  | "completed"
  | "invalid_qr"
  | "unauthorized"
  | "error";

export interface UserProfile {
  phone: string;
  token: string;
}

export interface Progress {
  visited: PavilionCode[];
  total: number;
}

export interface SendCodeRequest {
  phone: string;
}

export interface SendCodeResponse {
  ok: boolean;
}

export interface VerifyCodeRequest {
  phone: string;
  code: string;
}

export interface VerifyCodeResponse {
  ok: boolean;
  token?: string;
  error?: "invalid_code" | "expired" | "too_many_attempts";
}

export interface UserMeResponse {
  phone: string;
}

export interface ProgressResponse {
  visited: PavilionCode[];
}

export interface CheckInRequest {
  pavilionCode: PavilionCode;
}

export interface CheckInResponse {
  status: CheckInStatus;
  visited: PavilionCode[];
}

export type PageName =
  | "loading"
  | "welcome"
  | "login"
  | "verify"
  | "result"
  | "cabinet"
  | "rules"
  | "privacy"
  | "error";

export interface AppState {
  page: PageName;
  prevPage: PageName;
  phone: string;
  qrCode: PavilionCode;
  pavilions: PavilionCode[];
  resultStatus: CheckInStatus | null;
  errorMessage: string;
  isLoading: boolean;
  loginError: string;
  verifyError: string;
}