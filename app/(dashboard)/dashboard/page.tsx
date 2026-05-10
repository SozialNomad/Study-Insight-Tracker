import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/topbar";
import { canSeeAll, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { StudySession } from "@/lib/types/database";
import { formatDateTR, getWeekStartISO, minutesToHuman, todayISO } from "@/lib/utils";

export default async function DashboardPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const today = todayISO();
  const weekStart = getWeekStartISO();

  let query = supabase
    .from("study_sessions")
    .select("*")
    .gte("date", weekStart)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (!canSeeAll(profile)) {
    query = query.eq("student_id", profile.id);
  }

  const { data: weekSessions = [] } = await query;

  let recentQuery = supabase
    .from("study_sessions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(8);

  if (!canSeeAll(profile)) {
    recentQuery = recentQuery.eq("student_id", profile.id);
  }

  const { data: recentSessions = [] } = await recentQuery;

  const sessions = (weekSessions ?? []) as StudySession[];
  const recent = (recentSessions ?? []) as StudySession[];
  const todaySessions = sessions.filter((session) => session.date === today);
  const subjectDurations = sumBy(sessions, "subject", (session) => session.duration_minutes);
  const subjectWrongs = sumBy(sessions, "subject", (session) => session.wrong_answers ?? 0);

  const mostStudiedSubject = getMaxKey(subjectDurations);
  const weakestSubject = getMaxKey(subjectWrongs);

  const stats = [
    {
      label: "Bugünkü çalışma",
      value: minutesToHuman(sum(todaySessions, (session) => session.duration_minutes)),
      hint: "Toplam süre"
    },
    {
      label: "Bu hafta çalışma",
      value: minutesToHuman(sum(sessions, (session) => session.duration_minutes)),
      hint: "Pazartesiden bugüne"
    },
    {
      label: "Bugünkü soru",
      value: String(sum(todaySessions, (session) => session.solved_questions ?? 0)),
      hint: "Çözülen soru"
    },
    {
      label: "Bu hafta soru",
      value: String(sum(sessions, (session) => session.solved_questions ?? 0)),
      hint: "Çözülen soru"
    },
    {
      label: "En çok çalışılan ders",
      value: mostStudiedSubject || "Veri yok",
      hint: "Bu hafta"
    },
    {
      label: "Zayıf sinyal",
      value: weakestSubject || "Veri yok",
      hint: "Yanlış sayısına göre"
    }
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Bugün, bu hafta ve son çalışma kayıtlarının hızlı özeti."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">Son çalışma kayıtları</h2>
          <Button asChild variant="outline">
            <Link href="/study/new">Yeni Kayıt</Link>
          </Button>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="Henüz çalışma kaydı yok"
            description="İlk kayıt eklendiğinde dashboard kartları ve grafikler dolmaya başlayacak."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Ders</TableHead>
                    <TableHead>Konu</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Süre</TableHead>
                    <TableHead>Soru</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{formatDateTR(session.date)}</TableCell>
                      <TableCell className="font-semibold">{session.subject}</TableCell>
                      <TableCell>{session.topic}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{session.activity_type}</Badge>
                      </TableCell>
                      <TableCell>{minutesToHuman(session.duration_minutes)}</TableCell>
                      <TableCell>{session.solved_questions ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </>
  );
}

function sum(items: StudySession[], selector: (item: StudySession) => number) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function sumBy(
  items: StudySession[],
  key: keyof Pick<StudySession, "subject" | "activity_type">,
  selector: (item: StudySession) => number
) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[String(item[key])] = (acc[String(item[key])] ?? 0) + selector(item);
    return acc;
  }, {});
}

function getMaxKey(values: Record<string, number>) {
  return Object.entries(values).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}
