import { Badge } from "@/components/ui/badge";
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
import type { TopicQuestionResult } from "@/lib/types/database";
import { formatDateTR } from "@/lib/utils";

export default async function TopicAnalysisPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("topic_question_results")
    .select("*")
    .order("date", { ascending: true });

  if (!canSeeAll(profile)) query = query.eq("student_id", profile.id);

  const { data = [] } = await query;
  const rows = (data ?? []) as TopicQuestionResult[];
  const topicCards = analyzeTopics(rows);

  return (
    <>
      <PageHeader
        title="Deneme Konu Analizi"
        description="Yüklenen deneme konu analizlerinden hangi konularda yanlış yapıldığını izle."
      />

      {topicCards.length === 0 ? (
        <EmptyState
          title="Yanlış yapılan konu verisi yok"
          description="Deneme konu analizi görseli yüklendiğinde yanlış yapılan konular burada görünecek."
        />
      ) : (
        <div className="space-y-5">
          {topicCards.map((topic) => (
            <Card key={`${topic.subject}-${topic.topic}`}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-3">
                  {topic.topic}
                  <Badge variant="secondary">{topic.subject}</Badge>
                  <Badge variant="outline">{topic.totalWrong} yanlış</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deneme</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Sınav</TableHead>
                      <TableHead>Yanlış</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topic.attempts.map((attempt) => (
                      <TableRow key={attempt.key}>
                        <TableCell className="font-semibold">{attempt.examName}</TableCell>
                        <TableCell>{formatDateTR(attempt.date)}</TableCell>
                        <TableCell>{attempt.examType}</TableCell>
                        <TableCell>{attempt.wrongCount}</TableCell>
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

function analyzeTopics(rows: TopicQuestionResult[]) {
  const wrongRows = rows.filter((row) => row.wrong_count > 0);

  const grouped = wrongRows.reduce<Record<string, TopicQuestionResult[]>>((acc, row) => {
    const key = `${row.subject}:::${row.topic}`;
    acc[key] = [...(acc[key] ?? []), row];
    return acc;
  }, {});

  return Object.values(grouped).map((topicRows) => {
    const first = topicRows[0];
    const attempts = Object.values(
      topicRows.reduce<
        Record<
          string,
          {
            key: string;
            date: string;
            examType: string;
            examName: string;
            wrongCount: number;
          }
        >
      >((acc, row) => {
        const examName = row.source || `${row.exam_type} denemesi`;
        const key = `${row.date}:::${row.exam_type}:::${examName}`;
        acc[key] ??= {
          key,
          date: row.date,
          examType: row.exam_type,
          examName,
          wrongCount: 0
        };
        acc[key].wrongCount += row.wrong_count;
        return acc;
      }, {})
    ).sort((a, b) => b.date.localeCompare(a.date));
    const totalWrong = attempts.reduce((sum, attempt) => sum + attempt.wrongCount, 0);

    return {
      subject: first.subject,
      topic: first.topic,
      totalWrong,
      attempts
    };
  }).sort((a, b) => b.totalWrong - a.totalWrong || a.topic.localeCompare(b.topic, "tr"));
}
