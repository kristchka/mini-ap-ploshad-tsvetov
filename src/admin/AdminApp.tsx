import React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type DashboardRow = {
  total_participants: number;
  total_checkins: number;
  total_finalists: number;
  total_active_pavilions: number;
};

type ParticipantRow = {
  participant_id: string;
  phone: string;
  progress: number;
  completed: boolean;
  status_label: string;
  raffle_allowed: boolean;
  last_checkin_at: string | null;
  completed_at: string | null;
  visited_pavilions: string[] | null;
};

type FinalistRow = {
  id: string;
  phone: string;
  progress: number;
  last_checkin_at: string | null;
};

type PavilionStatRow = {
  id: string;
  code: string;
  name: string;
  qr_token: string;
  total_checkins: number;
};

type TabKey = "participants" | "finalists" | "pavilions";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU");
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string | number;
}): React.ReactElement {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e7e2d9",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 8px 24px rgba(0,0,0,.04)",
      }}
    >
      <div style={{ fontSize: 13, color: "#7d7468", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#2f6b3b" }}>{value}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: 999,
        padding: "10px 16px",
        cursor: "pointer",
        background: active ? "#2f6b3b" : "#ece7de",
        color: active ? "#fff" : "#40392f",
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e7e2d9",
        borderRadius: 22,
        padding: 20,
        boxShadow: "0 8px 24px rgba(0,0,0,.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: "#2a241d" }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}): React.ReactElement {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 900,
        }}
      >
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  fontSize: 13,
                  color: "#7d7468",
                  padding: "12px 10px",
                  borderBottom: "1px solid #ece7de",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                style={{
                  padding: 18,
                  color: "#7d7468",
                  fontSize: 14,
                }}
              >
                Пока пусто
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={idx}>
                {row.map((cell, i) => (
                  <td
                    key={i}
                    style={{
                      padding: "12px 10px",
                      borderBottom: "1px solid #f3efe8",
                      fontSize: 14,
                      color: "#2a241d",
                      verticalAlign: "top",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminApp(): React.ReactElement {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);

  // null = еще проверяем, true = админ, false = не админ
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);

  const [bootLoading, setBootLoading] = React.useState(true);
  const [pageLoading, setPageLoading] = React.useState(false);
  const [authLoading, setAuthLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [tab, setTab] = React.useState<TabKey>("participants");

  const [dashboard, setDashboard] = React.useState<DashboardRow | null>(null);
  const [participants, setParticipants] = React.useState<ParticipantRow[]>([]);
  const [finalists, setFinalists] = React.useState<FinalistRow[]>([]);
  const [pavilions, setPavilions] = React.useState<PavilionStatRow[]>([]);

  const loadAll = React.useCallback(async () => {
    setPageLoading(true);
    setError("");

    try {
      const [
        dashboardRes,
        participantsRes,
        finalistsRes,
        pavilionsRes,
      ] = await Promise.all([
        supabase.rpc("admin_get_dashboard"),
        supabase.rpc("admin_get_participants"),
        supabase.rpc("admin_get_finalists"),
        supabase.rpc("admin_get_pavilions_stats"),
      ]);

      if (dashboardRes.error) throw dashboardRes.error;
      if (participantsRes.error) throw participantsRes.error;
      if (finalistsRes.error) throw finalistsRes.error;
      if (pavilionsRes.error) throw pavilionsRes.error;

      const dashboardRow = Array.isArray(dashboardRes.data)
        ? (dashboardRes.data[0] as DashboardRow | undefined)
        : null;

      setDashboard(
        dashboardRow ?? {
          total_participants: 0,
          total_checkins: 0,
          total_finalists: 0,
          total_active_pavilions: 0,
        }
      );
      setParticipants((participantsRes.data ?? []) as ParticipantRow[]);
      setFinalists((finalistsRes.data ?? []) as FinalistRow[]);
      setPavilions((pavilionsRes.data ?? []) as PavilionStatRow[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить данные админки");
    } finally {
      setPageLoading(false);
    }
  }, []);

  const checkAdminAccess = React.useCallback(async () => {
    setIsAdmin(null);
    setError("");

    try {
      const { data, error: rpcError } = await supabase.rpc("is_admin");

      if (rpcError) throw rpcError;

      setIsAdmin(Boolean(data));
    } catch (e: unknown) {
      setIsAdmin(false);
      setError(e instanceof Error ? e.message : "Не удалось проверить права администратора");
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(data.session);
        setUser(data.session?.user ?? null);

        if (data.session?.user) {
          await checkAdminAccess();
        } else {
          setIsAdmin(false);
        }
      } finally {
        if (mounted) {
          setBootLoading(false);
        }
      }
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        checkAdminAccess();
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [checkAdminAccess]);

  React.useEffect(() => {
    if (user && isAdmin === true) {
      loadAll();
    }
  }, [user, isAdmin, loadAll]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setError("");
    setIsAdmin(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message ?? "Не удалось войти");
      setIsAdmin(false);
    }

    setAuthLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsAdmin(false);
    setParticipants([]);
    setFinalists([]);
    setPavilions([]);
    setDashboard(null);
    setError("");
  }

  if (bootLoading || (session && isAdmin === null)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f7f3ee",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#2a241d",
        }}
      >
        Загружаем админку...
      </div>
    );
  }

  if (!session || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #f7f3ee 0%, #f3eee7 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#fff",
            border: "1px solid #e7e2d9",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 20px 50px rgba(0,0,0,.08)",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: "#2f6b3b" }}>
            Площадь цветов
          </div>
          <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color: "#2a241d" }}>
            Вход в админку
          </div>
          <p style={{ color: "#7d7468", fontSize: 14, marginTop: 10 }}>
            Введите email и пароль администратора
          </p>

          <div style={{ marginTop: 18 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#7d7468" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@site.ru"
              style={{
                width: "100%",
                height: 48,
                borderRadius: 14,
                border: "1px solid #d9d3ca",
                padding: "0 14px",
                fontSize: 15,
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#7d7468" }}>
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              style={{
                width: "100%",
                height: 48,
                borderRadius: 14,
                border: "1px solid #d9d3ca",
                padding: "0 14px",
                fontSize: 15,
                outline: "none",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                marginTop: 14,
                background: "rgba(217,79,79,.08)",
                color: "#b13f3f",
                borderRadius: 14,
                padding: 12,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            style={{
              marginTop: 18,
              width: "100%",
              height: 50,
              borderRadius: 16,
              border: "none",
              background: "#2f6b3b",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            {authLoading ? "Входим..." : "Войти в админку"}
          </button>
        </form>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f7f3ee",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            background: "#fff",
            border: "1px solid #e7e2d9",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 20px 50px rgba(0,0,0,.08)",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: "#2a241d" }}>
            Доступ запрещен
          </div>
          <p style={{ fontSize: 14, color: "#7d7468", marginTop: 10 }}>
            Этот пользователь не добавлен в таблицу admin_users.
          </p>
          {error && (
            <div
              style={{
                marginTop: 12,
                background: "rgba(217,79,79,.08)",
                color: "#b13f3f",
                borderRadius: 14,
                padding: 12,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              marginTop: 18,
              height: 46,
              padding: "0 16px",
              borderRadius: 14,
              border: "none",
              background: "#2f6b3b",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Выйти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f3ee",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#2a241d",
      }}
    >
      <div
        style={{
          maxWidth: 1380,
          margin: "0 auto",
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: "#7d7468" }}>Площадь цветов</div>
            <div style={{ fontSize: 34, fontWeight: 800 }}>Мини-админка акции</div>
            <div style={{ fontSize: 14, color: "#7d7468", marginTop: 4 }}>
              {user.email}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={loadAll}
              style={{
                height: 44,
                padding: "0 16px",
                borderRadius: 14,
                border: "1px solid #d9d3ca",
                background: "#fff",
                color: "#2a241d",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {pageLoading ? "Обновляем..." : "Обновить"}
            </button>

            <button
              onClick={handleLogout}
              style={{
                height: 44,
                padding: "0 16px",
                borderRadius: 14,
                border: "none",
                background: "#2f6b3b",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Выйти
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              background: "rgba(217,79,79,.08)",
              color: "#b13f3f",
              borderRadius: 16,
              padding: 14,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <Card title="Всего участников" value={dashboard?.total_participants ?? 0} />
          <Card title="Всего check-in" value={dashboard?.total_checkins ?? 0} />
          <Card title="Финалистов" value={dashboard?.total_finalists ?? 0} />
          <Card title="Активных павильонов" value={dashboard?.total_active_pavilions ?? 0} />
        </div>

        <Section
          title="Данные акции"
          right={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <TabButton active={tab === "participants"} onClick={() => setTab("participants")}>
                Участники
              </TabButton>
              <TabButton active={tab === "finalists"} onClick={() => setTab("finalists")}>
                Финалисты
              </TabButton>
              <TabButton active={tab === "pavilions"} onClick={() => setTab("pavilions")}>
                Павильоны
              </TabButton>
            </div>
          }
        >
          {tab === "participants" && (
            <DataTable
              headers={[
                "Телефон",
                "Прогресс",
                "Статус",
                "Допуск",
                "Последний check-in",
                "Дата завершения",
                "Посещенные павильоны",
              ]}
              rows={participants.map((item) => [
                item.phone,
                item.progress,
                item.status_label,
                item.raffle_allowed ? "Да" : "Нет",
                formatDate(item.last_checkin_at),
                formatDate(item.completed_at),
                item.visited_pavilions?.length
                  ? item.visited_pavilions.join(", ")
                  : "—",
              ])}
            />
          )}

          {tab === "finalists" && (
            <DataTable
              headers={["Телефон", "Прогресс", "Последний check-in"]}
              rows={finalists.map((item) => [
                item.phone,
                item.progress,
                formatDate(item.last_checkin_at),
              ])}
            />
          )}

          {tab === "pavilions" && (
            <DataTable
              headers={["Код", "Название", "QR token", "Количество check-in"]}
              rows={pavilions.map((item) => [
                item.code,
                item.name,
                item.qr_token,
                item.total_checkins,
              ])}
            />
          )}
        </Section>
      </div>
    </div>
  );
}
