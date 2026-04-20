import React, { useEffect } from "react";
import { useApp } from "./hooks";
import { PAVILIONS, APP_CONFIG } from "./config";
import type { PavilionCode } from "./types";
import { supabase } from "./lib/supabase";
import { submitCheckInByToken } from "./lib/checkin";
import {
  LoadingScreen,
  WelcomeScreen,
  LoginScreen,
  VerifyScreen,
  ResultScreen,
  CabinetScreen,
  StaticScreen,
  ErrorScreen,
} from "./components/screens";
import "./styles/globals.css";

function RulesContent(): React.ReactElement {
  return (
    <>
      <h3>1. Общие положения</h3>
      <p>
        Акция «Собери все павильоны» проводится на территории цветочного
        кластера «Площадь цветов» с момента запуска и по декабрь 2027 года
        включительно.
      </p>

      <h3>2. Условия участия</h3>
      <p>
        Для участия необходимо зарегистрироваться по номеру мобильного
        телефона и посетить все 10 павильонов, сканируя QR-коды в каждом.
      </p>

      <h3>3. Засчёт павильонов</h3>
      <p>
        Каждый павильон засчитывается только один раз. Повторное сканирование
        одного QR-кода не увеличивает прогресс.
      </p>

      <h3>4. Розыгрыш</h3>
      <p>
        Среди всех участников, собравших {APP_CONFIG.TOTAL_PAVILIONS} из{" "}
        {APP_CONFIG.TOTAL_PAVILIONS} павильонов, будет разыграна{" "}
        {APP_CONFIG.PRIZE_NAME}. Розыгрыш состоится в {APP_CONFIG.RAFFLE_DATE}.
      </p>

      <h3>5. Контакты</h3>
      <p>
        По вопросам обращайтесь на стойку информации или к администрации
        кластера.
      </p>
    </>
  );
}

function PrivacyContent(): React.ReactElement {
  return (
    <>
      <h3>1. Сбор данных</h3>
      <p>
        Мы собираем только номер телефона, необходимый для идентификации
        участника акции.
      </p>

      <h3>2. Использование данных</h3>
      <p>
        Данные используются исключительно для проведения акции и связи с
        победителем розыгрыша.
      </p>

      <h3>3. Хранение данных</h3>
      <p>
        Персональные данные хранятся в защищённой базе данных и не передаются
        третьим лицам.
      </p>

      <h3>4. Права участника</h3>
      <p>
        Вы вправе в любой момент запросить удаление своих данных, обратившись
        к администрации кластера.
      </p>
    </>
  );
}

interface DemoBarProps {
  qrCode: PavilionCode;
  onChange: (code: PavilionCode) => void;
}

function DemoBar({ qrCode, onChange }: DemoBarProps): React.ReactElement | null {
  if (import.meta.env.PROD) return null;

  return (
    <div className="demo-bar">
      <div className="demo-box">
        <div className="demo-title">📱 Демо — выберите QR-код павильона</div>
        <select
          className="demo-sel"
          value={qrCode}
          onChange={(e) => onChange(e.target.value as PavilionCode)}
        >
          {PAVILIONS.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name} · {p.code}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function App(): React.ReactElement {
  const {
    page,
    prevPage,
    phone,
    qrCode,
    pavilions,
    resultStatus,
    errorMessage,
    loginError,
    verifyError,
    isLoading,
    navigate,
    setQrTokenFromScan,
    handleStart,
    handleSendCode,
    handleVerify,
    handleLogout,
    handleResend,
  } = useApp();

  useEffect(() => {
    const loadPavilions = async () => {
      const { data, error } = await supabase
        .from("pavilions")
        .select("id, code, name")
        .order("code");

      console.log("PAVILIONS:", data);
      console.log("SUPABASE_ERROR:", error);
    };

    void loadPavilions();
  }, []);

  const handleDebugCheckIn = async () => {
    try {
      const result = await submitCheckInByToken("79990000001", qrCode);

      console.log("CHECK_IN_RESULT:", result);

      alert(
        `Статус: ${result.status}\nСообщение: ${result.message}\nПрогресс: ${result.progress ?? 0}`
      );
    } catch (error) {
      console.error("CHECK_IN_ERROR:", error);
      alert("Ошибка при check-in. Открой Console.");
    }
  };

  const showDemo = page === "welcome" || page === "cabinet";

  return (
    <div className="app">
      {page === "loading" && <LoadingScreen />}

      {page === "welcome" && (
        <WelcomeScreen
          onStart={handleStart}
          onRules={() => navigate("rules")}
          onPrivacy={() => navigate("privacy")}
        />
      )}

      {page === "login" && (
        <LoginScreen
          onSubmit={handleSendCode}
          onBack={() => navigate("welcome")}
          isLoading={isLoading}
          error={loginError}
        />
      )}

      {page === "verify" && (
        <VerifyScreen
          phone={phone}
          onVerify={handleVerify}
          onResend={handleResend}
          onBack={() => navigate("login")}
          isLoading={isLoading}
          error={verifyError}
        />
      )}

      {page === "result" && resultStatus && (
        <ResultScreen
          status={resultStatus}
          code={qrCode}
          pavilions={pavilions}
          onCabinet={() => navigate("cabinet")}
        />
      )}

      {page === "cabinet" && (
        <CabinetScreen
          phone={phone}
          pavilions={pavilions}
          onLogout={handleLogout}
          onRules={() => navigate("rules")}
          onPrivacy={() => navigate("privacy")}
        />
      )}

      {page === "rules" && (
        <StaticScreen title="Правила акции" onBack={() => navigate(prevPage)}>
          <RulesContent />
        </StaticScreen>
      )}

      {page === "privacy" && (
        <StaticScreen title="Политика ПД" onBack={() => navigate(prevPage)}>
          <PrivacyContent />
        </StaticScreen>
      )}

      {page === "error" && (
        <ErrorScreen message={errorMessage} onHome={() => navigate("welcome")} />
      )}

      {showDemo && <DemoBar qrCode={qrCode} onChange={setQrTokenFromScan} />}

      {!import.meta.env.PROD && false && (
        <button
          type="button"
          onClick={handleDebugCheckIn}
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 9999,
            padding: "12px 16px",
            borderRadius: 12,
            border: "none",
            background: "#2f6b3b",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          }}
        >
          Тестовый check-in
        </button>
      )}
    </div>
  );
}
