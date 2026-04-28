import {
  clearOtpCookie,
  hashCode,
  normalizePhone,
  OTP_COOKIE,
  readCookie,
  readJson,
  readOtpToken,
  sendJson,
} from "../_otp.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "Метод не поддерживается" });
    return;
  }

  const apiId = process.env.SMSRU_API_ID;

  if (!apiId) {
    sendJson(res, 500, { ok: false, message: "SMS-сервис не настроен" });
    return;
  }

  try {
    const body = await readJson(req);
    const phone = normalizePhone(body.phone);
    const code = String(body.code || "").replace(/\D/g, "");
    const record = readOtpToken(apiId, readCookie(req, OTP_COOKIE));

    if (!record || record.phone !== phone) {
      sendJson(res, 400, {
        ok: false,
        message: "Сначала запросите SMS-код",
      });
      return;
    }

    if (Date.now() > record.expiresAt) {
      clearOtpCookie(res);
      sendJson(res, 400, {
        ok: false,
        message: "Код истёк. Запросите новый",
      });
      return;
    }

    const expected = record.codeHash;
    const actual = hashCode(apiId, phone, code);

    if (actual !== expected) {
      sendJson(res, 400, {
        ok: false,
        message: "Неверный код",
      });
      return;
    }

    clearOtpCookie(res);
    sendJson(res, 200, {
      ok: true,
      message: "Код подтверждён",
      phone,
    });
  } catch (error) {
    console.error("VERIFY_OTP_ERROR:", error);
    sendJson(res, 500, {
      ok: false,
      message: "Не удалось проверить SMS-код",
    });
  }
}
