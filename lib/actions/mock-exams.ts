"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireProfile } from "@/lib/auth";
import { SUBJECTS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

const mockExamSchema = z.object({
  date: z.string().min(1, "Tarih zorunlu."),
  exam_type: z.enum(["TYT", "AYT"]),
  exam_name: z.string().min(1, "Deneme adı zorunlu."),
  source: z.string().optional(),
  notes: z.string().optional()
});

export type MockExamActionState = {
  error?: string;
};

export async function createMockExam(
  _prevState: MockExamActionState,
  formData: FormData
): Promise<MockExamActionState> {
  const parsed = mockExamSchema.safeParse({
    date: formData.get("date"),
    exam_type: formData.get("exam_type"),
    exam_name: formData.get("exam_name"),
    source: formData.get("source") || "",
    notes: formData.get("notes") || ""
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Deneme bilgilerini kontrol edin." };
  }

  const subjectRows = SUBJECTS.map((subject) => ({
    subject,
    total_questions: numberField(formData, `${subject}_total`),
    correct_answers: numberField(formData, `${subject}_correct`),
    wrong_answers: numberField(formData, `${subject}_wrong`),
    empty_answers: numberField(formData, `${subject}_empty`)
  })).filter(
    (row) =>
      row.total_questions > 0 ||
      row.correct_answers > 0 ||
      row.wrong_answers > 0 ||
      row.empty_answers > 0
  );

  if (subjectRows.length === 0) {
    return { error: "En az bir ders için sonuç girilmeli." };
  }

  const { user } = await requireProfile();
  const supabase = await createClient();

  // Fetching sessions. Admins see everything, students see only their own.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: exam, error: examError } = await (supabase.from("mock_exams") as any)
    .insert({
      student_id: user.id,
      date: parsed.data.date,
      exam_type: parsed.data.exam_type,
      exam_name: parsed.data.exam_name,
      source: parsed.data.source || null,
      notes: parsed.data.notes || null
    })
    .select("id")
    .single();

  if (examError || !exam) {
    return { error: examError?.message ?? "Deneme kaydedilemedi." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: rowsError } = await (supabase.from("mock_exam_subject_results") as any).insert(
    subjectRows.map((row) => ({
      mock_exam_id: exam.id,
      ...row
    }))
  );

  if (rowsError) {
    return { error: rowsError.message };
  }

  revalidatePath("/mock-exams");
  revalidatePath("/mock-exams/analytics");
  redirect("/mock-exams");
}

export async function updateMockExam(
  examId: string,
  _prevState: MockExamActionState,
  formData: FormData
): Promise<MockExamActionState> {
  const parsed = mockExamSchema.safeParse({
    date: formData.get("date"),
    exam_type: formData.get("exam_type"),
    exam_name: formData.get("exam_name"),
    source: formData.get("source") || "",
    notes: formData.get("notes") || ""
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Deneme bilgilerini kontrol edin." };
  }

  const subjectRows = SUBJECTS.map((subject) => ({
    subject,
    total_questions: numberField(formData, `${subject}_total`),
    correct_answers: numberField(formData, `${subject}_correct`),
    wrong_answers: numberField(formData, `${subject}_wrong`),
    empty_answers: numberField(formData, `${subject}_empty`)
  })).filter(
    (row) =>
      row.total_questions > 0 ||
      row.correct_answers > 0 ||
      row.wrong_answers > 0 ||
      row.empty_answers > 0
  );

  if (subjectRows.length === 0) {
    return { error: "En az bir ders için sonuç girilmeli." };
  }

  const { user } = await requireProfile();
  const supabase = await createClient();

  // Update mock_exam
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: examError } = await (supabase.from("mock_exams") as any)
    .update({
      date: parsed.data.date,
      exam_type: parsed.data.exam_type,
      exam_name: parsed.data.exam_name,
      source: parsed.data.source || null,
      notes: parsed.data.notes || null
    })
    .eq("id", examId)
    .eq("student_id", user.id);

  if (examError) {
    return { error: examError.message };
  }

  // Delete old results and insert new ones
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("mock_exam_subject_results") as any).delete().eq("mock_exam_id", examId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: rowsError } = await (supabase.from("mock_exam_subject_results") as any).insert(
    subjectRows.map((row) => ({
      mock_exam_id: examId,
      ...row
    }))
  );

  if (rowsError) {
    return { error: rowsError.message };
  }

  revalidatePath("/mock-exams");
  revalidatePath("/mock-exams/analytics");
  redirect("/mock-exams");
}

export async function deleteMockExam(examId: string) {
  const { user } = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("mock_exams")
    .delete()
    .eq("id", examId)
    .eq("student_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/mock-exams");
  revalidatePath("/mock-exams/analytics");
}

function numberField(formData: FormData, name: string) {
  const value = formData.get(name);
  if (value === null || value === "") return 0;
  return Math.max(0, Number(value));
}
