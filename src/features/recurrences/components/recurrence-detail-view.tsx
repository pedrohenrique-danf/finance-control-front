"use client";

import { CalendarDays, CalendarRange, CreditCard, Pencil, Tag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/common/category-icon";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Money } from "@/components/common/money";
import { SectionHeader } from "@/components/common/section-header";
import { type BadgeTone, StatusBadge } from "@/components/common/status-badge";
import { HeaderIconButton } from "@/components/layout/header-controls";
import { PageSection } from "@/components/layout/page-section";
import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { formatDate, formatMonthLabel } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { deleteRecurrenceAction } from "../actions";
import type { RecurrenceAccount, RecurrenceCategory, RecurrenceDetail, ScheduleStatus } from "../schemas";
import { RecurrenceSheet } from "./recurrence-sheet";

const STATUS: Record<ScheduleStatus, { tone: BadgeTone; dot: string }> = {
  efetivada: { tone: "success", dot: "bg-income" },
  pendente: { tone: "warning", dot: "bg-alert" },
  prevista: { tone: "muted", dot: "bg-accent-soft" },
};

function statusLabel(status: ScheduleStatus, type: RecurrenceDetail["type"]): string {
  if (status === "efetivada") return type === "receita" ? "Recebido" : "Pago";
  return status === "pendente" ? "Pendente" : "Prevista";
}

export function RecurrenceDetailView({
  recurrence: r,
  categories,
  accounts,
}: {
  recurrence: RecurrenceDetail;
  categories: readonly RecurrenceCategory[];
  accounts: readonly RecurrenceAccount[];
}) {
  const router = useRouter();
  const { openEditTransaction } = useShell();
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, startDelete] = useTransition();
  const category = categories.find((c) => c.id === r.categoryId);
  const account = accounts.find((a) => a.id === r.valueSourceId);

  function onDelete() {
    startDelete(async () => {
      const result = await deleteRecurrenceAction(r.id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setConfirmOpen(false);
      toast.success("Recorrência encerrada.");
      router.replace("/recurrences");
    });
  }

  const rows = [
    { icon: Tag, label: "Categoria", value: category?.name ?? "Sem categoria" },
    { icon: CreditCard, label: "Conta", value: account?.name ?? "—" },
    { icon: CalendarDays, label: "Vencimento", value: `Todo dia ${r.dueDay}` },
    {
      icon: CalendarRange,
      label: "Período",
      value: `${formatDate(r.startDate)} – ${r.endDate ? formatDate(r.endDate) : "sem término"}`,
    },
  ];

  return (
    <PageSection
      title="Despesa fixa"
      backHref="/recurrences"
      action={
        <HeaderIconButton label="Editar recorrência" onClick={() => setEditing(true)}>
          <Pencil className="size-5" aria-hidden />
        </HeaderIconButton>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <div className="flex flex-col items-center rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
            <CategoryIcon category={category} className="size-16" iconClassName="size-7" />
            <h2 className="mt-3 text-lg font-bold break-words text-primary-dark">{r.description}</h2>
            <Money
              value={r.amount}
              className={cn("mt-1 text-[28px] font-extrabold", r.type === "receita" && "text-income")}
            />
            <StatusBadge
              tone={r.active ? "success" : "muted"}
              label={r.active ? "Ativa" : "Pausada"}
              className="mt-2"
            />
          </div>

          <dl className="divide-y divide-border rounded-2xl border border-border bg-card px-4 shadow-soft">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center gap-3 py-3 text-sm">
                <row.icon className="size-4 shrink-0 text-sage" aria-hidden />
                <dt className="flex-1 text-muted-foreground">{row.label}</dt>
                <dd className="num min-w-0 truncate text-right font-semibold">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <section>
          <SectionHeader title="Próximos 6 meses" />
          {r.schedule.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lançamento previsto neste período.</p>
          ) : (
            <ol className="relative ml-2 space-y-4 border-l-2 border-border pl-6">
              {r.schedule.map((entry) => {
                const meta = STATUS[entry.status];
                const label = statusLabel(entry.status, r.type);
                const content = (
                  <>
                    <span
                      className={cn("absolute top-1 -left-[33px] size-4 rounded-full ring-4 ring-background", meta.dot)}
                      aria-hidden
                    />
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-left">
                        <p className="text-sm font-semibold">{formatMonthLabel(entry.month)}</p>
                        <p className="num text-xs text-muted-foreground">Vence em {formatDate(entry.dueDate)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Money value={r.amount} className="text-sm font-bold" />
                        <StatusBadge tone={meta.tone} label={label} />
                      </div>
                    </div>
                  </>
                );
                return (
                  <li key={entry.month} className="relative">
                    {entry.transactionId ? (
                      <button
                        type="button"
                        onClick={() => entry.transactionId && openEditTransaction(entry.transactionId)}
                        aria-label={`${formatMonthLabel(entry.month)}: ${label}. Abrir lançamento`}
                        className="-mx-2 block w-[calc(100%+1rem)] rounded-xl px-2 py-1 transition-colors hover:bg-muted/50"
                      >
                        {content}
                      </button>
                    ) : (
                      <div className="py-1">{content}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <Button
        variant="outline"
        size="lg"
        className="w-full text-expense lg:w-auto"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 aria-hidden /> Excluir recorrência
      </Button>

      <RecurrenceSheet
        open={editing}
        onOpenChange={setEditing}
        recurrence={r}
        categories={categories}
        accounts={accounts}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Excluir recorrência?"
        description="Os lançamentos já feitos continuam no extrato. Só os meses futuros deixam de ser lançados."
        pending={deleting}
        onConfirm={onDelete}
      />
    </PageSection>
  );
}
