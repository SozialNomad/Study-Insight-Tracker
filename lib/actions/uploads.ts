"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { analyzeUploadedImageWithAI } from "@/lib/agents/imageAnalysisAgent";
import { canSeeAll, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";


const uploadSchema = z.object({
  image_type: z.enum(["deneme_sonucu", "konu_analizi", "soru_raporu"]),
  student_id: z.string().uuid()
});

export type UploadActionState = {
  error?: string;
};

export async function uploadImage(
  _prevState: UploadActionState,
  formData: FormData
): Promise<UploadActionState> {
  const { user, profile } = await requireProfile();
  const parsed = uploadSchema.safeParse({
    image_type: formData.get("image_type"),
    student_id: formData.get("student_id") || user.id
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Görsel bilgilerini kontrol edin." };
  }

  if (parsed.data.student_id !== user.id && !canSeeAll(profile)) {
    return { error: "Bu öğrenci adına yükleme yetkiniz yok." };
  }

  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Lütfen bir görsel seçin." };
  }

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${parsed.data.student_id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from("student-uploads")
    .upload(path, file, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const aiAnalysis = await analyzeUploadedImageWithAI(path);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase.from("uploaded_images") as any).insert({
    student_id: parsed.data.student_id,
    uploaded_by: user.id,
    image_url: path,
    image_type: parsed.data.image_type,
    ai_analysis: aiAnalysis
  });

  if (insertError) {
    return { error: insertError.message };
  }

  // Eğer AI konu analizlerini bulduysa, bunları topic_question_results tablosuna da kaydet
  if (aiAnalysis.status === "analyzed" && aiAnalysis.topics && aiAnalysis.topics.length > 0) {
    const dateStr = aiAnalysis.exam_summary?.date || new Date().toISOString().split("T")[0];
    const examType = aiAnalysis.exam_summary?.exam_type || "TYT";

    const topicRows = aiAnalysis.topics.map((t) => ({
      student_id: parsed.data.student_id,
      date: dateStr,
      exam_type: examType,
      subject: t.subject,
      topic: t.topic,
      question_count: t.question_count,
      correct_count: t.correct_count,
      wrong_count: t.wrong_count,
      empty_count: t.empty_count,
      image_url: path,
      notes: "AI tarafından otomatik analiz edildi."
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("topic_question_results") as any).insert(topicRows);
  }

  revalidatePath("/upload");
  revalidatePath("/mock-exams/analytics");
  revalidatePath("/dashboard");
  redirect("/upload");
}
