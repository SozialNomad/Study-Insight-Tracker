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
import type { MockExam, MockExamSubjectResult } from "@/lib/types/database";
import { formatDateTR } from "@/lib/utils";

type MockExamWithResults = MockExam & {
  mock_exam_subject_results: MockExamSubjectResult[];
};

export default async function MockExamsPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("mock_exams")
    .select("*, mock_exam_subject_results(*)")
    .order("date", { ascending: false });

  if (!canSeeAll(profile)) query = query.eq("student_id", profile.id);

  const { data = [] } = await query;
  const exams = (data ?? []) as MockExamWithResults[];

  return (
    <>
      <PageHeader
        title="Denemeler"
        description="Kaydedilen denemeleri ders bazlı netlerle birlikte gör."
      />

      <div className="mb-4 flex justify-end">
        <Button asChild>
          <Link href="/mock-exams/new">Deneme Ekle</Link>
        </Button>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          title="Henüz deneme kaydı yok"
          description="İlk deneme girildiğinde net ve yanlış trendleri oluşmaya başlayacak."
        />
      ) : (
        <div className="space-y-5">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-3">
                  {exam.exam_name}
                  <Badge>{exam.exam_type}</Badge>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {formatDateTR(exam.date)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ders</TableHead>
                      <TableHead>Toplam</TableHead>
                      <TableHead>Doğru</TableHead>
                      <TableHead>Yanlış</TableHead>
                      <TableHead>Boş</TableHead>
                      <TableHead>Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exam.mock_exam_subject_results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-semibold">{result.subject}</TableCell>
                        <TableCell>{result.total_questions}</TableCell>
                        <TableCell>{result.correct_answers}</TableCell>
                        <TableCell>{result.wrong_answers}</TableCell>
                        <TableCell>{result.empty_answers}</TableCell>
                        <TableCell className="font-black">
                          {Number(result.net_score).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
