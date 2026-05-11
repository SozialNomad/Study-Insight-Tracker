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
  storagePath: string,
  selectedExamType: "TYT" | "AYT"
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
          content: `Sen bir eğitim asistanısın. Öğrencilerin yüklediği TYT/AYT deneme konu analizi görsellerini analiz edersin.
          Çıktıyı SADECE JSON formatında vermelisin.
          
          Görsel okuma kuralları:
          - Tablolarda DC doğru cevap, ÖC öğrencinin cevabı, SN sonuç anlamına gelir.
          - ÖC boş, "-", okunamıyor veya işaretlenmemişse o satırı topics dizisine hiç ekleme.
          - DC ve ÖC aynıysa correct_count 1, wrong_count 0, empty_count 0 yaz.
          - DC ve ÖC farklıysa correct_count 0, wrong_count 1, empty_count 0 yaz.
          - Her soru satırı için question_count 1 olmalı. Aynı konu birden çok kez gelirse ayrı satır olarak yazabilirsin.
          - Kullanıcının seçtiği sınav türü ${selectedExamType}. exam_summary.exam_type alanını mutlaka "${selectedExamType}" yaz.
          - AYT için sadece Edebiyat, Matematik, Tarih-1 ve Coğrafya-1 tablolarındaki satırları al. Fizik, Kimya, Biyoloji, Felsefe, Psikoloji, Seçmeli Felsefe, Tarih-2, Coğrafya-2 ve diğer dersleri kesinlikle alma.
          - AYT görselinde başlık sadece "Tarih" ise bunu Tarih-1, başlık sadece "Coğrafya" ise bunu Coğrafya-1 kabul et. "Tarih-2" ve "Coğrafya-2" başlıklarını alma.
          - TYT için Türkçe, Matematik, Sosyal ve Fen kapsamındaki satırları al. Sosyal altındaki Tarih, Coğrafya, Felsefe, Din Kültürü; Fen altındaki Fizik, Kimya, Biyoloji satırlarını kendi ders adlarıyla yaz.
          - Konu adlarını tabloda yazdığı gibi oku; çok uzunsa okunabilen anlamlı kısmı kullan.
          - Görsel bu formatta bir deneme konu analizi değilse detected_type "unknown" döndür ve topics boş olsun.
          
          JSON yapısı:
          {
            "detected_type": "deneme_sonucu" | "unknown",
            "message": "Analiz özeti",
            "topics": [
              {
                "subject": "Matematik",
                "topic": "Üslü Sayılar",
                "question_count": 1,
                "correct_count": 0,
                "wrong_count": 1,
                "empty_count": 0
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
              text: `Bu deneme konu analizi görselindeki tabloları oku. Kullanıcının seçtiği sınav türü ${selectedExamType}. Yalnızca bu sınav türü için desteklenen derslerden DC/ÖC karşılaştırması yapılabilen dolu öğrenci cevaplarını topics dizisine ekle.`
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
      exam_summary: {
        ...result.exam_summary,
        exam_type: selectedExamType
      },
      message: result.message || "Analiz tamamlandı."
    };
  } catch (err) {
    const error = err as Error;
    return {
      status: "error",
      detected_type: "unknown",
      message: `AI Analiz hatası: ${error.message}`
    };
  }
}
