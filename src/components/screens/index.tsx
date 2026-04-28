import React from "react";
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
import { QrScannerModal } from "../ui/QrScannerModal";

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
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);

  return (
    <div className="screen fade hero-screen">
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />

      <div className="hero-content">
        <div className="hero-brand-row">
          <div className="hero-logo">
            <Logo />
          </div>

          <div className="hero-flowers" aria-hidden="true">
            <span>🌺</span>
            <span>🌸</span>
            <span>🌼</span>
          </div>
        </div>

        <div className="display">
          {welcome.title.split(" ").slice(0, 2).join(" ")}
          <br />
          {welcome.title.split(" ").slice(2).join(" ")}
        </div>

        <p className="hero-sub">
          Сканируй QR-коды в разных павильонах и участвуй в розыгрыше{" "}
          <span>{APP_CONFIG.PRIZE_NAME}</span>
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

      <div className="hero-actions">
        <Button onClick={onStart}>{welcome.cta}</Button>
        <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
          Сканировать QR
        </Button>
        <FooterLinks onRules={onRules} onPrivacy={onPrivacy} />
      </div>

      <QrScannerModal
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}

interface LoginScreenProps {
  onSubmit: (phone: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
  debugOtpCode?: string;
}

export function LoginScreen({
  onSubmit,
  onBack,
  isLoading,
  error,
  debugOtpCode,
}: LoginScreenProps): React.ReactElement {
  const { phone, handleChange, rawDigits, isValid } = usePhoneFormatter();
  const [agreed, setAgreed] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");
  const displayError = error || submitError;

  const handleSubmit = () => {
    setSubmitError("");

    if (!isValid) {
      setSubmitError(TEXTS.errors.invalidPhone);
      return;
    }

    if (!agreed) {
      setSubmitError("Подтвердите согласие на обработку персональных данных");
      return;
    }

    onSubmit(rawDigits);
  };

  return (
    <div className="screen fade auth-screen">
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
            className={`inp${displayError ? " err" : ""}`}
            type="tel"
            inputMode="tel"
            placeholder={TEXTS.login.phonePlaceholder}
            value={phone}
            onChange={(e) => handleChange(e.target.value)}
            autoFocus
          />
          {displayError && <div className="err-txt">{displayError}</div>}
          {debugOtpCode && (
            <div className="err-txt" style={{ color: "var(--muted)" }}>
              Тестовый код: {debugOtpCode}
            </div>
          )}

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
        disabled={isLoading}
        onClick={handleSubmit}
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
  debugOtpCode?: string;
}

export function VerifyScreen({
  phone,
  onVerify,
  onResend,
  onBack,
  isLoading,
  error,
  debugOtpCode,
}: VerifyScreenProps): React.ReactElement {
  const { digits, setDigit, code, isComplete } = useOTP(APP_CONFIG.OTP_LENGTH);
  const { seconds, isExpired, reset } = useTimer(APP_CONFIG.RESEND_TIMEOUT_SEC);
  const refsArray = React.useRef<(HTMLInputElement | null)[]>([]).current;

  const masked =
    phone.length >= 11
      ? `+7 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-**-**`
      : phone;

  const handleChange = (i: number, value: string) => {
    setDigit(i, value);

    if (value && i < APP_CONFIG.OTP_LENGTH - 1) {
      refsArray[i + 1]?.focus();
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
      refsArray[i - 1]?.focus();
    }
  };

  return (
    <div className="screen fade auth-screen">
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
        <p className="sub">Отправили код на {masked}</p>
        {debugOtpCode && (
          <p className="sub" style={{ marginTop: 8 }}>
            Тестовый код: {debugOtpCode}
          </p>
        )}

        <div className="otp-row">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refsArray[i] = el;
              }}
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
    <div className="screen fade result-screen">
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />
      <div className="hdr">
        <Logo />
      </div>

      <div className="result-body">
        <div className={`res-ico ${icoClass}`}>{cfg.icon}</div>

        <div className="h2" style={{ textAlign: "center" }}>
          {cfg.title}
        </div>

        <p className="sub" style={{ textAlign: "center" }}>
          {subtitle}
        </p>

        {status === "completed" ? (
          <div className="card result-completed-card" style={{ marginTop: 28, textAlign: "center" }}>
            <div style={{ fontSize: 48 }}>🎉</div>

            <div
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: 22,
                fontWeight: 600,
                color: "var(--green)",
                marginTop: 10,
              }}
            >
              Поздравляем!
            </div>

            <p
              style={{
                fontSize: 15,
                color: "var(--text)",
                marginTop: 12,
                lineHeight: 1.55,
              }}
            >
              Вы успешно собрали все 10 павильонов и теперь участвуете в розыгрыше{" "}
              <strong>{APP_CONFIG.PRIZE_NAME}</strong> 🎉
            </p>

            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: 14,
                background: "rgba(47,107,59,.08)",
                color: "var(--green)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Результаты розыгрыша будут объявлены 25 декабря.
            </div>

            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
              Спасибо за участие и удачи!
            </p>
          </div>
        ) : (
          <div className="card result-progress-card" style={{ marginTop: 26 }}>
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
  const [scannerOpen, setScannerOpen] = React.useState(false);

  const n = pavilions.length;
  const left = APP_CONFIG.TOTAL_PAVILIONS - n;
  const done = n >= APP_CONFIG.TOTAL_PAVILIONS;
  const { cabinet } = TEXTS;

  const masked =
    phone.length >= 11
      ? `+7 (${phone.slice(1, 4)}) ***-**-${phone.slice(-2)}`
      : phone;

  return (
    <div className="screen fade cabinet-screen">
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

      <div className="cabinet-meta" style={{ paddingTop: 6 }}>
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

      <div className="card cabinet-progress-card" style={{ marginTop: 18 }}>
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

      <div className="card cabinet-list-card" style={{ marginTop: 12 }}>
        <PavilionList visited={pavilions} />
      </div>

      <Button onClick={() => setScannerOpen(true)} style={{ marginTop: 14 }}>
        Сканировать QR
      </Button>

      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
      />

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
