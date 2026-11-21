import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/session";

export default async function PrivateLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireSession(); // verificação autoritativa: redireciona para /login sem sessão válida
  return <AppShell user={{ name: user.name, email: user.email }}>{children}</AppShell>;
}
