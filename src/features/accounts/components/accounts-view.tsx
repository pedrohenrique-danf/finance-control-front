"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { Money } from "@/components/common/money";
import { SectionHeader } from "@/components/common/section-header";
import { HeaderIconButton } from "@/components/layout/header-controls";
import { PageSection } from "@/components/layout/page-section";
import { Button } from "@/components/ui/button";
import { ACCOUNT_TYPES } from "../account-types";
import { fromCentsTotal } from "../balance";
import type { Account } from "../schemas";
import { AccountCard } from "./account-card";
import { AccountSheet } from "./account-sheet";

export function AccountsView({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const total = fromCentsTotal(accounts.filter((a) => a.active).map((a) => a.currentBalance));

  return (
    <PageSection
      title="Contas e cartões"
      description="Saldo consolidado de contas, carteira e cartões de crédito."
      action={
        <HeaderIconButton label="Nova conta" onClick={() => setOpen(true)}>
          <Plus className="size-[22px]" aria-hidden />
        </HeaderIconButton>
      }
    >
      <div className="text-center lg:text-left">
        <p className="text-sm text-muted-foreground">Saldo total consolidado</p>
        <Money value={total} className="text-[32px] font-extrabold text-primary-dark" />
        <p className="text-xs text-muted-foreground">Soma das contas ativas, já descontadas as faturas</p>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          art="wallet"
          title="Nenhuma conta cadastrada"
          description="Cadastre suas contas, carteira e cartões para acompanhar o saldo de cada um."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus aria-hidden /> Nova conta ou cartão
            </Button>
          }
        />
      ) : (
        <>
          <ul
            aria-label="Cartões das contas"
            className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0"
          >
            {accounts.map((account) => (
              <li key={account.id} className="w-[78%] shrink-0 snap-center lg:w-auto">
                <Link
                  href={`/accounts/${account.id}`}
                  className="block rounded-3xl"
                  aria-label={`Abrir ${account.name}`}
                >
                  <AccountCard account={account} />
                </Link>
              </li>
            ))}
            <li className="w-[40%] shrink-0 snap-center lg:w-auto">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex h-[164px] w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
              >
                <Plus className="size-6" aria-hidden /> Adicionar
              </button>
            </li>
          </ul>

          <section>
            <SectionHeader title="Todas as contas" />
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              {accounts.map((account) => {
                const meta = ACCOUNT_TYPES[account.type];
                const Icon = meta.icon;
                const negative = Number(account.currentBalance) < 0;
                return (
                  <li key={account.id}>
                    <Link
                      href={`/accounts/${account.id}`}
                      className="flex min-h-16 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-primary">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{account.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[meta.label, account.institution, account.active ? null : "inativa"]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <Money
                        value={account.currentBalance}
                        className={negative ? "text-sm font-bold text-expense" : "text-sm font-bold"}
                      />
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      <Button variant="secondary" size="lg" className="w-full lg:w-auto" onClick={() => setOpen(true)}>
        <Plus aria-hidden /> Nova conta ou cartão
      </Button>
      <AccountSheet open={open} onOpenChange={setOpen} account={null} />
    </PageSection>
  );
}
