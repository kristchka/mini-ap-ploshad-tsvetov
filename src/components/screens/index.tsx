import React, { useRef } from "react";
import type { CheckInStatus, PavilionCode } from "../../types";
import { APP_CONFIG, TEXTS } from "../../config";
import {
  Logo,
  Button,
  BackButton,
  FooterLinks,
  Badge,
} from "../ui";
import { PavilionGrid, PavilionList } from "../PavilionGrid";
import { usePhoneFormatter, useOTP, useTimer } from "../../hooks";

export function LoadingScreen(): React.ReactElement {
  return (
    <div
      className="screen"
      style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}
    >
      <div style={{ fontSize: 44, marginBottom: 16 }}>🌸</div>
      <div className="spin dark" style={{ margin: "0 auto 12px" }} />
      <p style={{ fontSize: 15, color: "var(--muted)" }}>Загружаем...</p>
    </div>
  );
}

interface WelcomeScreenProps {
  onStart: () => void;
  onRules: () => void;
  onPrivacy: () => void;
}

export function WelcomeScreen({
  onStart,
  onRules,
  onPrivacy,
}: WelcomeScreenProps): React.ReactElement {
  const { welcome } = TEXTS;

  return (
    <div className="screen fade">
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />
      <div className="hdr">
        <Logo />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingTop: 20,
        }}
      >
        <div style={{ textAlign: "center", fontSize: 54, marginBottom: 18, lineHeight: 1 }}>
          🌺🌸🌼
        </div>

        <div className="display">
          {welcome.title.split(" ").slice(0, 2).join(" ")}
          <br />
          {welcome.title.split(" ").slice(2).join(" ")}
        </div>

        <p className="sub" style={{ fontSize: 15, marginTop: 12 }}>
          {welcome.subtitle}
        </p>

        <div className="steps">
          {welcome.steps.map((text, i) => (
            <div key={i} className="step">
              <div className="snum">{i + 1}</div>
              <span style={{ fontSize: 14 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Button onClick={onStart}>{welcome.cta}</Button>
        <FooterLinks onRules={onRules} onPrivacy={onPrivacy} />
      </div>
    </div>
  );
}

interface LoginScreenProps {
  onSubmit: (phone: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
}

export function LoginScreen({
  onSubmit,
  onBack,
  isLoading,
  error,
}: LoginScreenProps): React.ReactElement {
  const { phone, handleChange, rawDigits, isValid } = usePhoneFormatter();
  const [agreed, setAgreed] = React.useState(false);
  const canSubmit = isValid && agreed && !isLoading;

  return (
    <div className="screen fade">
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />
      <div className="hdr">
        <BackButton onClick={onBack} />
      </div>

      <div style={{ paddingTop: 26, flex: 1 }}>
        <p className="caption">{TEXTS.login.caption}</p>
        <div className="h2">
          Введите номер
          <br />
          телефона
        </div>
        <p className="sub">{TEXTS.login.subtitle}</p>

        <div style={{ marginTop: 30 }}>
          <label className="lbl">Номер телефона</label>
          <input
            className={`inp${error ? " err" : ""}`}
            type="tel"
            inputMode="tel"
            placeholder={TEXTS.login.phonePlaceholder}
            value={phone}
            onChange={(e) => handleChange(e.target.value)}
            autoFocus
          />
          {error && <div className="err-txt">{error}</div>}

          <label className="chk-wrap" style={{ marginTop: 16 }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="chk-txt">
              {TEXTS.login.consentText}{" "}
              <a href="#privacy" onClick={(e) => e.preventDefault()}>
                {TEXTS.login.consentLink}
              </a>
            </span>
          </label>
        </div>
      </div>

      <Button
        isLoading={isLoading}
        loadingText={TEXTS.login.loadingBtn}
        disabled={!canSubmit}
        onClick={() => onSubmit(rawDigits)}
      >
        {TEXTS.login.submitBtn}
      </Button>
    </div>
  );
}

interface VerifyScreenProps {
  phone: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
}

export function VerifyScreen({
  phone,
  onVerify,
  onResend,
  onBack,
  isLoading,
  error,
}: VerifyScreenProps): React.ReactElement {
  const { digits, setDigit, code, isComplete } = useOTP(APP_CONFIG.OTP_LENGTH);
  const { seconds, isExpired, reset } = useTimer(APP_CONFIG.RESEND_TIMEOUT_SEC);
  const refs = Array.from({ length: APP_CONFIG.OTP_LENGTH }, () => useRef<HTMLInputElement>(null));

  const masked =
    phone.length >= 11
      ? `+7 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-**-**`
      : phone;

  const handleChange = (i: number, value: string) => {
    setDigit(i, value);

    if (value && i < APP_CONFIG.OTP_LENGTH - 1) {
      refs[i + 1].current?.focus();
    }

    const updated = [...digits];
    updated[i] = value.slice(-1);
    const full = updated.join("");

    if (full.length === APP_CONFIG.OTP_LENGTH && updated.every((d) => d)) {
      onVerify(full);
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  return (
    <div className="screen fade">
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />
      <div className="hdr">
        <BackButton onClick={onBack} />
      </div>

      <div style={{ paddingTop: 26 }}>
        <p className="caption">{TEXTS.verify.caption}</p>
        <div className="h2">
          Введите код
          <br />
          из SMS
        </div>
        <p className="sub">Отправили на {masked}</p>

        <div
          style={{
            marginTop: 12,
            padding: "8px 13px",
            background: "rgba(193,123,92,.1)",
            borderRadius: 10,
            fontSize: 13,
            color: "var(--terra)",
          }}
        >
          🎭 Демо: введите любые 4 цифры
        </div>

        <div className="otp-row">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              className={`otp${error ? " err" : ""}`}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <div className="err-txt" style={{ textAlign: "center" }}>
            {error}
          </div>
        )}

        <div className="timer">
          {isExpired ? (
            <button
              className="resend"
              onClick={() => {
                reset();
                onResend();
              }}
            >
              {TEXTS.verify.resendBtn}
            </button>
          ) : (
            TEXTS.verify.resendLabel(seconds)
          )}
        </div>
      </div>

      <Button
        isLoading={isLoading}
        loadingText={TEXTS.verify.loadingBtn}
        disabled={!isComplete || isLoading}
        onClick={() => onVerify(code)}
        style={{ marginTop: "auto" }}
      >
        {TEXTS.verify.submitBtn}
      </Button>
    </div>
  );
}

interface ResultScreenProps {
  status: CheckInStatus;
  code: PavilionCode;
  pavilions: PavilionCode[];
  onCabinet: () => void;
}

export function ResultScreen({
  status,
  code,
  pavilions,
  onCabinet,
}: ResultScreenProps): React.ReactElement {
  const cfgMap = TEXTS.result;
  const cfg = cfgMap[status as keyof typeof cfgMap] ?? cfgMap.success;
  const left = APP_CONFIG.TOTAL_PAVILIONS - pavilions.length;

  const subtitle =
    typeof cfg.subtitle === "function"
      ? cfg.subtitle(code)
      : cfg.subtitle;

  const icoClass =
    status === "success" ? "ok" : status === "already_counted" ? "dup" : "win";

  return (
    <div className="screen fade">
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />
      <div className="hdr">
        <Logo />
      </div>

      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}
      >
        <div className={`res-ico ${icoClass}`}>{cfg.icon}</div>
        <div className="h2" style={{ textAlign: "center" }}>
          {cfg.title}
        </div>
        <p className="sub" style={{ textAlign: "center" }}>
          {subtitle}
        </p>

        {status === "completed" ? (
          <div className="card" style={{ marginTop: 28, textAlign: "center" }}>
            <div style={{ fontSize: 48 }}>🌲</div>
            <div
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: 19,
                fontWeight: 600,
                color: "var(--green)",
                marginTop: 10,
              }}
            >
              Участие в розыгрыше подтверждено
            </div>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>
              Розыгрыш в {APP_CONFIG.RAFFLE_DATE}
            </p>
          </div>
        ) : (
          <div className="card" style={{ marginTop: 26 }}>
            <PavilionGrid
              visited={pavilions}
              current={status === "success" ? code : null}
              total={APP_CONFIG.TOTAL_PAVILIONS}
            />
            {left > 0 && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  textAlign: "center",
                  marginTop: 12,
                }}
              >
                {left === 1
                  ? "Остался 1 павильон до участия!"
                  : `Осталось ещё ${left} павильонов`}
              </p>
            )}
          </div>
        )}
      </div>

      <Button onClick={onCabinet} style={{ marginTop: 22 }}>
        Перейти в личный кабинет
      </Button>
    </div>
  );
}

interface CabinetScreenProps {
  phone: string;
  pavilions: PavilionCode[];
  onLogout: () => void;
  onRules: () => void;
  onPrivacy: () => void;
}

export function CabinetScreen({
  phone,
  pavilions,
  onLogout,
  onRules,
  onPrivacy,
}: CabinetScreenProps): React.ReactElement {
  const n = pavilions.length;
  const left = APP_CONFIG.TOTAL_PAVILIONS - n;
  const done = n >= APP_CONFIG.TOTAL_PAVILIONS;
  const { cabinet } = TEXTS;

  const masked =
    phone.length >= 11
      ? `+7 (${phone.slice(1, 4)}) ***-**-${phone.slice(-2)}`
      : phone;

  return (
    <div className="screen fade">
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />
      <div className="hdr">
        <Logo />
        <button
          className="back"
          style={{ color: "#D94F4F", fontWeight: 700 }}
          onClick={onLogout}
        >
          {cabinet.logoutBtn}
        </button>
      </div>

      <div style={{ paddingTop: 6 }}>
        <p className="caption">{cabinet.caption}</p>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 600 }}>
          {masked}
        </div>
        <div style={{ marginTop: 10 }}>
          <Badge variant={done ? "success" : "pending"}>
            {done ? cabinet.badgeDone : cabinet.badgePending}
          </Badge>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <PavilionGrid
          visited={pavilions}
          total={APP_CONFIG.TOTAL_PAVILIONS}
        />
        <p
          style={{
            fontSize: 13,
            color: done ? "var(--green)" : "var(--muted)",
            textAlign: "center",
            marginTop: 12,
            fontWeight: done ? 700 : 400,
          }}
        >
          {done
            ? cabinet.completedMsg
            : left === 1
              ? cabinet.oneLeftMsg
              : cabinet.leftMsg(left)}
        </p>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <PavilionList visited={pavilions} />
      </div>

      <FooterLinks onRules={onRules} onPrivacy={onPrivacy} />
    </div>
  );
}

interface StaticScreenProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

export function StaticScreen({
  title,
  onBack,
  children,
}: StaticScreenProps): React.ReactElement {
  return (
    <div className="screen fade">
      <div className="bg-orb orb1" />
      <div className="hdr">
        <BackButton onClick={onBack} />
      </div>
      <div className="h2" style={{ marginTop: 8 }}>
        {title}
      </div>
      <div className="static" style={{ marginTop: 18, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

interface ErrorScreenProps {
  message?: string;
  onHome: () => void;
}

export function ErrorScreen({ message, onHome }: ErrorScreenProps): React.ReactElement {
  return (
    <div
      className="screen fade"
      style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}
    >
      <div style={{ fontSize: 56, marginBottom: 18 }}>⚠️</div>
      <div className="h2">Что-то пошло не так</div>
      <p className="sub">{message ?? TEXTS.errors.server}</p>
      <Button onClick={onHome} style={{ marginTop: 36 }}>
        На главную
      </Button>
    </div>
  );
}