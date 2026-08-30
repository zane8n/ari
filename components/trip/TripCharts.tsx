"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryBreakdown, CumulativePoint, CurrencyMix, DaySpend, StatusBreakdown, VarianceItem } from "@/lib/trip/analysis";

const INK = "#0b0b0b";
const MUTED = "#898781";
const GRID = "#e1e0d9";
const SURFACE = "#fcfcfb";

/** Recharts' tooltip formatter types values loosely (string | number | undefined) — normalize once. */
function toNum(value: unknown): number {
  return typeof value === "number" ? value : Number(value) || 0;
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white px-4 py-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function tooltipStyle() {
  return {
    background: SURFACE,
    border: `1px solid ${GRID}`,
    borderRadius: 4,
    fontSize: 12,
    color: INK,
  };
}

export function CumulativeSpendChart({ data, money }: { data: CumulativePoint[]; money: (usd: number) => string }) {
  return (
    <ChartCard title="Spend trend" subtitle="Cumulative budget vs. what's actually been logged, day by day">
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="estimatedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#898781" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#898781" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(8)} tick={{ fontSize: 10, fill: MUTED }} axisLine={{ stroke: GRID }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => `$${v}`} />
          <Tooltip contentStyle={tooltipStyle()} formatter={(value, name) => [money(toNum(value)), name]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="cumulativeEstimatedUsd" name="Planned" stroke={MUTED} strokeWidth={2} fill="url(#estimatedFill)" dot={false} />
          <Line type="monotone" dataKey="cumulativeActualUsd" name="Actual so far" stroke="#2a78d6" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CategoryDonut({ data, money }: { data: CategoryBreakdown[]; money: (usd: number) => string }) {
  const chartData = data.map((row) => ({ ...row, value: row.actualUsd > 0 ? row.actualUsd : row.estimatedUsd }));
  return (
    <ChartCard title="Where the money goes" subtitle="By category — actual where logged, planned otherwise">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie data={chartData} dataKey="value" nameKey="label" cx="50%" cy="42%" innerRadius={56} outerRadius={88} paddingAngle={2} strokeWidth={2} stroke={SURFACE}>
            {chartData.map((row) => (
              <Cell key={row.category} fill={row.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle()} formatter={(value, _name, item) => [money(toNum(value)), item.payload.label]} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} layout="horizontal" align="center" verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function StatusDonut({ data }: { data: StatusBreakdown[] }) {
  const total = data.reduce((sum, row) => sum + row.count, 0);
  return (
    <ChartCard title="Itinerary status" subtitle={`${total} activities across the trip`}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2} strokeWidth={2} stroke={SURFACE}>
            {data.map((row) => (
              <Cell key={row.status} fill={row.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle()} formatter={(value, _name, item) => [toNum(value), item.payload.label]} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DaySpendBars({ data, money }: { data: DaySpend[]; money: (usd: number) => string }) {
  const chartData = data.map((row) => ({ ...row, shortDay: row.date.slice(8) }));
  return (
    <ChartCard title="Planned vs. actual, per day" subtitle="Each trip day's budget line next to what's actually been logged">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="shortDay" tick={{ fontSize: 10, fill: MUTED }} axisLine={{ stroke: GRID }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => `$${v}`} />
          <Tooltip contentStyle={tooltipStyle()} formatter={(value) => money(toNum(value))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="estimatedUsd" name="Planned" fill="#c3c2b7" radius={[3, 3, 0, 0]} />
          <Bar dataKey="actualUsd" name="Logged" fill="#2a78d6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CurrencyMixBars({ data }: { data: CurrencyMix[] }) {
  if (data.length === 0) return null;
  return (
    <ChartCard title="Currency mix" subtitle="What's actually been paid, by currency (USD-equivalent)">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
          <YAxis type="category" dataKey="currency" tick={{ fontSize: 12, fill: INK }} axisLine={false} tickLine={false} width={40} />
          <Tooltip contentStyle={tooltipStyle()} formatter={(value) => `$${toNum(value).toFixed(2)}`} />
          <Bar dataKey="usdEquivalent" fill="#1baf7a" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function VarianceList({ variances, money }: { variances: VarianceItem[]; money: (usd: number) => string }) {
  const top = variances.slice(0, 5);
  if (top.length === 0) return null;
  return (
    <div className="rounded-lg border border-black/10 bg-white px-4 py-4">
      <h3 className="text-sm font-semibold text-ink">Biggest surprises</h3>
      <p className="text-xs text-ink-muted">Items furthest from their planned estimate</p>
      <ul className="mt-3 flex flex-col gap-2">
        {top.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-ink">{item.label}</span>
            <span className={`shrink-0 font-medium tabular-nums ${item.varianceUsd > 0 ? "text-red-600" : "text-green-700"}`}>
              {item.varianceUsd > 0 ? "+" : ""}
              {money(item.varianceUsd)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
