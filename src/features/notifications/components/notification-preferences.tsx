"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/common/section-header";
import { Switch } from "@/components/ui/switch";
import { setNotificationPreferenceAction } from "../actions";
import { NOTIFICATION_TYPE_LABELS, type NotificationPreference, type NotificationType } from "../schemas";

/** Quais ações geram aviso no sino. Cada interruptor salva na hora (desfeito se o backend recusar). */
export function NotificationPreferences({ preferences }: { preferences: NotificationPreference[] }) {
  const [, startTransition] = useTransition();
  const [items, setOptimistic] = useOptimistic(
    preferences,
    (current, change: { type: NotificationType; active: boolean }) =>
      current.map((p) => (p.type === change.type ? { ...p, active: change.active } : p)),
  );

  function toggle(type: NotificationType, active: boolean) {
    startTransition(async () => {
      setOptimistic({ type, active });
      const result = await setNotificationPreferenceAction({ type, active });
      if (!result.ok) toast.error(result.error.message);
    });
  }

  return (
    <section id="avisos" aria-label="Avisos no app" className="scroll-mt-20">
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft lg:p-5">
        <SectionHeader title="Avisos no app" />
        <p className="-mt-1 mb-3 text-sm text-muted-foreground">
          Escolha quais ações geram uma notificação no sino. Os avisos aparecem só aqui no FinanceControl.
        </p>
        <ul className="divide-y divide-border">
          {items.map(({ type, active }) => {
            const { label, description } = NOTIFICATION_TYPE_LABELS[type];
            return (
              <li key={type}>
                <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{label}</span>
                    <span id={`aviso-${type}`} className="block text-[13px] text-muted-foreground">
                      {description}
                    </span>
                  </span>
                  <Switch
                    checked={active}
                    onCheckedChange={(next) => toggle(type, next)}
                    aria-label={label}
                    aria-describedby={`aviso-${type}`}
                  />
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
