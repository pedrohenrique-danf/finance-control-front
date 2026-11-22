import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/features/auth";
import { firstParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = firstParam(params.next);
  // errorCallbackURL do login com Google
  const initialError = firstParam(params.error)
    ? "Não foi possível entrar com o Google. Tente novamente ou use e-mail e senha."
    : undefined;

  return (
    <AuthShell
      title="Bem-vindo de volta"
      subtitle="Suas finanças, com clareza."
      footer={
        <>
          Não tem conta?{" "}
          <Link href="/register" className="font-bold text-primary underline-offset-4 hover:underline">
            Cadastre-se
          </Link>
        </>
      }
    >
      <LoginForm next={next} initialError={initialError} />
    </AuthShell>
  );
}
