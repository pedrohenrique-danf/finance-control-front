import { Money } from "@/components/common/money";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES } from "../account-types";
import type { Account } from "../schemas";

/** Cartão visual da conta. Cartão de crédito mostra a fatura (valor absoluto do saldo devedor). */
export function AccountCard({ account, className }: { account: Account; className?: string }) {
  const meta = ACCOUNT_TYPES[account.type];
  const Icon = meta.icon;
  const isCredit = account.type === "cartao_credito";
  const balance = isCredit ? String(Math.abs(Number(account.currentBalance))) : account.currentBalance;
  return (
    <div
      className={cn(
        "relative flex h-[164px] flex-col justify-between overflow-hidden rounded-3xl p-5 shadow-card",
        meta.surface,
        !account.active && "opacity-60",
        className,
      )}
    >
      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-10 -bottom-12 size-40 opacity-10"
        aria-hidden
      >
        <circle cx="100" cy="100" r="90" fill="currentColor" />
      </svg>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-bold">{account.name}</p>
          {account.institution ? <p className="truncate text-xs opacity-80">{account.institution}</p> : null}
        </div>
        <Icon className="size-6 shrink-0 opacity-90" aria-hidden />
      </div>
      <div>
        <p className="text-[11px] opacity-80">{isCredit ? "Fatura atual" : "Saldo atual"}</p>
        <Money value={balance} className="text-2xl font-extrabold" />
        <p className="mt-0.5 text-[11px] font-medium opacity-80">
          {meta.label}
          {account.active ? "" : " · inativa"}
        </p>
      </div>
    </div>
  );
}
