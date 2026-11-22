"use client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
}

/** Confirmação de toda ação destrutiva. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Excluir",
  pending = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-sm rounded-3xl bg-card p-6 shadow-card ring-0 data-[size=default]:max-w-sm">
        <AlertDialogTitle className="text-lg font-bold text-primary-dark">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </AlertDialogDescription>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <AlertDialogCancel variant="outline" size="default" disabled={pending}>
            Cancelar
          </AlertDialogCancel>
          <Button variant="expense" disabled={pending} onClick={() => void onConfirm()}>
            {pending ? "Aguarde…" : confirmLabel}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
