import "server-only";
import { fromCents, toCents } from "./money";
import { notify } from "./notifications";
import { conflict, notFound, userData } from "./store";
import type { TransactionRecord, ValueSourceRecord } from "./types";

// Simula: GET/POST /api/v1/value-sources, GET/PUT /api/v1/value-sources/:id (backend docs/02 e 07).

type Input = Omit<ValueSourceRecord, "id">;
export type ValueSourceWithBalance = ValueSourceRecord & { currentBalance: string };

/** Saldo atual = saldo inicial + receitas − despesas efetivadas da conta. */
function withBalance(source: ValueSourceRecord, transactions: TransactionRecord[]): ValueSourceWithBalance {
  let cents = toCents(source.initialBalance);
  for (const t of transactions) {
    if (t.valueSourceId !== source.id || t.status !== "efetivada") continue;
    cents += t.type === "receita" ? toCents(t.amount) : -toCents(t.amount);
  }
  return { ...source, currentBalance: fromCents(cents) };
}

function assertUniqueName(list: ValueSourceRecord[], name: string, ignoreId?: string) {
  // uq_fontes_valor_usuario_nome
  if (list.some((s) => s.id !== ignoreId && s.name === name)) {
    throw conflict("name", "Já existe uma conta com este nome.");
  }
}

export const mockValueSources = {
  list(userId: string): ValueSourceWithBalance[] {
    const data = userData(userId);
    return data.valueSources.map((s) => withBalance(s, data.transactions));
  },

  get(userId: string, id: string): ValueSourceWithBalance {
    const data = userData(userId);
    const source = data.valueSources.find((s) => s.id === id);
    if (!source) throw notFound("Conta");
    return withBalance(source, data.transactions);
  },

  create(userId: string, input: Input): ValueSourceWithBalance {
    const data = userData(userId);
    assertUniqueName(data.valueSources, input.name);
    const created = { id: crypto.randomUUID(), ...input };
    data.valueSources.push(created);
    notify(data, { type: "sistema", title: "Conta criada", message: created.name });
    return withBalance(created, data.transactions);
  },

  update(userId: string, id: string, input: Input): ValueSourceWithBalance {
    const data = userData(userId);
    const current = data.valueSources.find((s) => s.id === id);
    if (!current) throw notFound("Conta");
    assertUniqueName(data.valueSources, input.name, id);
    Object.assign(current, input);
    return withBalance(current, data.transactions);
  },
};
