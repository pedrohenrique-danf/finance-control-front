import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4 px-5 py-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando…</span>
      <Skeleton className="mx-auto h-6 w-40 rounded-full lg:mx-0" />
      <Skeleton className="h-44 w-full rounded-3xl bg-accent-soft/60" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
