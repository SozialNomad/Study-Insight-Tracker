import { PageHeader } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { canSeeAll, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mockExamAgent } from "@/lib/agents/mockExamAgent";
import { studyAnalyticsAgent } from "@/lib/agents/studyAnalyticsAgent";
import { topicWeaknessAgent } from "@/lib/agents/topicWeaknessAgent";
import type {
  MockExam,
  MockExamSubjectResult,
  StudySession,
  TopicQuestionResult
} from "@/lib/types/database";
import { minutesToHuman } from "@/lib/utils";

type MockExamWithResults = MockExam & {
  mock_exam_subject_results: MockExamSubjectResult[];
};

const notEnough = "Bu analiz için henüz yeterli veri yok.";

export default async function AIReportsPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  let studyQuery = supabase
    .from("study_sessions")
    .select("*")
    .order("date", { ascending: true });
  let mockQuery = supabase
    .from("mock_exams")
    .select("*, mock_exam_subject_results(*)")
    .order("date", { ascending: true });
  let topicQuery = supabase
    .from("topic_question_results")
    .select("*")
    .order("date", { ascending: true });

  if (!canSeeAll(profile)) {
    studyQuery = studyQuery.eq("student_id", profile.id);
    mockQuery = mockQuery.eq("student_id", profile.id);
    topicQuery = topicQuery.eq("student_id", profile.id);
  }

  const [{ data: studyData = [] }, { data: mockData = [] }, { data: topicData = [] }] =
    await Promise.all([studyQuery, mockQuery, topicQuery]);

  const studyReport = await studyAnalyticsAgent((studyData ?? []) as StudySession[]);
  const mockReport = await mockExamAgent((mockData ?? []) as MockExamWithResults[]);
  const topicReport = await topicWeaknessAgent((topicData ?? []) as TopicQuestionResult[]);

  return (
    <>
      <PageHeader
        title="AI Raporları"
        description="Ajanlar sadece mevcut veritabanı kayıtlarını analiz eder; veri yoksa uydurma yapmaz."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <ReportCard title="Günlük Çalışma Analizi">
          {studyReport ? (
            <>
              <Metric label="Tutarlılık" value={`%${studyReport.consistencyScore}`} />
              <p>{studyReport.feedback}</p>
            </>
          ) : (
            <p>{notEnough}</p>
          )}
        </ReportCard>

        <ReportCard title="Haftalık Çalışma Özeti">
          {studyReport ? (
            <>
              <Metric
                label="Toplam süre"
                value={minutesToHuman(studyReport.totalWeeklyStudyTime)}
              />
              <Metric
                label="Eksik gün"
                value={
                  studyReport.missingStudyDays.length
                    ? studyReport.missingStudyDays.length.toString()
                    : "Yok"
                }
              />
              <p className="text-sm text-muted-foreground">
                Ders dağılımı gerçek çalışma sürelerinden hesaplandı.
              </p>
            </>
          ) : (
            <p>{notEnough}</p>
          )}
        </ReportCard>

        <ReportCard title="Deneme Performans Analizi">
          {mockReport ? (
            <>
              <div className="flex flex-wrap gap-2">
                {mockReport.weakestSubjects.map((subject) => (
                  <Badge key={subject} variant="secondary">
                    {subject}
                  </Badge>
                ))}
              </div>
              <p>{mockReport.feedback}</p>
            </>
          ) : (
            <p>{notEnough}</p>
          )}
        </ReportCard>

        <ReportCard title="Konu Bazlı Zayıflık Raporu">
          {topicReport ? (
            <>
              <div className="space-y-2">
                {topicReport.weakTopics.slice(0, 3).map((topic) => (
                  <div key={`${topic.subject}-${topic.topic}`} className="rounded-2xl bg-muted p-3">
                    <p className="font-bold">{topic.topic}</p>
                    <p className="text-sm text-muted-foreground">
                      {topic.subject} · Zayıflık skoru %{topic.weaknessScore}
                    </p>
                  </div>
                ))}
              </div>
              <p>{topicReport.feedback}</p>
            </>
          ) : (
            <p>{notEnough}</p>
          )}
        </ReportCard>
      </div>
    </>
  );
}

function ReportCard({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6">{children}</CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
      <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}
