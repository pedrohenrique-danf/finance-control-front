"use client";

import { Pencil, Trash2 } from "lucide-react";
import { type PointerEvent, useRef, useState } from "react";
import { CategoryIcon } from "@/components/common/category-icon";
import { Money } from "@/components/common/money";
import { StatusBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";
import type { CategoryOption, Transaction } from "../schemas";

interface TransactionItemProps {
  transaction: Transaction;
  category: CategoryOption | undefined;
  accountName?: string | undefined;
  onOpen?: () => void;
  /** Com `onDelete`, o item fica deslizável (arrastar para a esquerda mostra Editar/Excluir). */
  onDelete?: () => void;
  /** Esconde os selos de status (listas compactas). */
  compact?: boolean;
}

const ACTIONS_WIDTH = 136;

function statusLabel(t: Transaction): string {
  if (t.status === "pendente") return "Pendente";
  return t.type === "receita" ? "Recebido" : "Pago";
}

function Content({ transaction: t, category, accountName, compact }: TransactionItemProps) {
  const income = t.type === "receita";
  return (
    <>
      <CategoryIcon category={category} />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[14.5px] font-semibold text-foreground">{t.description}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {category?.name ?? "Sem categoria"}
          {accountName ? ` · ${accountName}` : ""}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <Money
          value={t.amount}
          type={t.type}
          signed
          className={cn("text-[14.5px] font-bold", income ? "text-income" : "text-expense")}
        />
        {compact ? null : (
          <span className="flex gap-1">
            {t.nature === "fixa" ? <StatusBadge tone="accent" label="Fixa" /> : null}
            <StatusBadge tone={t.status === "pendente" ? "warning" : "success"} label={statusLabel(t)} />
          </span>
        )}
      </span>
    </>
  );
}

/** Linha de transação. Toque abre a edição; no celular, arrastar para a esquerda revela Editar/Excluir. */
export function TransactionItem(props: TransactionItemProps) {
  const { onOpen, onDelete, transaction } = props;
  const swipeable = Boolean(onDelete);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; base: number; moved: boolean; axis: "x" | "y" | null } | null>(null);

  const onPointerDown = (e: PointerEvent) => {
    if (!swipeable || e.pointerType === "mouse") return;
    start.current = { x: e.clientX, y: e.clientY, base: offset, moved: false, axis: null };
  };
  const onPointerMove = (e: PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) s.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (s.axis !== "x") return;
    s.moved = true;
    setDragging(true);
    setOffset(Math.min(0, Math.max(-ACTIONS_WIDTH - 20, s.base + dx)));
  };
  const onPointerUp = () => {
    const s = start.current;
    start.current = null;
    setDragging(false);
    if (s?.moved) setOffset((o) => (o < -ACTIONS_WIDTH / 2 ? -ACTIONS_WIDTH : 0));
  };

  const row = (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={() => {
        if (offset !== 0) return setOffset(0);
        onOpen?.();
      }}
      disabled={!onOpen}
      aria-label={onOpen ? `Editar ${transaction.description}` : undefined}
      style={{ transform: `translateX(${offset}px)`, touchAction: "pan-y" }}
      className={cn(
        "relative flex min-h-[68px] w-full items-center gap-3 bg-card px-3 py-2.5 select-none disabled:cursor-default",
        !dragging && "transition-transform duration-200 ease-out",
        swipeable && "lg:pr-14",
        onOpen && "cursor-pointer hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
      )}
    >
      <Content {...props} />
    </button>
  );

  if (!swipeable) return row;

  const revealed = offset !== 0;
  return (
    <div className="group/item relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex" style={{ width: ACTIONS_WIDTH }} aria-hidden={!revealed}>
        <button
          type="button"
          tabIndex={revealed ? 0 : -1}
          onClick={() => {
            setOffset(0);
            onOpen?.();
          }}
          className="flex flex-1 flex-col items-center justify-center gap-1 bg-accent-soft text-[11px] font-semibold text-foreground"
        >
          <Pencil className="size-4" aria-hidden /> Editar
        </button>
        <button
          type="button"
          tabIndex={revealed ? 0 : -1}
          onClick={() => {
            setOffset(0);
            onDelete?.();
          }}
          className="flex flex-1 flex-col items-center justify-center gap-1 bg-expense text-[11px] font-semibold text-primary-foreground"
        >
          <Trash2 className="size-4" aria-hidden /> Excluir
        </button>
      </div>
      {row}
      {/* Desktop/teclado: excluir direto, sem gesto. */}
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Excluir ${transaction.description}`}
        className="absolute top-1/2 right-2 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-card text-muted-foreground opacity-0 shadow-soft transition-opacity group-hover/item:opacity-100 hover:text-expense focus-visible:opacity-100 lg:grid"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}
