"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export type SnapshotSeries = {
  name: string;
  isMe: boolean;
  data: { date: string; points: number }[];
};

// Build a combined dataset: one object per date, keyed by participant name.
function buildChartData(
  series: SnapshotSeries[]
): Record<string, string | number>[] {
  const allDates = Array.from(
    new Set(series.flatMap((s) => s.data.map((d) => d.date)))
  ).sort();

  return allDates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const s of series) {
      const point = s.data.find((d) => d.date === date);
      if (point !== undefined) row[s.name] = point.points;
    }
    return row;
  });
}

// Colour palette — cycles through pitch / cup tones + slate
const COLORS = [
  "#1a5e20", // pitch-700
  "#f5a623", // cup-500-ish
  "#64748b", // slate-500
  "#0ea5e9", // sky-500
  "#a855f7", // purple-500
  "#ef4444", // red-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
];

export function LeaderboardChart({ series }: { series: SnapshotSeries[] }) {
  if (series.length === 0 || series.every((s) => s.data.length === 0)) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <p className="text-sm font-semibold text-slate-400">
          Ikke nok data endnu — grafen vises, når der er mindst to daglige snapshots.
        </p>
      </div>
    );
  }

  const chartData = buildChartData(series);

  return (
    <ResponsiveContainer height={280} width="100%">
      <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -8 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 12,
            fontWeight: 600,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, fontWeight: 700 }}
          iconType="circle"
        />
        {series.map((s, i) => (
          <Line
            key={s.name}
            connectNulls
            dataKey={s.name}
            dot={false}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={s.isMe ? 3 : 1.5}
            strokeDasharray={s.isMe ? undefined : undefined}
            type="monotone"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
