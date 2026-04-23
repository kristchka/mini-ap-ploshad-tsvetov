import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  isLoading?: boolean;
  loadingText?: string;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface BadgeProps {
  variant: "success" | "pending" | "warning";
  children: React.ReactNode;
}

interface ProgressBarProps {
  current: number;
  total: number;
}

interface SpinnerProps {
  dark?: boolean;
}

interface LogoProps {
  small?: boolean;
  centered?: boolean;
  height?: number;
}

export function Logo({
  small = false,
  centered = false,
  height,
}: LogoProps): React.ReactElement {
  const logoHeight = height ?? (small ? 34 : 42);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: centered ? "center" : "flex-start",
        alignItems: "center",
        width: "100%",
      }}
    >
      <img
        src="/logo-main.png"
        alt="Площадь цветов"
        style={{
          display: "block",
          height: logoHeight,
          width: "auto",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

export function Spinner({ dark = false }: SpinnerProps): React.ReactElement {
  return <div className={`spin${dark ? " dark" : ""}`} />;
}

export function Button({
  variant = "primary",
  isLoading = false,
  loadingText,
  children,
  disabled,
  ...rest
}: ButtonProps): React.ReactElement {
  const cls = {
    primary: "btn btn-primary",
    outline: "btn btn-outline",
    ghost: "btn btn-ghost",
  }[variant];

  return (
    <button className={cls} disabled={disabled || isLoading} {...rest}>
      {isLoading ? (
        <>
          <Spinner />
          {loadingText ?? "Загружаем..."}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function TextInput({
  label,
  error,
  className,
  ...rest
}: InputProps): React.ReactElement {
  return (
    <div>
      {label && <label className="lbl">{label}</label>}
      <input
        className={`inp${error ? " err" : ""}${className ? ` ${className}` : ""}`}
        {...rest}
      />
      {error && <div className="err-txt">{error}</div>}
    </div>
  );
}

export function Badge({ variant, children }: BadgeProps): React.ReactElement {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ current, total }: ProgressBarProps): React.ReactElement {
  const pct = Math.round((current / total) * 100);
  return (
    <div>
      <div className="prog-meta">
        <span>Собрано павильонов</span>
        <span className="prog-num">
          {current} из {total}
        </span>
      </div>
      <div className="prog-bar">
        <div className="prog-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function BackButton({
  onClick,
}: {
  onClick: () => void;
}): React.ReactElement {
  return (
    <button className="back" onClick={onClick}>
      ← Назад
    </button>
  );
}

export function FooterLinks({
  onRules,
  onPrivacy,
}: {
  onRules: () => void;
  onPrivacy: () => void;
}): React.ReactElement {
  return (
    <div className="ftr">
      <button className="lnk" onClick={onRules}>
        Правила акции
      </button>
      <button className="lnk" onClick={onPrivacy}>
        Политика ПД
      </button>
    </div>
  );
}
