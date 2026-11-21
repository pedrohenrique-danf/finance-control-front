// Aritmética de dinheiro do backend simulado: soma em centavos inteiros, nunca em float.

export function toCents(decimal: string): number {
  return Math.round(Number(decimal) * 100);
}

export function fromCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
