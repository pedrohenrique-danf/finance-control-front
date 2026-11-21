import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/common/logo";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  /** Mostra "voltar para o login" no topo. */
  back?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

function Leaf({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <path d="M20 180C20 90 80 25 180 20c0 100-65 160-160 160Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Telas públicas (login, cadastro, senha).
 * Mobile: faixa verde arredondada no topo + formulário. `lg`+: painel da marca à esquerda, formulário à direita.
 */
export function AuthShell({ title, subtitle, back, footer, children }: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative overflow-hidden rounded-b-[36px] bg-primary-dark px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-9 text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:rounded-none lg:px-14 lg:py-14">
        <Leaf className="pointer-events-none absolute -top-6 -right-10 size-48 text-primary-foreground/10 lg:size-[28rem]" />
        <div className="relative">
          {back ? (
            <Link
              href="/login"
              aria-label="Voltar para o login"
              className="tap -ml-3 mb-2 inline-grid place-items-center rounded-full hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="size-5" aria-hidden />
            </Link>
          ) : null}
          <Logo markClassName="size-9" />
          <h1 className="mt-7 text-[26px] leading-tight font-extrabold lg:mt-24 lg:text-5xl">{title}</h1>
          {subtitle ? <p className="mt-1.5 text-sm opacity-80 lg:mt-4 lg:text-lg">{subtitle}</p> : null}
        </div>
        <p className="relative hidden text-sm opacity-70 lg:block">
          Receitas, despesas fixas e variáveis e o saldo do mês em um só lugar.
        </p>
      </div>
      <div className="flex flex-col lg:min-h-dvh lg:justify-center">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-7 pb-8 lg:flex-none lg:pt-0">
          {children}
        </div>
        {footer ? (
          <div className="mx-auto w-full max-w-md px-6 pb-10 text-center text-sm text-muted-foreground">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
