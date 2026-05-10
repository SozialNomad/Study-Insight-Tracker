import { generateTurkishInsight } from "@/lib/agents/openai";
import type { StudySession } from "@/lib/types/database";
import { getWeekdayTR, minutesToHuman } from "@/lib/utils";

export type StudyAnalyticsReport = {
  totalWeeklyStudyTime: number;
  dailySolvedQuestionCount: Record<string, number>;
  subjectDistribution: Record<string, number>;
  missingStudyDays: string[];
  consistencyScore: number;
  feedback: string;
};

export async function studyAnalyticsAgent(
  sessions: StudySession[]
): Promise<StudyAnalyticsReport | null> {
  if (sessions.length === 0) return null;

  const lastSevenDays = getLastSevenDays();
  const weeklySessions = sessions.filter((session) => lastSevenDays.includes(session.date));
  const dailySolvedQuestionCount = Object.fromEntries(
    lastSevenDays.map((date) => [
      date,
      weeklySessions
        .filter((session) => session.date === date)
        .reduce((sum, session) => sum + (session.solved_questions ?? 0), 0)
    ])
  );
  const subjectDistribution = weeklySessions.reduce<Record<string, number>>((acc, session) => {
    acc[session.subject] = (acc[session.subject] ?? 0) + session.duration_minutes;
    return acc;
  }, {});
  const missingStudyDays = lastSevenDays.filter(
    (date) => !weeklySessions.some((session) => session.date === date)
  );
  const totalWeeklyStudyTime = weeklySessions.reduce(
    (sum, session) => sum + session.duration_minutes,
    0
  );
  const consistencyScore = Math.round(
    ((lastSevenDays.length - missingStudyDays.length) / lastSevenDays.length) * 100
  );

  const strongestSubject = Object.entries(subjectDistribution).sort((a, b) => b[1] - a[1])[0]?.[0];
  const fallbackFeedback = strongestSubject
    ? `Bu hafta ${strongestSubject} çalışması öne çıkıyor. Eksik günler: ${
        missingStudyDays.map(getWeekdayTR).join(", ") || "yok"
      }. Toplam çalışma süresi ${minutesToHuman(totalWeeklyStudyTime)}.`
    : "Bu analiz için henüz yeterli veri yok.";

  const report = {
    totalWeeklyStudyTime,
    dailySolvedQuestionCount,
    subjectDistribution,
    missingStudyDays,
    consistencyScore,
    feedback: fallbackFeedback
  };

  const aiFeedback = await generateTurkishInsight(
    "Günlük çalışma kayıtlarından kısa, destekleyici ve aksiyon odaklı Türkçe geri bildirim üret.",
    report
  );

  return {
    ...report,
    feedback: aiFeedback || fallbackFeedback
  };
}

function getLastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
}
