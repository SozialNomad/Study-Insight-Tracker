"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { analyzeUploadedImageWithAI } from "@/lib/agents/imageAnalysisAgent";
import { canSeeAll, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type MutationResult = Promise<{ error: { message: string } | null }>;

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

  const imagesTable = supabase.from("uploaded_images") as unknown as {
    insert: (value: unknown) => MutationResult;
  };

  const { error: insertError } = await imagesTable.insert({
    student_id: parsed.data.student_id,
    uploaded_by: user.id,
    image_url: path,
    image_type: parsed.data.image_type,
    ai_analysis: aiAnalysis
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/upload");
  redirect("/upload");
}
