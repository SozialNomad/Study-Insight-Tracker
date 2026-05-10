import { generateTurkishInsight } from "@/lib/agents/openai";
import type { TopicQuestionResult } from "@/lib/types/database";
import { formatDateTR } from "@/lib/utils";

export type TopicWeaknessReport = {
  weakTopics: {
    subject: string;
    topic: string;
    weaknessScore: number;
    trend: string[];
  }[];
  feedback: string;
};

export async function topicWeaknessAgent(
  rows: TopicQuestionResult[]
): Promise<TopicWeaknessReport | null> {
  if (rows.length === 0) return null;

  const grouped = rows.reduce<Record<string, TopicQuestionResult[]>>((acc, row) => {
    const key = `${row.subject}:::${row.topic}`;
    acc[key] = [...(acc[key] ?? []), row];
    return acc;
  }, {});

  const weakTopics = Object.values(grouped)
    .map((topicRows) => {
      const total = topicRows.reduce((sum, row) => sum + row.question_count, 0);
      const missed = topicRows.reduce((sum, row) => sum + row.wrong_count + row.empty_count, 0);
      const first = topicRows[0];

      return {
        subject: first.subject,
        topic: first.topic,
        weaknessScore: total ? Math.round((missed / total) * 100) : 0,
        trend: topicRows.map((row) => {
          const result = row.wrong_count > 0 ? "yanlış" : row.correct_count > 0 ? "doğru" : "boş";
          return `${formatDateTR(row.date)} tarihinde ${row.topic} ${result}`;
        })
      };
    })
    .sort((a, b) => b.weaknessScore - a.weaknessScore);

  const top = weakTopics[0];
  const fallbackFeedback = top
    ? `${top.topic} konusunda zayıflık skoru %${top.weaknessScore}. ${top.trend.join(", ")}.`
    : "Bu analiz için henüz yeterli veri yok.";

  const report = {
    weakTopics,
    feedback: fallbackFeedback
  };

  const aiFeedback = await generateTurkishInsight(
    "Konu bazlı soru sonuçlarına göre zayıflık ve kalıcılık problemlerini Türkçe yorumla.",
    report
  );

  return {
    ...report,
    feedback: aiFeedback || fallbackFeedback
  };
}
