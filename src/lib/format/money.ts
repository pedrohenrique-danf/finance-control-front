// Dinheiro no contrato: string decimal com ponto ("1234.50"). `number` só para exibir.

const PT_BR_MONEY = /^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/;

/** "1.234,50" → "1234.50". Retorna null se o formato for inválido ou ambíguo. */
export function parseMoneyInput(input: string): string | null {
  const value = input.trim();
  if (!PT_BR_MONEY.test(value)) return null;
  return value.replace(/\./g, "").replace(",", ".");
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const plain = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "1234.50" → "R$ 1.234,50" (apenas exibição; espaço comum após "R$"). */
export function formatMoney(value: string): string {
  return brl.format(Number(value)).replace(/ /g, " ");
}

/** "1234.50" → "1.234,50" (valor para preencher campos de edição). */
export function formatMoneyPlain(value: string): string {
  return plain.format(Number(value));
}

/** Receita "+ R$ 10,00", despesa "− R$ 10,00" (o sinal não depende só da cor). */
export function formatMoneySigned(value: string, type: "receita" | "despesa"): string {
  return `${type === "receita" ? "+" : "−"} ${formatMoney(String(Math.abs(Number(value))))}`;
}

/** Texto exibido quando o usuário oculta os valores. */
export const HIDDEN_MONEY = "R$ •••••";

/** Dígitos digitados num campo de valor → string decimal. "12345" → "123.45" */
export function digitsToDecimal(raw: string): string {
  const digits = raw
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^0+(?=\d)/, "");
  const cents = digits.padStart(3, "0");
  return `${cents.slice(0, -2)}.${cents.slice(-2)}`;
}
