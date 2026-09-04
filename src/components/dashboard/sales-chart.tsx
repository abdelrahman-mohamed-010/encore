"use client";

import { useMemo } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatMoney, formatMoneyCompact, formatNumber } from "@/lib/format";

export type SalesPoint = { day: string; gross_cents: number; orders: number; tickets: number };

const AXIS_STYLE = { fontSize: 11, fill: "var(--viz-axis)" } as const;

function shortDay(iso: string) {
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(new Date(iso));
}

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
    <div className="rounded-lg border border-hairline bg-card px-3 py-2 shadow-e2">
      <p className="text-2xs text-ink-3">
        {label ? new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", month: "short" }).format(new Date(label)) : ""}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular text-ink">
        {formatter(payload[0].value)}
      </p>
    </div>
  );
}

/**
 * Daily gross revenue. One series, so no legend — the card title names it — and
 * the y-axis carries visible money labels.
 */
export function RevenueChart({ data, currency }: { data: SalesPoint[]; currency: string }) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.gross_cents, 0), [data]);

  return (
    <div className="viz">
      <p className="mb-4 font-display text-2xl font-semibold leading-none numeral text-ink">
        {formatMoney(total, currency)}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.22} />
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
            minTickGap={28}
          />
          <YAxis
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => formatMoneyCompact(value, currency)}
          />
          <Tooltip
            cursor={{ stroke: "var(--viz-axis)", strokeWidth: 1, strokeDasharray: "3 3" }}
            content={<ChartTooltip formatter={(value) => formatMoney(value, currency)} />}
          />
          <Area
            type="monotone"
            dataKey="gross_cents"
            stroke="var(--series-1)"
            strokeWidth={2}
            fill="url(#revenueFill)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tickets issued per day. Bars have 4px rounded ends anchored to the baseline. */
export function TicketsChart({ data }: { data: SalesPoint[] }) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.tickets, 0), [data]);

  return (
    <div className="viz">
      <p className="mb-4 font-display text-2xl font-semibold leading-none numeral text-ink">
        {formatNumber(total)}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }} barCategoryGap="28%">
          <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={shortDay}
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
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
          <Bar dataKey="tickets" fill="var(--series-2)" radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
