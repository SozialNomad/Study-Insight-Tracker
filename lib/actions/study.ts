"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type MutationResult = Promise<{ error: { message: string } | null }>;

const nullableNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
}, z.number().int().min(0).nullable());

const studySchema = z.object({
  date: z.string().min(1, "Tarih zorunlu."),
  exam_type: z.enum(["TYT", "AYT"]),
  subject: z.string().min(1, "Ders zorunlu."),
  topic: z.string().min(1, "Konu zorunlu."),
  activity_type: z.enum(["Konu Anlatımı", "Test Çözümü", "Deneme"]),
  resource_name: z.string().default(""),
  hours: z.preprocess((value) => Number(value || 0), z.number().int().min(0)),
  minutes: z.preprocess((value) => Number(value || 0), z.number().int().min(0).max(59)),
  total_questions: nullableNumber,
  solved_questions: nullableNumber,
  correct_answers: nullableNumber,
  wrong_answers: nullableNumber,
  empty_answers: nullableNumber,
  notes: z.string().nullable().optional()
});

export type StudyActionState = {
  error?: string;
};

export async function createStudySession(
  _prevState: StudyActionState,
  formData: FormData
): Promise<StudyActionState> {
  const parsed = studySchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Kayıt bilgilerini kontrol edin." };
  }

  const durationMinutes = parsed.data.hours * 60 + parsed.data.minutes;

  if (durationMinutes <= 0) {
    return { error: "Süre en az 1 dakika olmalı." };
  }

  const needsQuestions =
    parsed.data.activity_type === "Test Çözümü" || parsed.data.activity_type === "Deneme";

  if (needsQuestions && parsed.data.solved_questions === null) {
    return { error: "Test veya deneme için çözülen soru sayısı girilmeli." };
  }

  const { user } = await requireProfile();
  const supabase = await createClient();

  const studyTable = supabase.from("study_sessions") as unknown as {
    insert: (value: unknown) => MutationResult;
  };

  const { error } = await studyTable.insert({
    student_id: user.id,
    date: parsed.data.date,
    exam_type: parsed.data.exam_type,
    subject: parsed.data.subject,
    topic: parsed.data.topic,
    activity_type: parsed.data.activity_type,
    resource_name: parsed.data.resource_name,
    duration_minutes: durationMinutes,
    total_questions: parsed.data.total_questions,
    solved_questions: parsed.data.solved_questions,
    correct_answers: parsed.data.correct_answers,
    wrong_answers: parsed.data.wrong_answers,
    empty_answers: parsed.data.empty_answers,
    notes: parsed.data.notes || null
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/study/history");
  revalidatePath("/analytics");
  redirect("/study/history");
}
