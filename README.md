# Study Insight Tracker

A student study tracking dashboard based on Next.js App Router with a Turkish interface.

## Features

- Email/Password login with Supabase Auth
- RLS-supported data access for `student` and `admin` roles
- Daily study session logging
- Study history, filters, and totals
- Dashboard summary cards
- Study and question analytics with Recharts
- Mock exam entry, subject-based net score calculation, and trend charts
- Topic-based weakness analysis
- Image upload and preview with Supabase Storage
- AI analysis agents for data-driven insights (No hallucination)
- **Automatic AI Image Analysis:** Automatically extracts topic data from uploaded analysis tables using OpenAI Vision.

## Technology Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Local UI components (shadcn/ui style)
- Supabase PostgreSQL, Auth, Storage
- Recharts
- OpenAI SDK

## Installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in the `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
```

`SUPABASE_SERVICE_ROLE_KEY` is reserved for server-side maintenance and is never sent to the client.

## Database Setup

Run the migration file using the Supabase SQL Editor or Supabase CLI:

```bash
supabase/migrations/0001_initial_schema.sql
```

The migration creates:

- `profiles`
- `study_sessions`
- `mock_exams`
- `mock_exam_subject_results`
- `topic_question_results`
- `uploaded_images`
- `student-uploads` private Storage bucket
- RLS policies

New users receive the `student` role by default. To make a user an admin, update their profile via the Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = 'USER_UUID';
```

## AI Agents

Agents are located under `lib/agents`:

- `studyAnalyticsAgent.ts`
- `mockExamAgent.ts`
- `topicWeaknessAgent.ts`
- `imageAnalysisAgent.ts` (Vision Analysis)

Reports are based strictly on database records. If no data is available, the following message is shown:

```text
Not enough data for this analysis yet.
```

If `OPENAI_API_KEY` is missing, agents work with safe deterministic summaries. The image analysis agent automatically extracts data into the `topic_question_results` table when configured with OpenAI Vision.

## Deployment on Vercel

After connecting the project to Vercel, define the same environment variable values in the Vercel Project Settings. Ensure the Supabase migration has been executed.
