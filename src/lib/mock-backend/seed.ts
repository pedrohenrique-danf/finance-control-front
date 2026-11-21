import { currentMonth, shiftMonth } from "@/lib/format/date";
import type {
  CategoryRecord,
  RecurrenceRecord,
  TransactionRecord,
  TransactionType,
  UserData,
  ValueSourceRecord,
} from "./types";

// Dados de demonstração (mesmos do protótipo), relativos ao mês atual para as telas nunca ficarem vazias.
// TODO(back): remover junto com o backend simulado.

const CATEGORIES: Array<[key: string, name: string, type: TransactionType, color: string, icon: string]> = [
  ["alimentacao", "Alimentação", "despesa", "#A0B179", "utensils"],
  ["moradia", "Moradia", "despesa", "#636851", "home"],
  ["transporte", "Transporte", "despesa", "#A3A277", "bus"],
  ["lazer", "Lazer", "despesa", "#C9A13B", "gamepad"],
  ["saude", "Saúde", "despesa", "#B5654A", "heart"],
  ["educacao", "Educação", "despesa", "#7C8C9A", "graduation"],
  ["assinaturas", "Assinaturas", "despesa", "#99A285", "tv"],
  ["salario", "Salário", "receita", "#5E7A3A", "briefcase"],
  ["freelance", "Freelance", "receita", "#8AA05A", "laptop"],
  ["outros", "Outros", "receita", "#CACDA5", "sparkles"],
];

const VALUE_SOURCES: Array<[key: string, Omit<ValueSourceRecord, "id">]> = [
  [
    "nubank",
    { name: "Nubank", type: "conta_corrente", institution: "Nubank", initialBalance: "2350.00", active: true },
  ],
  ["carteira", { name: "Carteira", type: "carteira", institution: "Dinheiro", initialBalance: "180.00", active: true }],
  [
    "cartao",
    { name: "Cartão Inter", type: "cartao_credito", institution: "Banco Inter", initialBalance: "0.00", active: true },
  ],
];

const RECURRENCES: Array<
  [key: string, description: string, amount: string, category: string, source: string, dueDay: number, end?: number]
> = [
  ["aluguel", "Aluguel", "1200.00", "moradia", "nubank", 5],
  ["internet", "Internet fibra", "99.90", "moradia", "nubank", 10],
  ["academia", "Academia", "89.90", "saude", "cartao", 15],
  ["streaming", "Streaming", "55.90", "assinaturas", "cartao", 22],
  ["faculdade", "Faculdade", "650.00", "educacao", "nubank", 25, 1],
];

type Row = [day: number, description: string, amount: string, category: string, source: string, pending?: true];

const CURRENT_EXPENSES: Row[] = [
  [1, "Padaria do bairro", "18.50", "alimentacao", "carteira"],
  [1, "Uber para casa", "23.90", "transporte", "nubank"],
  [2, "Mercado Pão de Açúcar", "214.37", "alimentacao", "cartao"],
  [3, "Recarga bilhete único", "50.00", "transporte", "nubank"],
  [3, "Café com a turma", "16.00", "alimentacao", "carteira"],
  [4, "Farmácia São Paulo", "42.80", "saude", "nubank"],
  [6, "iFood – japonês", "68.90", "alimentacao", "cartao"],
  [7, "Cinema", "44.00", "lazer", "cartao"],
  [7, "Pipoca e refri", "32.00", "lazer", "carteira"],
  [8, "Feira livre", "37.50", "alimentacao", "carteira"],
  [9, "Livro de cálculo", "89.90", "educacao", "cartao"],
  [10, "Uber para o estágio", "19.40", "transporte", "nubank"],
  [11, "Almoço restaurante", "34.90", "alimentacao", "nubank"],
  [12, "Spotify Família", "34.90", "assinaturas", "cartao"],
  [13, "Mercado Dia", "96.12", "alimentacao", "nubank"],
  [14, "Show no Audio", "120.00", "lazer", "cartao"],
  [14, "Lanche pós-show", "27.50", "alimentacao", "carteira"],
  [16, "Consulta dentista", "150.00", "saude", "nubank"],
  [17, "Recarga bilhete único", "50.00", "transporte", "nubank"],
  [17, "iFood – pizza", "59.90", "alimentacao", "cartao"],
  [18, "Curso online de Excel", "39.90", "educacao", "cartao"],
  [18, "Padaria do bairro", "14.20", "alimentacao", "carteira"],
  [19, "Barbearia", "45.00", "lazer", "carteira"],
  [19, "Mercado Pão de Açúcar", "162.48", "alimentacao", "cartao"],
  [20, "Uber para a faculdade", "21.70", "transporte", "nubank"],
  [20, "Almoço bandejão", "12.00", "alimentacao", "carteira"],
  [21, "Presente aniversário Ana", "85.00", "lazer", "cartao", true],
  [27, "Revisão da bike", "70.00", "transporte", "nubank", true],
  [28, "Happy hour do estágio", "60.00", "lazer", "cartao", true],
];

const CURRENT_INCOME: Row[] = [
  [5, "Salário estágio", "4200.00", "salario", "nubank"],
  [8, "Venda de livros usados", "120.00", "outros", "carteira"],
  [12, "Freelance – site da padaria", "850.00", "freelance", "nubank"],
  [19, "Freelance – identidade visual", "400.00", "freelance", "nubank"],
  [30, "Freelance – manutenção mensal", "300.00", "freelance", "nubank", true],
];

// Meses anteriores: tudo na conta corrente (a demonstração não modela pagamento de fatura nem saque).
const HISTORY_EXPENSES: Array<[description: string, amount: number, category: string, source: string]> = [
  ["Mercado", 280, "alimentacao", "nubank"],
  ["iFood", 75, "alimentacao", "nubank"],
  ["Uber", 64, "transporte", "nubank"],
  ["Bilhete único", 100, "transporte", "nubank"],
  ["Cinema e lanche", 70, "lazer", "nubank"],
  ["Farmácia", 38, "saude", "nubank"],
  ["Padaria", 46, "alimentacao", "nubank"],
  ["Saída com amigos", 95, "lazer", "nubank"],
];

/** Fator de gasto e receita extra dos 6 meses anteriores (do mais antigo ao mais recente). */
const HISTORY: Array<{ factor: number; extraIncome: number }> = [
  { factor: 1.05, extraIncome: 0 },
  { factor: 0.92, extraIncome: 300 },
  { factor: 1.3, extraIncome: 0 },
  { factor: 0.98, extraIncome: 650 },
  { factor: 1.12, extraIncome: 200 },
  { factor: 1.0, extraIncome: 500 },
];

function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(y, m, 0).getDate();
}

function dateIn(month: string, day: number): string {
  return `${month}-${String(Math.min(day, daysInMonth(month))).padStart(2, "0")}`;
}

export function buildDemoData(now = new Date()): UserData {
  const month = currentMonth(now);
  const today = now.getDate();
  const id = () => crypto.randomUUID();

  const categoryIds = new Map<string, string>();
  const categories: CategoryRecord[] = CATEGORIES.map(([key, name, type, color, icon]) => {
    const record = { id: id(), name, type, color, icon };
    categoryIds.set(key, record.id);
    return record;
  });

  const sourceIds = new Map<string, string>();
  const valueSources: ValueSourceRecord[] = VALUE_SOURCES.map(([key, data]) => {
    const record = { id: id(), ...data };
    sourceIds.set(key, record.id);
    return record;
  });

  const cat = (key: string) => categoryIds.get(key) ?? null;
  const src = (key: string) => sourceIds.get(key) ?? null;
  const transactions: TransactionRecord[] = [];
  const push = (t: Omit<TransactionRecord, "id" | "origin" | "recurrenceId"> & Partial<TransactionRecord>) =>
    transactions.push({ id: id(), origin: "manual", recurrenceId: null, ...t });

  const startMonth = shiftMonth(month, -HISTORY.length);
  const recurrences: RecurrenceRecord[] = RECURRENCES.map(([, description, amount, category, source, dueDay, end]) => ({
    id: id(),
    type: "despesa",
    description,
    amount,
    dueDay,
    startDate: dateIn(startMonth, dueDay),
    endDate: end ? dateIn(shiftMonth(month, end), dueDay) : null,
    active: true,
    categoryId: cat(category),
    valueSourceId: src(source),
  }));

  for (const [day, description, amount, category, source, pending] of CURRENT_EXPENSES) {
    push({
      type: "despesa",
      nature: "variavel",
      description,
      amount,
      date: dateIn(month, day),
      status: pending || day > today ? "pendente" : "efetivada",
      categoryId: cat(category),
      valueSourceId: src(source),
    });
  }
  for (const [day, description, amount, category, source, pending] of CURRENT_INCOME) {
    push({
      type: "receita",
      nature: null,
      description,
      amount,
      date: dateIn(month, day),
      status: pending || day > today ? "pendente" : "efetivada",
      categoryId: cat(category),
      valueSourceId: src(source),
    });
  }

  HISTORY.forEach((h, hi) => {
    const m = shiftMonth(month, hi - HISTORY.length);
    push({
      type: "receita",
      nature: null,
      description: "Salário estágio",
      amount: "4200.00",
      date: dateIn(m, 5),
      status: "efetivada",
      categoryId: cat("salario"),
      valueSourceId: src("nubank"),
    });
    if (h.extraIncome) {
      push({
        type: "receita",
        nature: null,
        description: "Freelance",
        amount: `${h.extraIncome}.00`,
        date: dateIn(m, 18),
        status: "efetivada",
        categoryId: cat("freelance"),
        valueSourceId: src("nubank"),
      });
    }
    HISTORY_EXPENSES.forEach(([description, base, category, source], vi) => {
      const cents = Math.round(base * 100 * h.factor * (1 + ((vi + hi) % 3) * 0.07));
      push({
        type: "despesa",
        nature: "variavel",
        description,
        amount: (cents / 100).toFixed(2),
        date: dateIn(m, 2 + ((vi * 3 + hi) % 26)),
        status: "efetivada",
        categoryId: cat(category),
        valueSourceId: src(source),
      });
    });
  });

  // Despesas fixas projetadas pelas recorrências (histórico + mês atual).
  for (const rec of recurrences) {
    for (let delta = -HISTORY.length; delta <= 0; delta++) {
      const m = shiftMonth(month, delta);
      const date = dateIn(m, rec.dueDay);
      if (date < rec.startDate) continue;
      push({
        type: rec.type,
        nature: "fixa",
        description: rec.description,
        amount: rec.amount,
        date,
        status: delta === 0 && rec.dueDay > today ? "pendente" : "efetivada",
        origin: "recorrencia",
        recurrenceId: rec.id,
        categoryId: rec.categoryId,
        valueSourceId: rec.valueSourceId,
      });
    }
  }

  return { categories, valueSources, transactions, recurrences };
}
