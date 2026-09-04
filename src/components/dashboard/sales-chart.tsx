"use client";

import { useMemo } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatMoney, formatMoneyCompact, formatNumber } from "@/lib/format";

export type SalesPoint = { day: string; gross_cents: number; orders: number; tickets: number };

const AXIS_STYLE = { fontSize: 12, fill: "var(--viz-axis)" } as const;

function shortDay(iso: string) {
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(new Date(iso));
}

function longDay(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/**
 * One tooltip for both charts. Values use the text tokens, never the series
 * colour — the coloured mark on the plot carries identity, and a light hue is
 * illegible as text on the card surface.
 */
function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { value: number; name?: string }[];
  label?: string;
  formatter: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-pop px-3 py-2">
      <p className="text-xs text-ink-2">{label ? longDay(label) : ""}</p>
      <p className="mt-0.5 text-md font-semibold tabular text-ink">
        {formatter(payload[0].value)}
      </p>
    </div>
  );
}

/** The headline the chart explains, then the plot. */
function VizFrame({ total, children }: { total: string; children: React.ReactNode }) {
  return (
    <div className="viz">
      <p className="mb-5 text-3xl font-bold leading-none tabular tracking-[-0.03em] text-ink">
        {total}
      </p>
      {children}
    </div>
  );
}

/**
 * Daily gross revenue. One series, so no legend — the card title names it —
 * and a 2px line over a 10% wash rather than a saturated block.
 */
export function RevenueChart({ data, currency }: { data: SalesPoint[]; currency: string }) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.gross_cents, 0), [data]);

  return (
    <VizFrame total={formatMoney(total, currency)}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.16} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={shortDay}
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            dy={6}
          />
          <YAxis
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => formatMoneyCompact(value, currency)}
          />
          <Tooltip
            cursor={{ stroke: "var(--viz-axis)", strokeWidth: 1 }}
            content={<ChartTooltip formatter={(value) => formatMoney(value, currency)} />}
          />
          <Area
            type="monotone"
            dataKey="gross_cents"
            stroke="var(--series-1)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#revenueFill)"
            /* The 2px ring in the surface colour keeps the dot legible where it
               crosses the line, and enlarges its hover target. */
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </VizFrame>
  );
}

/** Tickets issued per day: capped bars, rounded cap, square at the baseline. */
export function TicketsChart({ data }: { data: SalesPoint[] }) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.tickets, 0), [data]);

  return (
    <VizFrame total={formatNumber(total)}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }} barCategoryGap="30%">
          <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={shortDay}
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            dy={6}
          />
          <YAxis
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "var(--color-sunken)" }}
            content={<ChartTooltip formatter={(value) => `${formatNumber(value)} tickets`} />}
          />
          <Bar dataKey="tickets" fill="var(--series-2)" radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </VizFrame>
  );
}
