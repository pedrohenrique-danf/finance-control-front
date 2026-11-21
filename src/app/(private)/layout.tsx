import { AppShell } from "@/components/layout/app-shell";
import { accountsDataSource } from "@/features/accounts";
import { categoriesDataSource } from "@/features/categories";
import { TransactionSheet } from "@/features/transactions";
import { requireSession } from "@/lib/auth/session";

export default async function PrivateLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireSession(); // verificação autoritativa: redireciona para /login sem sessão válida
  // Dados do formulário global de transação (botão "+" de qualquer tela).
  const [categories, accounts] = await Promise.all([categoriesDataSource.list(), accountsDataSource.list()]);
  return (
    <AppShell
      user={{ name: user.name, email: user.email }}
      overlays={<TransactionSheet categories={categories} accounts={accounts} />}
    >
      {children}
    </AppShell>
  );
}
