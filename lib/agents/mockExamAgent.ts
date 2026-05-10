import { generateTurkishInsight } from "@/lib/agents/openai";
import type { MockExam, MockExamSubjectResult } from "@/lib/types/database";
import { formatDateTR } from "@/lib/utils";

type MockExamWithResults = MockExam & {
  mock_exam_subject_results: MockExamSubjectResult[];
};

export type MockExamReport = {
  weakestSubjects: string[];
  subjectNetTrends: Record<string, { date: string; net: number }[]>;
  wrongAnswerTrends: Record<string, { date: string; wrong: number }[]>;
  feedback: string;
};

export async function mockExamAgent(
  exams: MockExamWithResults[]
): Promise<MockExamReport | null> {
  if (exams.length === 0) return null;

  const subjectNetTrends: MockExamReport["subjectNetTrends"] = {};
  const wrongAnswerTrends: MockExamReport["wrongAnswerTrends"] = {};

  exams.forEach((exam) => {
    exam.mock_exam_subject_results.forEach((result) => {
      subjectNetTrends[result.subject] = [
        ...(subjectNetTrends[result.subject] ?? []),
        { date: formatDateTR(exam.date), net: Number(result.net_score) }
      ];
      wrongAnswerTrends[result.subject] = [
        ...(wrongAnswerTrends[result.subject] ?? []),
        { date: formatDateTR(exam.date), wrong: result.wrong_answers }
      ];
    });
  });

  const weakestSubjects = Object.entries(wrongAnswerTrends)
    .map(([subject, rows]) => ({
      subject,
      wrong: rows.reduce((sum, row) => sum + row.wrong, 0)
    }))
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 3)
    .map((row) => row.subject);

  const firstSubject = Object.keys(subjectNetTrends)[0];
  const trend = firstSubject ? subjectNetTrends[firstSubject] : [];
  const fallbackFeedback =
    trend.length >= 2
      ? `${firstSubject} neti ${trend[0].date} tarihinde ${trend[0].net.toFixed(
          2
        )} iken son denemede ${trend[trend.length - 1].net.toFixed(2)} görünüyor.`
      : "Deneme analizi için daha fazla karşılaştırmalı veri faydalı olur.";

  const report = {
    weakestSubjects,
    subjectNetTrends,
    wrongAnswerTrends,
    feedback: fallbackFeedback
  };

  const aiFeedback = await generateTurkishInsight(
    "Deneme sonuçlarını analiz et. Net trendleri, yanlış trendleri ve zayıf dersleri kısa Türkçe yorumla.",
    report
  );

  return {
    ...report,
    feedback: aiFeedback || fallbackFeedback
  };
}
