"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { Money } from "@/components/common/money";
import { SectionHeader } from "@/components/common/section-header";
import { StatusBadge } from "@/components/common/status-badge";
import { HeaderIconButton } from "@/components/layout/header-controls";
import { PageSection } from "@/components/layout/page-section";
import { ACCOUNT_TYPES } from "../account-types";
import type { Account } from "../schemas";
import { AccountCard } from "./account-card";
import { AccountSheet } from "./account-sheet";

/** Detalhe da conta. `children`: seção de transações da conta (composta pela página). */
export function AccountDetailView({ account, children }: { account: Account; children?: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  const meta = ACCOUNT_TYPES[account.type];

  return (
    <PageSection
      title={account.name}
      backHref="/accounts"
      action={
        <HeaderIconButton label="Editar conta" onClick={() => setEditing(true)}>
          <Pencil className="size-5" aria-hidden />
        </HeaderIconButton>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start">
        <AccountCard account={account} />
        <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <SectionHeader
            title="Dados da conta"
            action={
              <StatusBadge tone={account.active ? "success" : "muted"} label={account.active ? "Ativa" : "Inativa"} />
            }
          />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Tipo</dt>
              <dd className="font-semibold">{meta.label}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Instituição</dt>
              <dd className="truncate font-semibold">{account.institution ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Saldo inicial</dt>
              <dd className="font-semibold">
                <Money value={account.initialBalance} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Saldo atual</dt>
              <dd className={Number(account.currentBalance) < 0 ? "font-semibold text-expense" : "font-semibold"}>
                <Money value={account.currentBalance} />
              </dd>
            </div>
          </dl>
        </section>
      </div>
      {children}
      <AccountSheet open={editing} onOpenChange={setEditing} account={account} />
    </PageSection>
  );
}
