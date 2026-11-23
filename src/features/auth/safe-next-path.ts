/**
 * Aceita somente caminhos internos (evita open redirect). Recusa `//site.com` e `/\site.com` (alguns navegadores
 * tratam `\` como `/`), além de barras invertidas e caracteres de controle em qualquer posição.
 */
export function safeNextPath(next: string | undefined, fallback = "/dashboard"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  // biome-ignore lint/suspicious/noControlCharactersInRegex: recusar caracteres de controle é o objetivo
  if (/[\\\u0000-\u001f\u007f]/.test(next)) return fallback;
  return next;
}
