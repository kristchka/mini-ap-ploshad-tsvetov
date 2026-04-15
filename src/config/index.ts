import type { Pavilion, PavilionCode } from "../types";

export const APP_CONFIG = {
  TOTAL_PAVILIONS: 10,
  APP_NAME: "Площадь цветов",
  PRIZE_NAME: "ёлки",
  RAFFLE_DATE: "декабрь 2027",
  OTP_LENGTH: 4,
  RESEND_TIMEOUT_SEC: 60,
  BASE_URL: import.meta.env.VITE_API_URL ?? "",
} as const;

export const PAVILIONS: Pavilion[] = Array.from(
  { length: APP_CONFIG.TOTAL_PAVILIONS },
  (_, i) => ({
    code: `p${i + 1}` as PavilionCode,
    name: `Павильон ${i + 1}`,
  })
);

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  VERIFY: "/verify",
  PAVILION: (code: string) => `/p/${code}`,
  RESULT: "/result",
  CABINET: "/cabinet",
  RULES: "/rules",
  PRIVACY: "/privacy",
} as const;

export const TEXTS = {
  welcome: {
    title: "Собери все 10 павильонов",
    subtitle: "Сканируй QR-коды в разных павильонах и выиграй ёлку в декабре 2027",
    cta: "Участвовать",
    steps: [
      "Сканируй QR в каждом павильоне",
      "Зарегистрируйся по номеру телефона",
      "Собери все 10 — участвуй в розыгрыше!",
    ],
  },
  login: {
    caption: "Участие в акции",
    title: "Введите номер\nтелефона",
    subtitle: "Отправим SMS с кодом подтверждения",
    phonePlaceholder: "+7 (___) ___-__-__",
    submitBtn: "Получить код",
    loadingBtn: "Отправляем...",
    consentText: "Согласен(а) с",
    consentLink: "политикой обработки персональных данных",
  },
  verify: {
    caption: "Подтверждение",
    title: "Введите код\nиз SMS",
    submitBtn: "Подтвердить",
    loadingBtn: "Проверяем...",
    resendLabel: (sec: number) => `Повторная отправка через ${sec} сек`,
    resendBtn: "Отправить повторно",
  },
  result: {
    success: {
      icon: "✅",
      title: "Павильон засчитан!",
      subtitle: (code: string) => `${code.toUpperCase()} добавлен в вашу коллекцию`,
    },
    already_counted: {
      icon: "🔄",
      title: "Уже учтён",
      subtitle: "Этот павильон вы уже посещали ранее",
    },
    completed: {
      icon: "🎉",
      title: "Поздравляем!",
      subtitle: "Вы собрали все 10 павильонов!",
    },
    error: {
      icon: "⚠️",
      title: "Ошибка",
      subtitle: "Не удалось засчитать павильон",
    },
    invalid_qr: {
      icon: "⚠️",
      title: "QR не найден",
      subtitle: "Этот QR-код недействителен",
    },
  },
  cabinet: {
    caption: "Личный кабинет",
    badgeDone: "🎉 Участвую в розыгрыше",
    badgePending: "⏳ Идёт сбор",
    completedMsg: "🎄 Участие в розыгрыше ёлки подтверждено!",
    oneLeftMsg: "Всего 1 павильон до участия в розыгрыше!",
    leftMsg: (n: number) => `Осталось посетить ${n} павильонов`,
    allPavilionsTitle: "Все павильоны",
    counted: "Засчитан",
    logoutBtn: "Выйти",
  },
  errors: {
    network: "Ошибка сети. Проверьте подключение и попробуйте ещё раз.",
    server: "Сервер недоступен. Попробуйте позже.",
    invalidPhone: "Введите корректный номер телефона",
    invalidCode: "Неверный код. Попробуйте ещё раз.",
    sessionExpired: "Сессия истекла. Войдите снова.",
    qrInvalid: "QR-код недействителен или не найден.",
    checkInFailed: "Не удалось засчитать павильон. Попробуйте ещё раз.",
  },
} as const;