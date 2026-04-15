import type {
  SendCodeRequest,
  SendCodeResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
  UserMeResponse,
  ProgressResponse,
  CheckInRequest,
  CheckInResponse,
  PavilionCode,
} from "../types";
import { APP_CONFIG } from "../config";
import {
  getStoredProgress,
  setStoredProgress,
  setStoredUser,
} from "./storage";

class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function http<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  token?: string
): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${APP_CONFIG.BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new ApiError(res.status, `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

const pause = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const MockApi = {
  async sendCode(_req: SendCodeRequest): Promise<SendCodeResponse> {
    await pause(800);
    return { ok: true };
  },

  async verifyCode(req: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    await pause(900);
    if (req.code.length === APP_CONFIG.OTP_LENGTH) {
      const token = `tok_${Date.now()}`;
      setStoredUser({ phone: req.phone, token });
      if (getStoredProgress().length === 0) {
        setStoredProgress([]);
      }
      return { ok: true, token };
    }
    return { ok: false, error: "invalid_code" };
  },

  async getMe(): Promise<UserMeResponse> {
    await pause(150);
    const phone = localStorage.getItem("pf_phone");
    return { phone: phone ?? "" };
  },

  async getProgress(): Promise<ProgressResponse> {
    await pause(200);
    return { visited: getStoredProgress() };
  },

  async checkIn(req: CheckInRequest): Promise<CheckInResponse> {
    await pause(600);
    const visited = getStoredProgress();

    if (visited.includes(req.pavilionCode)) {
      return { status: "already_counted", visited };
    }

    const updated: PavilionCode[] = [...visited, req.pavilionCode];
    setStoredProgress(updated);

    if (updated.length >= APP_CONFIG.TOTAL_PAVILIONS) {
      return { status: "completed", visited: updated };
    }

    return { status: "success", visited: updated };
  },
};

const RealApi = {
  async sendCode(req: SendCodeRequest): Promise<SendCodeResponse> {
    return http<SendCodeResponse>("POST", "/api/auth/send-code", req);
  },

  async verifyCode(req: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    const res = await http<VerifyCodeResponse>(
      "POST",
      "/api/auth/verify-code",
      req
    );
    if (res.ok && res.token) {
      setStoredUser({ phone: req.phone, token: res.token });
    }
    return res;
  },

  async getMe(token: string): Promise<UserMeResponse> {
    return http<UserMeResponse>("GET", "/api/user/me", undefined, token);
  },

  async getProgress(token: string): Promise<ProgressResponse> {
    return http<ProgressResponse>("GET", "/api/user/progress", undefined, token);
  },

  async checkIn(
    req: CheckInRequest,
    token: string
  ): Promise<CheckInResponse> {
    return http<CheckInResponse>("POST", "/api/pavilion/check-in", req, token);
  },
};

export const api = MockApi;
export { ApiError, RealApi };