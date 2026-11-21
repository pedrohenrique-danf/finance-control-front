/** Primeiro valor de um parâmetro de `searchParams` (que pode vir repetido na URL). */
export function firstParam(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first ? first : undefined;
}
