// Datas do contrato: "YYYY-MM-DD"; mês: "YYYY-MM". Nunca `new Date("YYYY-MM-DD")` (interpreta como UTC).

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;
const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const;
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** "2026-11-05" → "05/11/2026", sem passar por Date (evita deslocamento de fuso). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Mês corrente no formato "YYYY-MM" (data local). */
export function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Dia corrente no formato "YYYY-MM-DD" (data local). */
export function todayIso(now = new Date()): string {
  return `${currentMonth(now)}-${String(now.getDate()).padStart(2, "0")}`;
}

/** "YYYY-MM" válido? */
export function isMonth(value: unknown): value is string {
  return typeof value === "string" && MONTH_RE.test(value);
}

/** Lê `?month=` da URL; valor ausente ou inválido vira o mês corrente. */
export function parseMonthParam(raw: string | string[] | undefined, now = new Date()): string {
  return isMonth(raw) ? raw : currentMonth(now);
}

/** "YYYY-MM-DD" → Date local (meia-noite). */
export function parseIsoDate(iso: string): Date {
  const [y = 0, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Date local → "YYYY-MM-DD". */
export function toIsoDate(date: Date): string {
  return todayIso(date);
}

/** "2026-11" → "Novembro 2026" */
export function formatMonthLabel(month: string): string {
  const [y, m = 1] = month.split("-").map(Number);
  return `${MONTHS[m - 1] ?? ""} ${y}`;
}

/** "2026-11" → "nov" */
export function formatMonthShort(month: string): string {
  const m = Number(month.split("-")[1]);
  return MONTHS_SHORT[m - 1] ?? "";
}

/** Desloca um mês "YYYY-MM" em `delta` meses. */
export function shiftMonth(month: string, delta: number): string {
  const [y = 0, m = 1] = month.split("-").map(Number);
  return currentMonth(new Date(y, m - 1 + delta, 1));
}

/** "2026-11-18" → "Qua, 18 nov" */
export function formatDayHeader(iso: string): string {
  const d = parseIsoDate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** Dias inteiros entre duas datas ISO (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseIsoDate(b).getTime() - parseIsoDate(a).getTime()) / 86_400_000);
}

/** 0 → "hoje", 1 → "amanhã", 3 → "em 3 dias", −2 → "há 2 dias" */
export function relativeDays(days: number): string {
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  if (days === -1) return "ontem";
  if (days > 1) return `em ${days} dias`;
  return `há ${Math.abs(days)} dias`;
}
