"use client";

import { useState } from "react";
import { Money } from "@/components/common/money";
import { cn } from "@/lib/utils";
import { percentages, type Slice } from "../chart-data";

const SIZE = 132;
const RADIUS = 54;
const STROKE = 20;
const GAP = 2; // separação de 2 px entre fatias (cor da superfície)
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Donut de despesas por categoria. Identidade nunca só pela cor: legenda com nome e % ao lado. */
export function ExpenseDonut({ slices, total }: { slices: Slice[]; total: string }) {
  const [active, setActive] = useState<number | null>(null);
  const shares = percentages(slices.map((s) => s.total));
  const sum = slices.reduce((acc, s) => acc + s.total, 0);
  const current = active !== null ? slices[active] : undefined;

  let offset = 0;
  const arcs = slices.map((slice, index) => {
    const length = sum > 0 ? (slice.total / sum) * CIRCUMFERENCE : 0;
    const gap = slices.length > 1 ? Math.min(GAP, length / 2) : 0;
    const arc = { slice, index, dash: Math.max(0, length - gap), offset };
    offset += length;
    return arc;
  });

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-[132px] shrink-0">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" aria-hidden>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--color-muted)" strokeWidth={STROKE} />
          {arcs.map(({ slice, index, dash, offset: start }) => (
            <circle
              key={slice.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth={active === index ? STROKE + 4 : STROKE}
              strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
              strokeDashoffset={-start}
              className={cn(
                "transition-[stroke-width,opacity] duration-150",
                active !== null && active !== index && "opacity-40",
              )}
              onPointerEnter={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="line-clamp-1 text-[10px] font-medium text-muted-foreground">{current?.name ?? "Total"}</span>
          <Money
            value={current ? current.total.toFixed(2) : total}
            className="text-[12px] font-bold text-primary-dark"
          />
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1">
        {slices.map((slice, index) => (
          <li key={slice.key}>
            {/* Destaque só no ponteiro; teclado e leitor de tela usam a tabela equivalente abaixo. */}
            <div
              onPointerEnter={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
              className={cn(
                "flex min-h-7 w-full items-center gap-2 rounded-lg px-1 text-xs transition-colors",
                active === index && "bg-muted",
              )}
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-foreground">{slice.name}</span>
              <span className="num font-semibold text-muted-foreground">{shares[index]}%</span>
            </div>
          </li>
        ))}
      </ul>
      <table className="sr-only">
        <caption>Despesas por categoria no mês</caption>
        <thead>
          <tr>
            <th scope="col">Categoria</th>
            <th scope="col">Valor</th>
            <th scope="col">Percentual</th>
          </tr>
        </thead>
        <tbody>
          {slices.map((slice, index) => (
            <tr key={slice.key}>
              <th scope="row">{slice.name}</th>
              <td>
                <Money value={slice.total.toFixed(2)} />
              </td>
              <td>{shares[index]}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
