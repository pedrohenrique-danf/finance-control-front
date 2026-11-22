import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="text-7xl font-extrabold text-primary-dark" aria-hidden>
          404
        </p>
        <h1 className="mt-4 text-xl font-bold text-foreground">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">A página que você procura não existe ou foi movida.</p>
        <Link href="/dashboard" className={buttonVariants({ className: "mt-6" })}>
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
