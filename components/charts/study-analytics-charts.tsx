"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartDatum = Record<string, string | number>;

const colors = ["#0f766e", "#ea580c", "#2563eb", "#ca8a04", "#be123c", "#4f46e5"];

export function StudyAnalyticsCharts({
  daily,
  subjectQuestions,
  subjectWrongs,
  weekly,
  activityDistribution
}: {
  daily: ChartDatum[];
  subjectQuestions: ChartDatum[];
  subjectWrongs: ChartDatum[];
  weekly: ChartDatum[];
  activityDistribution: ChartDatum[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Günlük çözülen soru">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="soru" stroke="#0f766e" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Günlük çalışma süresi">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="dakika" fill="#ea580c" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Derse göre çözülen soru">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={subjectQuestions}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="soru" fill="#2563eb" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Derse göre yanlış sayısı">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={subjectWrongs}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="yanlış" fill="#be123c" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Haftalık çalışma süresi">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={weekly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="saat" fill="#0f766e" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Çalışma türü dağılımı">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={activityDistribution} dataKey="value" nameKey="name" outerRadius={96} label>
              {activityDistribution.map((_, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
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
