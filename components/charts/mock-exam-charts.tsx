"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Row = Record<string, string | number | null>;

const palette = ["#0f766e", "#ea580c", "#2563eb", "#be123c", "#ca8a04", "#4f46e5"];

export function MockExamCharts({
  netRows,
  wrongRows,
  emptyRows,
  subjects
}: {
  netRows: Row[];
  wrongRows: Row[];
  emptyRows: Row[];
  subjects: string[];
}) {
  return (
    <div className="grid gap-5">
      <ChartCard title="Derslere göre net değişimi">
        <TrendChart rows={netRows} subjects={subjects} />
      </ChartCard>
      <ChartCard title="Derslere göre yanlış değişimi">
        <TrendChart rows={wrongRows} subjects={subjects} />
      </ChartCard>
      <ChartCard title="Derslere göre boş değişimi">
        <TrendChart rows={emptyRows} subjects={subjects} />
      </ChartCard>
    </div>
  );
}

function TrendChart({ rows, subjects }: { rows: Row[]; subjects: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {subjects.map((subject, index) => (
          <Line
            key={subject}
            type="monotone"
            dataKey={subject}
            stroke={palette[index % palette.length]}
            strokeWidth={3}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
