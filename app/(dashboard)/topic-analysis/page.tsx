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
        title="Konu Analizi"
        description="Konu bazlı doğru/yanlış örüntülerini, zayıflık skorunu ve önerileri izle."
      />

      {topicCards.length === 0 ? (
        <EmptyState
          title="Konu analizi için henüz yeterli veri yok"
          description="Konu bazlı sonuçlar manuel girildiğinde veya görsel analizden üretildiğinde burada görünecek."
        />
      ) : (
        <div className="space-y-5">
          {topicCards.map((topic) => (
            <Card key={`${topic.subject}-${topic.topic}`}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-3">
                  {topic.topic}
                  <Badge variant="secondary">{topic.subject}</Badge>
                  <Badge variant={topic.weaknessScore >= 50 ? "default" : "outline"}>
                    Zayıflık skoru %{topic.weaknessScore}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{topic.recommendation}</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Sınav</TableHead>
                      <TableHead>Sonuç</TableHead>
                      <TableHead>Doğru/Yanlış/Boş</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topic.rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{formatDateTR(row.date)}</TableCell>
                        <TableCell>{row.exam_type}</TableCell>
                        <TableCell className="font-semibold">
                          {row.correct_count > row.wrong_count
                            ? "Doğru ağırlıklı"
                            : row.wrong_count > 0
                              ? "Yanlış sinyali"
                              : "Boş/eksik sinyali"}
                        </TableCell>
                        <TableCell>
                          {row.correct_count}/{row.wrong_count}/{row.empty_count}
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

function analyzeTopics(rows: TopicQuestionResult[]) {
  const grouped = rows.reduce<Record<string, TopicQuestionResult[]>>((acc, row) => {
    const key = `${row.subject}:::${row.topic}`;
    acc[key] = [...(acc[key] ?? []), row];
    return acc;
  }, {});

  return Object.values(grouped).map((topicRows) => {
    const first = topicRows[0];
    const total = topicRows.reduce((sum, row) => sum + row.question_count, 0);
    const weak = topicRows.reduce((sum, row) => sum + row.wrong_count + row.empty_count, 0);
    const weaknessScore = total > 0 ? Math.round((weak / total) * 100) : 0;
    const latest = topicRows[topicRows.length - 1];
    const earlierCorrect = topicRows.slice(0, -1).some((row) => row.correct_count > 0);
    const latestWrong = latest?.wrong_count > 0;

    return {
      subject: first.subject,
      topic: first.topic,
      weaknessScore,
      rows: topicRows,
      recommendation:
        earlierCorrect && latestWrong
          ? `${first.topic} konusunda önce doğru sinyali var, son kayıtta yanlış görülmüş. Bu tamamen unutma değil; kalıcılık için kısa tekrar ve 15-20 soru önerilir.`
          : weaknessScore >= 50
            ? `${first.topic} konusu riskli görünüyor. Önce kısa konu tekrarı, ardından yanlış defteri ve karma test önerilir.`
            : `${first.topic} konusu şu an makul ilerliyor. Aralıklı tekrar ile taze tutulmalı.`
    };
  });
}
