import dayjs from "dayjs";
import "dayjs/locale/es";

// The one place dates are formatted for display: month and day names in the
// app's language, 24-hour time. Locales are set per call, never globally.
type DateInput = Date | string | number;
const inLanguage = (date: DateInput, language: number) =>
  dayjs(date).locale(language === 1 ? "es" : "en");

/** "5 Nov 2026" / "5 nov 2026". */
export const formatDate = (date: DateInput, language: number) =>
  inLanguage(date, language).format("D MMM YYYY").replace(/\./g, "");

/** "14:05". */
export const formatTime = (date: DateInput) => dayjs(date).format("HH:mm");

/** "Thu 5 Nov 2026 · 14:05" / "jue 5 nov 2026 · 14:05". */
export const formatDateTime = (date: DateInput, language: number) =>
  `${inLanguage(date, language)
    .format("ddd D MMM YYYY")
    .replace(/\./g, "")} · ${formatTime(date)}`;
