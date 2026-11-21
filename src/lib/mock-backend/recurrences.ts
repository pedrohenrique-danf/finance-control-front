import "server-only";
import { ApiError } from "@/lib/api/errors";
import { currentMonth, shiftMonth } from "@/lib/format/date";
import { notFound, userData } from "./store";
import type { RecurrenceRecord, TransactionStatus, UserData } from "./types";

// Simula: GET/POST /api/v1/recurrences, GET/PUT/DELETE /api/v1/recurrences/:id (backend docs/02 e 07, RF04).

export type RecurrenceCreateInput = Omit<RecurrenceRecord, "id" | "active">;
export type RecurrenceUpdateInput = Omit<RecurrenceRecord, "id" | "type">;

export interface ScheduleEntry {
  month: string;
  dueDate: string;
  status: TransactionStatus | "prevista";
  transactionId: string | null;
}
export type RecurrenceWithSchedule = RecurrenceRecord & { schedule: ScheduleEntry[] };

const SCHEDULE_MONTHS = 6;

function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(y, m, 0).getDate();
}

/** Vencimento da recorrência no mês (dia 29–31 vira o último dia em meses curtos). */
export function dueDateIn(rec: Pick<RecurrenceRecord, "dueDay">, month: string): string {
  return `${month}-${String(Math.min(rec.dueDay, daysInMonth(month))).padStart(2, "0")}`;
}

/** A data está dentro do período da recorrência? */
export function covers(rec: Pick<RecurrenceRecord, "startDate" | "endDate">, date: string): boolean {
  return rec.startDate <= date && (rec.endDate === null || date <= rec.endDate);
}

function validate(data: UserData, input: Omit<RecurrenceRecord, "id" | "active">): void {
  const issues: Array<{ path: string; message: string }> = [];
  if (input.endDate && input.endDate < input.startDate) {
    issues.push({ path: "endDate", message: "A data de fim deve ser depois do início." });
  }
  if (input.categoryId) {
    const category = data.categories.find((c) => c.id === input.categoryId);
    if (!category) issues.push({ path: "categoryId", message: "Categoria não encontrada." });
    else if (category.type !== input.type) {
      issues.push({ path: "categoryId", message: "Tipo da categoria incompatível." });
    }
  }
  if (input.valueSourceId && !data.valueSources.some((s) => s.id === input.valueSourceId)) {
    issues.push({ path: "valueSourceId", message: "Conta não encontrada." });
  }
  if (issues.length) throw new ApiError(400, "VALIDATION_ERROR", "Dados inválidos.", issues);
}

/**
 * Lança as ocorrências de `startDate` até o fim do mês corrente como pendentes (doc 06, `materialize`).
 * Idempotente: pula datas que já têm transação da recorrência (índice único recorrencia_id + data).
 */
export function materialize(data: UserData, rec: RecurrenceRecord, now = new Date()): number {
  if (!rec.active) return 0;
  const last = currentMonth(now);
  let created = 0;
  for (let month = rec.startDate.slice(0, 7); month <= last; month = shiftMonth(month, 1)) {
    const date = dueDateIn(rec, month);
    if (!covers(rec, date)) continue;
    if (data.transactions.some((t) => t.recurrenceId === rec.id && t.date === date)) continue;
    data.transactions.push({
      id: crypto.randomUUID(),
      type: rec.type,
      nature: rec.type === "despesa" ? "fixa" : null,
      description: rec.description,
      amount: rec.amount,
      date,
      status: "pendente",
      origin: "recorrencia",
      categoryId: rec.categoryId,
      valueSourceId: rec.valueSourceId,
      recurrenceId: rec.id,
    });
    created++;
  }
  return created;
}

function schedule(data: UserData, rec: RecurrenceRecord, now: Date): ScheduleEntry[] {
  const from = currentMonth(now);
  const entries: ScheduleEntry[] = [];
  for (let i = 0; i < SCHEDULE_MONTHS; i++) {
    const month = shiftMonth(from, i);
    const dueDate = dueDateIn(rec, month);
    if (!covers(rec, dueDate)) continue;
    const posted = data.transactions.find((t) => t.recurrenceId === rec.id && t.date.startsWith(month));
    entries.push({
      month,
      dueDate,
      status: posted ? posted.status : "prevista",
      transactionId: posted?.id ?? null,
    });
  }
  return entries;
}

/** Cria a recorrência (sem materializar). Usado pelo POST de recorrências e pelo "repetir todo mês". */
export function insertRecurrence(data: UserData, input: RecurrenceCreateInput): RecurrenceRecord {
  validate(data, input);
  const created: RecurrenceRecord = { id: crypto.randomUUID(), ...input, active: true };
  data.recurrences.push(created);
  return created;
}

export const mockRecurrences = {
  /** Ativas primeiro, depois por dia de vencimento. */
  list(userId: string): RecurrenceRecord[] {
    return [...userData(userId).recurrences].sort(
      (a, b) =>
        Number(b.active) - Number(a.active) || a.dueDay - b.dueDay || a.description.localeCompare(b.description),
    );
  },

  get(userId: string, id: string, now = new Date()): RecurrenceWithSchedule {
    const data = userData(userId);
    const rec = data.recurrences.find((r) => r.id === id);
    if (!rec) throw notFound("Recorrência");
    return { ...rec, schedule: schedule(data, rec, now) };
  },

  create(userId: string, input: RecurrenceCreateInput, now = new Date()): RecurrenceRecord {
    const data = userData(userId);
    const created = insertRecurrence(data, input);
    materialize(data, created, now);
    return created;
  },

  /** PUT: vale para as ocorrências ainda não lançadas; reativar lança o que faltar até o mês corrente. */
  update(userId: string, id: string, input: RecurrenceUpdateInput, now = new Date()): RecurrenceRecord {
    const data = userData(userId);
    const current = data.recurrences.find((r) => r.id === id);
    if (!current) throw notFound("Recorrência");
    validate(data, { ...input, type: current.type });
    Object.assign(current, input);
    materialize(data, current, now);
    return current;
  },

  /** Encerra: os lançamentos ficam no extrato com recurrenceId = null (RNF02). */
  remove(userId: string, id: string): void {
    const data = userData(userId);
    if (!data.recurrences.some((r) => r.id === id)) throw notFound("Recorrência");
    data.recurrences = data.recurrences.filter((r) => r.id !== id);
    for (const t of data.transactions) if (t.recurrenceId === id) t.recurrenceId = null;
  },
};
