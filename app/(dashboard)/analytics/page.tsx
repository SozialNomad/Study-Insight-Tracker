import { subDays } from "date-fns";

import { StudyAnalyticsCharts } from "@/components/charts/study-analytics-charts";
import { PageHeader } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { canSeeAll, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { StudySession } from "@/lib/types/database";
import { getWeekdayTR } from "@/lib/utils";

export default async function AnalyticsPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("study_sessions")
    .select("*")
    .order("date", { ascending: true });

  if (!canSeeAll(profile)) query = query.eq("student_id", profile.id);

  const { data = [] } = await query;
  const sessions = (data ?? []) as StudySession[];

  const daily = lastNDays(7).map((date) => {
    const dateSessions = sessions.filter((session) => session.date === date);
    return {
      date,
      label: getWeekdayTR(date),
      soru: sum(dateSessions, (session) => session.solved_questions ?? 0),
      dakika: sum(dateSessions, (session) => session.duration_minutes)
    };
  });

  const subjectQuestions = groupBySubject(sessions, (session) => session.solved_questions ?? 0, "soru");
  const subjectWrongs = groupBySubject(sessions, (session) => session.wrong_answers ?? 0, "yanlış");
  const weekly = groupByWeek(sessions);
  const activityDistribution = Object.entries(
    sessions.reduce<Record<string, number>>((acc, session) => {
      acc[session.activity_type] = (acc[session.activity_type] ?? 0) + session.duration_minutes;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <>
      <PageHeader
        title="Analitik"
        description="Çözülen soru, süre, ders ve çalışma türü kırılımlarını grafiklerle izle."
      />

      {sessions.length === 0 ? (
        <EmptyState
          title="Grafikler için veri yok"
          description="Çalışma kaydı ekledikten sonra günlük ve haftalık grafikler burada görünecek."
        />
      ) : (
        <StudyAnalyticsCharts
          daily={daily}
          subjectQuestions={subjectQuestions}
          subjectWrongs={subjectWrongs}
          weekly={weekly}
          activityDistribution={activityDistribution}
        />
      )}
    </>
  );
}

function lastNDays(count: number) {
  return Array.from({ length: count }, (_, index) =>
    subDays(new Date(), count - index - 1).toISOString().slice(0, 10)
  );
}

function sum(items: StudySession[], selector: (item: StudySession) => number) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function groupBySubject(
  sessions: StudySession[],
  selector: (session: StudySession) => number,
  valueKey: string
) {
  const grouped = sessions.reduce<Record<string, number>>((acc, session) => {
    acc[session.subject] = (acc[session.subject] ?? 0) + selector(session);
    return acc;
  }, {});

  return Object.entries(grouped).map(([subject, value]) => ({
    subject,
    [valueKey]: value
  }));
}

function groupByWeek(sessions: StudySession[]) {
  const grouped = sessions.reduce<Record<string, number>>((acc, session) => {
    const week = `${new Date(`${session.date}T00:00:00`).getFullYear()}-${getWeekNumber(session.date)}`;
    acc[week] = (acc[week] ?? 0) + session.duration_minutes;
    return acc;
  }, {});

  return Object.entries(grouped).map(([week, minutes]) => ({
    week,
    saat: Number((minutes / 60).toFixed(1))
  }));
}

function getWeekNumber(date: string) {
  const current = new Date(`${date}T00:00:00`);
  const firstDay = new Date(current.getFullYear(), 0, 1);
  const pastDays = Math.floor((current.getTime() - firstDay.getTime()) / 86400000);
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}
