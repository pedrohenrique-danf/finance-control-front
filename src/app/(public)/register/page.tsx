import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/layout/auth-shell";
import { RegisterForm } from "@/features/auth";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <AuthShell
      back
      title="Crie sua conta"
      subtitle="Leva menos de um minuto."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-bold text-primary underline-offset-4 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
