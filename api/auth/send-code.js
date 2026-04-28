import {
  createOtpCode,
  createOtpToken,
  hashCode,
  isPhoneValid,
  normalizePhone,
  OTP_COOKIE,
  OTP_RESEND_LIMIT_SEC,
  OTP_TTL_SEC,
  readCookie,
  readJson,
  readOtpToken,
  sendJson,
  setOtpCookie,
} from "../_otp.js";

async function sendSms(apiId, phone, code) {
  const body = new URLSearchParams({
    api_id: apiId,
    to: phone,
    msg: `Код подтверждения: ${code}`,
    json: "1",
  });

  const res = await fetch("https://sms.ru/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`SMS.ru HTTP ${res.status}`);
  }

  const data = await res.json();
  const smsStatus = data.sms?.[phone]?.status;

  if (data.status !== "OK" || smsStatus !== "OK") {
    throw new Error(data.status_text || data.sms?.[phone]?.status_text || "SMS.ru error");
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "Метод не поддерживается", phone: "" });
    return;
  }

  const apiId = process.env.SMSRU_API_ID;

  if (!apiId) {
    sendJson(res, 500, { ok: false, message: "SMS-сервис не настроен", phone: "" });
    return;
  }

  try {
    const body = await readJson(req);
    const phone = normalizePhone(body.phone);

    if (!isPhoneValid(phone)) {
      sendJson(res, 400, {
        ok: false,
        message: "Введите корректный номер телефона",
        phone,
      });
      return;
    }

    const existingRecord = readOtpToken(apiId, readCookie(req, OTP_COOKIE));

    if (
      existingRecord?.phone === phone &&
      Date.now() - existingRecord.sentAt < OTP_RESEND_LIMIT_SEC * 1000
    ) {
      const retryAfterSec = Math.ceil(
        (OTP_RESEND_LIMIT_SEC * 1000 - (Date.now() - existingRecord.sentAt)) /
          1000
      );

      sendJson(res, 429, {
        ok: false,
        message: `Повторно отправить код можно через ${retryAfterSec} сек`,
        phone,
        retryAfterSec,
      });
      return;
    }

    const code = createOtpCode();
    const record = {
      phone,
      codeHash: hashCode(apiId, phone, code),
      sentAt: Date.now(),
      expiresAt: Date.now() + OTP_TTL_SEC * 1000,
    };

    await sendSms(apiId, phone, code);
    setOtpCookie(req, res, createOtpToken(apiId, record), OTP_TTL_SEC);

    sendJson(res, 200, {
      ok: true,
      message: "Код отправлен",
      phone,
      expiresInSec: OTP_TTL_SEC,
    });
  } catch (error) {
    console.error("SEND_OTP_ERROR:", error);
    sendJson(res, 500, {
      ok: false,
      message: "Не удалось отправить SMS-код",
      phone: "",
    });
  }
}
