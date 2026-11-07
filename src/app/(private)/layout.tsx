import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/session";

export default async function PrivateLayout({ children }: LayoutProps<"/">) {
  await requireSession(); // verificação autoritativa: redireciona para /login sem sessão válida
  return <AppShell>{children}</AppShell>;
}
