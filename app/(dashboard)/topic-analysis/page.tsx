import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
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

type TopicAnalysisSearchParams = {
  q?: string;
};

export default async function TopicAnalysisPage({
  searchParams
}: {
  searchParams?: Promise<TopicAnalysisSearchParams>;
}) {
  const { profile } = await requireProfile();
  const params = searchParams ? await searchParams : {};
  const searchTerm = typeof params.q === "string" ? params.q.trim() : "";
  const supabase = await createClient();

  let query = supabase
    .from("topic_question_results")
    .select("*")
    .order("date", { ascending: true });

  if (!canSeeAll(profile)) query = query.eq("student_id", profile.id);

  const { data = [] } = await query;
  const rows = (data ?? []) as TopicQuestionResult[];
  const topicCards = analyzeTopics(rows, searchTerm);

  return (
    <>
      <PageHeader
        title="Deneme Konu Analizi"
        description="Yüklenen deneme konu analizlerinden hangi konularda yanlış yapıldığını izle."
      />

      <form method="get" className="mb-5 flex flex-col gap-3 rounded-2xl border bg-white/70 p-4 sm:flex-row">
        <Input
          name="q"
          defaultValue={searchTerm}
          placeholder="Konu, ders, deneme veya tarih ara"
          className="sm:max-w-md"
        />
        <Button type="submit">Ara</Button>
      </form>

      {topicCards.length === 0 ? (
        <EmptyState
          title={searchTerm ? "Aramayla eşleşen yanlış yok" : "Yanlış yapılan konu verisi yok"}
          description={
            searchTerm
              ? "Arama metnini değiştirerek tekrar deneyin."
              : "Deneme konu analizi görseli yüklendiğinde yanlış yapılan konular burada görünecek."
          }
        />
      ) : (
        <div className="space-y-5">
          {topicCards.map((topic) => (
            <Card key={`${topic.subject}-${topic.topic}`}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-3">
                  {topic.topic}
                  <Badge variant="secondary">{topic.subject}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deneme</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Sınav</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topic.attempts.map((attempt) => (
                      <TableRow key={attempt.key}>
                        <TableCell className="font-semibold">{attempt.examName}</TableCell>
                        <TableCell>{formatDateTR(attempt.date)}</TableCell>
                        <TableCell>{attempt.examType}</TableCell>
                        <TableCell className="font-semibold text-red-600">Yanlış</TableCell>
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

function analyzeTopics(rows: TopicQuestionResult[], searchTerm: string) {
  const normalizedSearch = normalizeSearch(searchTerm);
  const wrongRows = rows
    .map(normalizeTopicRowForDisplay)
    .filter((row): row is TopicQuestionResult => Boolean(row))
    .filter((row) => row.wrong_count > 0)
    .filter((row) => {
      if (!normalizedSearch) return true;

      const examName = row.source || `${row.exam_type} denemesi`;
      return normalizeSearch(
        [row.subject, row.topic, examName, row.exam_type, row.date, formatDateTR(row.date)].join(" ")
      ).includes(normalizedSearch);
    });

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
          }
        >
      >((acc, row) => {
        const examName = row.source || `${row.exam_type} denemesi`;
        const key = `${row.date}:::${row.exam_type}:::${examName}`;
        acc[key] ??= {
          key,
          date: row.date,
          examType: row.exam_type,
          examName
        };
        return acc;
      }, {})
    ).sort((a, b) => b.date.localeCompare(a.date));

    return {
      subject: first.subject,
      topic: first.topic,
      attempts
    };
  }).sort((a, b) => a.topic.localeCompare(b.topic, "tr"));
}

function normalizeTopicRowForDisplay(row: TopicQuestionResult): TopicQuestionResult | null {
  if (row.exam_type !== "AYT") return row;

  const subject = normalizeSearch(row.subject);
  if (subject.includes("tarih 2") || subject.includes("tarih-2")) return null;
  if (subject.includes("cografya 2") || subject.includes("cografya-2")) return null;
  if (subject.includes("edebiyat")) return { ...row, subject: "Edebiyat" };
  if (subject.includes("matematik")) return { ...row, subject: "Matematik" };
  if (subject === "tarih" || subject.includes("tarih 1") || subject.includes("tarih-1")) {
    return { ...row, subject: "Tarih-1" };
  }
  if (subject === "cografya" || subject.includes("cografya 1") || subject.includes("cografya-1")) {
    return { ...row, subject: "Coğrafya-1" };
  }

  return null;
}

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}
