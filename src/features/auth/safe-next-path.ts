/** Aceita somente caminhos internos (evita open redirect). */
export function safeNextPath(next: string | undefined, fallback = "/dashboard"): string {
  if (!next) return fallback;
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
