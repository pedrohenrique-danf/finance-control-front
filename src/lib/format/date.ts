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
