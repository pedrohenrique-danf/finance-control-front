import { AppShell } from "@/components/layout/app-shell";
import { accountsDataSource } from "@/features/accounts";
import { categoriesDataSource } from "@/features/categories";
import { notificationsDataSource } from "@/features/notifications";
import { TransactionSheet } from "@/features/transactions";
import { requireSession } from "@/lib/auth/session";

export default async function PrivateLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireSession(); // verificação autoritativa: redireciona para /login sem sessão válida
  // Dados do formulário global de transação (botão "+" de qualquer tela).
  const [categories, accounts, unread] = await Promise.all([
    categoriesDataSource.list(),
    accountsDataSource.list(),
    notificationsDataSource.unreadCount(),
  ]);
  return (
    <AppShell
      user={{ name: user.name, email: user.email }}
      unreadNotifications={unread}
      overlays={<TransactionSheet categories={categories} accounts={accounts} />}
    >
      {children}
    </AppShell>
  );
}
