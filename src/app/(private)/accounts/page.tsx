import type { Metadata } from "next";
import { AccountsView, accountsDataSource } from "@/features/accounts";

export const metadata: Metadata = { title: "Contas e cartões" };

// Contas, carteira e cartões (tabela fontes_valor) com o saldo atual de cada uma.
export default async function AccountsPage() {
  const accounts = await accountsDataSource.list();
  return <AccountsView accounts={accounts} />;
}
