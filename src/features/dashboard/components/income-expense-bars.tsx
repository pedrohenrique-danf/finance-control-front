"use client";

import { useState } from "react";
import { Money } from "@/components/common/money";
import { formatMonthLabel, formatMonthShort } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { niceMax } from "../chart-data";

// Cores validadas (dataviz validate_palette): verde da marca × terracota claro.
// Separação para daltonismo ΔE 10,7 (protan); contraste < 3:1 → legenda + tabela equivalente obrigatórias.
export const INCOME_COLOR = "#5E7A3A";
export const EXPENSE_COLOR = "#C98B6B";

const WIDTH = 320;
const HEIGHT = 150;
const PLOT_TOP = 8;
const PLOT_BOTTOM = 126; // linha de base; abaixo ficam os rótulos dos meses
const BAR = 12;
const PAIR_GAP = 2;
const RADIUS = 4;

/** Barra com só o topo arredondado, ancorada na linha de base. */
function barPath(x: number, height: number): string {
  if (height <= 0) return "";
  const r = Math.min(RADIUS, height, BAR / 2);
  const top = PLOT_BOTTOM - height;
  return `M${x},${PLOT_BOTTOM} V${top + r} Q${x},${top} ${x + r},${top} H${x + BAR - r} Q${x + BAR},${top} ${x + BAR},${top + r} V${PLOT_BOTTOM} Z`;
}

export interface MonthBar {
  month: string;
  income: string;
  expense: string;
}

/** Receitas × despesas dos últimos 6 meses (barras agrupadas, um único eixo). */
export function IncomeExpenseBars({ bars, currentMonth }: { bars: MonthBar[]; currentMonth: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...bars.flatMap((b) => [Number(b.income), Number(b.expense)])));
  const slot = WIDTH / bars.length;
  const scale = (v: number) => (v / max) * (PLOT_BOTTOM - PLOT_TOP);
  const hovered = active !== null ? bars[active] : undefined;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full overflow-visible" aria-hidden>
        <line x1={0} x2={WIDTH} y1={PLOT_BOTTOM} y2={PLOT_BOTTOM} stroke="var(--color-border)" strokeWidth={1} />
        <line
          x1={0}
          x2={WIDTH}
          y1={PLOT_TOP + (PLOT_BOTTOM - PLOT_TOP) / 2}
          y2={PLOT_TOP + (PLOT_BOTTOM - PLOT_TOP) / 2}
          stroke="var(--color-border)"
          strokeDasharray="2 4"
          strokeWidth={1}
        />
        {bars.map((bar, index) => {
          const center = slot * index + slot / 2;
          const xIncome = center - BAR - PAIR_GAP / 2;
          const xExpense = center + PAIR_GAP / 2;
          const dim = active !== null && active !== index;
          return (
            <g key={bar.month} className={cn("transition-opacity duration-150", dim && "opacity-40")}>
              {active === index ? (
                <rect
                  x={slot * index + 4}
                  y={0}
                  width={slot - 8}
                  height={PLOT_BOTTOM}
                  rx={8}
                  fill="var(--color-muted)"
                />
              ) : null}
              <path d={barPath(xIncome, scale(Number(bar.income)))} fill={INCOME_COLOR} />
              <path d={barPath(xExpense, scale(Number(bar.expense)))} fill={EXPENSE_COLOR} />
              <text
                x={center}
                y={HEIGHT - 6}
                textAnchor="middle"
                className={cn(
                  "text-[11px]",
                  bar.month === currentMonth ? "fill-primary-dark font-bold" : "fill-muted-foreground",
                )}
              >
                {formatMonthShort(bar.month)}
              </text>
              {/* Área de toque maior que a marca. */}
              <rect
                x={slot * index}
                y={0}
                width={slot}
                height={HEIGHT}
                fill="transparent"
                onPointerEnter={() => setActive(index)}
                onPointerLeave={() => setActive(null)}
              />
            </g>
          );
        })}
      </svg>

      {hovered && active !== null ? (
        <div
          className="pointer-events-none absolute top-0 z-10 w-max -translate-x-1/2 rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-card"
          style={{ left: `${Math.min(Math.max(((active + 0.5) / bars.length) * 100, 22), 78)}%` }}
        >
          <p className="mb-1 font-bold text-primary-dark">{formatMonthLabel(hovered.month)}</p>
          <p className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: INCOME_COLOR }} aria-hidden />
            Receitas <Money value={hovered.income} className="ml-auto pl-3 font-semibold" />
          </p>
          <p className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: EXPENSE_COLOR }} aria-hidden />
            Despesas <Money value={hovered.expense} className="ml-auto pl-3 font-semibold" />
          </p>
        </div>
      ) : null}

      <table className="sr-only">
        <caption>Receitas e despesas dos últimos 6 meses</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">Receitas</th>
            <th scope="col">Despesas</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((bar) => (
            <tr key={bar.month}>
              <th scope="row">{formatMonthLabel(bar.month)}</th>
              <td>
                <Money value={bar.income} />
              </td>
              <td>
                <Money value={bar.expense} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
