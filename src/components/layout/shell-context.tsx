"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type TransactionKind = "receita" | "despesa";

export interface TransactionSheetState {
  open: boolean;
  /** Id da transação em edição; ausente = nova transação. */
  editId?: string;
  defaultType?: TransactionKind;
}

interface ShellState {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  /** "Ocultar valores" (olho no card de saldo). Estado de UI, não persiste no servidor. */
  hideValues: boolean;
  toggleHideValues: () => void;
  transactionSheet: TransactionSheetState;
  openNewTransaction: (type?: TransactionKind) => void;
  openEditTransaction: (id: string) => void;
  closeTransaction: () => void;
  unreadNotifications: number;
}

const ShellContext = createContext<ShellState | null>(null);

/** Estado de UI compartilhado pela área logada. Nenhum dado de domínio é guardado aqui. */
export function ShellProvider({
  children,
  initialHideValues = false,
  unreadNotifications = 0,
}: {
  children: React.ReactNode;
  initialHideValues?: boolean;
  unreadNotifications?: number;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hideValues, setHideValues] = useState(initialHideValues);
  const [transactionSheet, setTransactionSheet] = useState<TransactionSheetState>({ open: false });

  const toggleHideValues = useCallback(() => setHideValues((v) => !v), []);
  const openNewTransaction = useCallback(
    (type?: TransactionKind) => setTransactionSheet({ open: true, ...(type ? { defaultType: type } : {}) }),
    [],
  );
  const openEditTransaction = useCallback((id: string) => setTransactionSheet({ open: true, editId: id }), []);
  const closeTransaction = useCallback(() => setTransactionSheet((s) => ({ ...s, open: false })), []);

  const value = useMemo<ShellState>(
    () => ({
      drawerOpen,
      setDrawerOpen,
      hideValues,
      toggleHideValues,
      transactionSheet,
      openNewTransaction,
      openEditTransaction,
      closeTransaction,
      unreadNotifications,
    }),
    [
      drawerOpen,
      hideValues,
      toggleHideValues,
      transactionSheet,
      openNewTransaction,
      openEditTransaction,
      closeTransaction,
      unreadNotifications,
    ],
  );
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellState {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell deve ser usado dentro de <ShellProvider>.");
  return ctx;
}

/** Versão tolerante: fora da área logada (ex.: telas públicas) retorna null. */
export function useOptionalShell(): ShellState | null {
  return useContext(ShellContext);
}
