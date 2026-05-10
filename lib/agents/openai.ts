import OpenAI from "openai";

export async function generateTurkishInsight(prompt: string, data: unknown) {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Sen Türkçe konuşan bir eğitim analisti asistansın. Sadece verilen JSON verisine dayan. Veri yoksa veya yetersizse açıkça 'Bu analiz için henüz yeterli veri yok.' de. Asla sayı, tarih, ders veya sonuç uydurma."
        },
        {
          role: "user",
          content: `${prompt}\n\nVeri:\n${JSON.stringify(data, null, 2)}`
        }
      ]
    });

    return response.choices[0]?.message.content?.trim() || null;
  } catch {
    return null;
  }
}
