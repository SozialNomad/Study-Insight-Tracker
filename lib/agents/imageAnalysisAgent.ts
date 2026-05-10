export type ImageAnalysisResult = {
  status: "not_configured" | "queued" | "analyzed";
  detected_date?: string;
  exam_type?: string;
  subject?: string;
  topic?: string;
  question_counts?: {
    total?: number;
    correct?: number;
    wrong?: number;
    empty?: number;
  };
  performance_summary?: string;
  message: string;
};

export async function analyzeUploadedImageWithAI(
  imageUrl: string
): Promise<ImageAnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      status: "not_configured",
      message:
        "OPENAI_API_KEY olmadığı için görsel analizi çalıştırılmadı. Görsel yüklendi, metadata kaydedildi."
    };
  }

  return {
    status: "queued",
    message:
      "OpenAI Vision entegrasyonu için güvenli ajan yapısı hazır. Bu aşamada görselden veri üretimi otomatik yapılmıyor.",
    performance_summary: `Görsel yolu kaydedildi: ${imageUrl}`
  };
}
