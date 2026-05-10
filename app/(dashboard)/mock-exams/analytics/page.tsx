import { MockExamCharts } from "@/components/charts/mock-exam-charts";
import { PageHeader } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { canSeeAll, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { MockExam, MockExamSubjectResult } from "@/lib/types/database";
import { formatDateTR } from "@/lib/utils";

type MockExamWithResults = MockExam & {
  mock_exam_subject_results: MockExamSubjectResult[];
};

export default async function MockExamAnalyticsPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("mock_exams")
    .select("*, mock_exam_subject_results(*)")
    .order("date", { ascending: true });

  if (!canSeeAll(profile)) query = query.eq("student_id", profile.id);

  const { data = [] } = await query;
  const exams = (data ?? []) as MockExamWithResults[];
  const subjects = Array.from(
    new Set(exams.flatMap((exam) => exam.mock_exam_subject_results.map((row) => row.subject)))
  );

  const netRows = buildRows(exams, (row) => Number(row.net_score));
  const wrongRows = buildRows(exams, (row) => row.wrong_answers);
  const emptyRows = buildRows(exams, (row) => row.empty_answers);

  return (
    <>
      <PageHeader
        title="Deneme Analizi"
        description="Net, yanlış ve boş sayılarının zaman içindeki ders bazlı değişimi."
      />

      {exams.length === 0 ? (
        <EmptyState
          title="Deneme analizi için veri yok"
          description="Deneme sonucu ekledikten sonra ders bazlı trendler burada görünecek."
        />
      ) : (
        <MockExamCharts
          netRows={netRows}
          wrongRows={wrongRows}
          emptyRows={emptyRows}
          subjects={subjects}
        />
      )}
    </>
  );
}

function buildRows(
  exams: MockExamWithResults[],
  selector: (row: MockExamSubjectResult) => number
) {
  return exams.map((exam) => {
    const row: Record<string, string | number | null> = {
      date: formatDateTR(exam.date)
    };

    exam.mock_exam_subject_results.forEach((result) => {
      row[result.subject] = selector(result);
    });

    return row;
  });
}
