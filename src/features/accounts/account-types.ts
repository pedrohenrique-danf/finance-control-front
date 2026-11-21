import { CircleDollarSign, CreditCard, Landmark, type LucideIcon, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import type { AccountType } from "./schemas";

/** Rótulo, ícone e superfície do cartão visual de cada tipo de conta (enum valueSourceTypes). */
export const ACCOUNT_TYPES: Record<AccountType, { label: string; icon: LucideIcon; surface: string }> = {
  conta_corrente: { label: "Conta corrente", icon: Landmark, surface: "bg-primary text-primary-foreground" },
  poupanca: { label: "Poupança", icon: PiggyBank, surface: "bg-accent-fresh text-foreground" },
  carteira: { label: "Carteira", icon: Wallet, surface: "bg-accent-soft text-foreground" },
  cartao_credito: { label: "Cartão de crédito", icon: CreditCard, surface: "bg-primary-dark text-primary-foreground" },
  investimento: { label: "Investimento", icon: TrendingUp, surface: "bg-sage text-foreground" },
  outro: { label: "Outro", icon: CircleDollarSign, surface: "bg-khaki text-foreground" },
};
