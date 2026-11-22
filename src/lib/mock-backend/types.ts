// Registros do backend simulado, no formato do contrato HTTP (DTO): dinheiro em string decimal,
// datas "YYYY-MM-DD" e enums do banco (finance-control-back/src/shared/enums.ts).
// TODO(back): remover src/lib/mock-backend quando os endpoints de domínio existirem.

export type TransactionType = "receita" | "despesa";
export type TransactionNature = "fixa" | "variavel";
export type TransactionStatus = "pendente" | "efetivada";
export type TransactionOrigin = "manual" | "recorrencia" | "importacao";
export type ValueSourceType = "conta_corrente" | "poupanca" | "carteira" | "cartao_credito" | "investimento" | "outro";

export interface CategoryRecord {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string | null;
}

export interface ValueSourceRecord {
  id: string;
  name: string;
  type: ValueSourceType;
  institution: string | null;
  initialBalance: string;
  active: boolean;
}

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  /** Só despesas têm natureza (ck_transacoes_natureza). */
  nature: TransactionNature | null;
  description: string;
  amount: string;
  date: string;
  status: TransactionStatus;
  origin: TransactionOrigin;
  categoryId: string | null;
  valueSourceId: string | null;
  recurrenceId: string | null;
}

export interface RecurrenceRecord {
  id: string;
  type: TransactionType;
  description: string;
  amount: string;
  dueDay: number;
  startDate: string;
  endDate: string | null;
  active: boolean;
  categoryId: string | null;
  valueSourceId: string | null;
}

export type NotificationType =
  | "lembrete_registro"
  | "vencimento_despesa"
  | "importacao_concluida"
  | "exportacao_pronta"
  | "sistema";

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** Canal app: criada como "enviada" e marcada como "lida" pelo usuário. */
  status: "enviada" | "lida";
  createdAt: string;
  readAt: string | null;
  transactionId: string | null;
  recurrenceId: string | null;
}

export interface DataOperationRecord {
  id: string;
  type: "importacao" | "exportacao";
  format: "csv" | "xlsx" | "pdf";
  status: "concluida" | "concluida_com_erros" | "falhou";
  fileName: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  totalRows: number;
  successRows: number;
  errorRows: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  errors: Array<{ line: number; field: string | null; message: string; content: string | null }>;
}

export interface UserData {
  categories: CategoryRecord[];
  valueSources: ValueSourceRecord[];
  transactions: TransactionRecord[];
  recurrences: RecurrenceRecord[];
  notifications: NotificationRecord[];
  dataOperations: DataOperationRecord[];
}
