import crypto from "node:crypto";

export const OTP_TTL_SEC = 5 * 60;
export const OTP_RESEND_LIMIT_SEC = 60;
export const OTP_COOKIE = "promo_real_otp";

export function normalizePhone(input) {
  const digits = String(input || "").replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `7${digits}`;
  }

  return digits;
}

export function isPhoneValid(phone) {
  return /^7\d{10}$/.test(phone);
}

export function createOtpCode() {
  return String(crypto.randomInt(0, 10_000)).padStart(4, "0");
}

export function hashCode(apiId, phone, code) {
  return crypto
    .createHmac("sha256", apiId)
    .update(`${phone}:${code}`)
    .digest("hex");
}

function signPayload(apiId, payload) {
  return crypto.createHmac("sha256", apiId).update(payload).digest("hex");
}

function base64UrlEncode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function createOtpToken(apiId, record) {
  const payload = base64UrlEncode(JSON.stringify(record));
  const signature = signPayload(apiId, payload);

  return `${payload}.${signature}`;
}

export function readOtpToken(apiId, token) {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = signPayload(apiId, payload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }
}

export function readCookie(req, name) {
  const cookie = req.headers.cookie;
  if (!cookie) return "";

  const match = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

export function setOtpCookie(req, res, token, maxAgeSec) {
  const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `${OTP_COOKIE}=${encodeURIComponent(token)}; Max-Age=${maxAgeSec}; Path=/; HttpOnly; SameSite=Lax${secure}`
  );
}

export function clearOtpCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${OTP_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
  );
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export async function readJson(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
