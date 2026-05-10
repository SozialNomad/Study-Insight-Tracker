import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

export type TopicResult = {
  subject: string;
  topic: string;
  question_count: number;
  correct_count: number;
  wrong_count: number;
  empty_count: number;
};

export type ImageAnalysisResult = {
  status: "not_configured" | "error" | "analyzed";
  detected_type: "deneme_sonucu" | "konu_analizi" | "soru_raporu" | "unknown";
  topics?: TopicResult[];
  exam_summary?: {
    exam_name?: string;
    date?: string;
    exam_type?: "TYT" | "AYT";
  };
  message: string;
};

export async function analyzeUploadedImageWithAI(
  storagePath: string
): Promise<ImageAnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return {
      status: "not_configured",
      detected_type: "unknown",
      message: "OPENAI_API_KEY eksik olduğu için analiz yapılmadı."
    };
  }

  const supabase = await createClient();
  
  // Görseli Supabase Storage'dan indiriyoruz
  const { data, error } = await supabase.storage
    .from("student-uploads")
    .download(storagePath);

  if (error || !data) {
    return {
      status: "error",
      detected_type: "unknown",
      message: `Görsel indirilemedi: ${error?.message || "Bilinmeyen hata"}`
    };
  }

  // Blob -> Base64 dönüşümü
  const buffer = Buffer.from(await data.arrayBuffer());
  const base64Image = buffer.toString("base64");

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `Sen bir eğitim asistanısın. Öğrencilerin yüklediği deneme sonuçları, konu analiz tabloları veya soru çözüm raporlarını analiz edersin. 
          Çıktıyı SADECE JSON formatında vermelisin.
          JSON yapısı:
          {
            "detected_type": "deneme_sonucu" | "konu_analizi" | "soru_raporu" | "unknown",
            "message": "Analiz özeti",
            "topics": [
              {
                "subject": "Matematik",
                "topic": "Üslü Sayılar",
                "question_count": 10,
                "correct_count": 8,
                "wrong_count": 1,
                "empty_count": 1
              }
            ],
            "exam_summary": {
              "exam_name": "Deneme Adı",
              "date": "YYYY-MM-DD",
              "exam_type": "TYT" | "AYT"
            }
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Bu görseldeki verileri analiz et ve tabloları oku. Eğer görsel bir konu analizi ise 'topics' dizisini doldur. Eğer genel bir deneme sonucu ise 'exam_summary' kısmını doldur."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("AI'dan boş cevap geldi.");

    const result = JSON.parse(content);

    return {
      status: "analyzed",
      detected_type: result.detected_type || "unknown",
      topics: result.topics,
      exam_summary: result.exam_summary,
      message: result.message || "Analiz tamamlandı."
    };
  } catch (err: any) {
    return {
      status: "error",
      detected_type: "unknown",
      message: `AI Analiz hatası: ${err.message}`
    };
  }
}
