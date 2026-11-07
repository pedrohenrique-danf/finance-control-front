const PT_BR_MONEY = /^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/;

/** "1.234,50" → "1234.50". Retorna null se o formato for inválido ou ambíguo. */
export function parseMoneyInput(input: string): string | null {
  const value = input.trim();
  if (!PT_BR_MONEY.test(value)) return null;
  return value.replace(/\./g, "").replace(",", ".");
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** "1234.50" → "R$ 1.234,50" (apenas exibição). */
export function formatMoney(value: string): string {
  return brl.format(Number(value));
}
