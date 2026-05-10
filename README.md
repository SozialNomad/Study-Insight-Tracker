# Study Insight Tracker

Türkçe arayüzlü, Next.js App Router tabanlı öğrenci çalışma takip paneli.

## Özellikler

- Supabase Auth ile e-posta/şifre girişi
- `student` ve `admin` rolleri için RLS destekli veri erişimi
- Günlük çalışma kaydı ekleme
- Çalışma geçmişi, filtreler ve toplamlar
- Dashboard özet kartları
- Recharts ile çalışma ve soru analitiği
- Deneme sonucu ekleme, ders bazlı net hesaplama ve trend grafikleri
- Konu bazlı zayıflık analizi
- Supabase Storage ile görsel yükleme ve önizleme
- Veri uydurmayan AI rapor ajanları

## Teknoloji

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui tarzı yerel UI bileşenleri
- Supabase PostgreSQL, Auth, Storage
- Recharts
- OpenAI SDK

## Kurulum

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` dosyasını doldurun:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

`SUPABASE_SERVICE_ROLE_KEY` sadece sunucu tarafı bakım işleri için ayrılmıştır; istemciye gönderilmez.

## Veritabanı

Supabase SQL Editor veya Supabase CLI ile şu migration dosyasını çalıştırın:

```bash
supabase/migrations/0001_initial_schema.sql
```

Migration şunları oluşturur:

- `profiles`
- `study_sessions`
- `mock_exams`
- `mock_exam_subject_results`
- `topic_question_results`
- `uploaded_images`
- `student-uploads` private Storage bucket
- RLS politikaları

Yeni kayıt olan kullanıcılar varsayılan olarak `student` rolüyle profil alır. Admin yapmak için Supabase SQL Editor üzerinden ilgili profili güncelleyin:

```sql
update public.profiles
set role = 'admin'
where id = 'USER_UUID';
```

## AI Raporları

Ajanlar `lib/agents` altında bulunur:

- `studyAnalyticsAgent.ts`
- `mockExamAgent.ts`
- `topicWeaknessAgent.ts`
- `imageAnalysisAgent.ts`

Raporlar yalnızca mevcut veritabanı kayıtlarına dayanır. Veri yoksa şu mesaj gösterilir:

```text
Bu analiz için henüz yeterli veri yok.
```

`OPENAI_API_KEY` yoksa ajanlar güvenli deterministik özetlerle çalışır. Görsel analiz ajanı şimdilik placeholder olarak metadata kaydeder; Vision çıkarımı otomatik veri üretmez.

## Vercel

Projeyi Vercel’e bağladıktan sonra aynı environment variable değerlerini Vercel Project Settings içinde tanımlayın. Supabase migration çalıştırılmış olmalı.
