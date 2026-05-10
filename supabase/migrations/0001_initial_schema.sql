create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  exam_type text not null check (exam_type in ('TYT', 'AYT')),
  subject text not null,
  topic text not null,
  activity_type text not null check (activity_type in ('Konu Anlatımı', 'Test Çözümü', 'Deneme')),
  resource_name text not null default '',
  duration_minutes integer not null check (duration_minutes > 0),
  total_questions integer check (total_questions is null or total_questions >= 0),
  solved_questions integer check (solved_questions is null or solved_questions >= 0),
  correct_answers integer check (correct_answers is null or correct_answers >= 0),
  wrong_answers integer check (wrong_answers is null or wrong_answers >= 0),
  empty_answers integer check (empty_answers is null or empty_answers >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.mock_exams (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  exam_type text not null check (exam_type in ('TYT', 'AYT')),
  exam_name text not null,
  source text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.mock_exam_subject_results (
  id uuid primary key default gen_random_uuid(),
  mock_exam_id uuid not null references public.mock_exams(id) on delete cascade,
  subject text not null,
  total_questions integer not null check (total_questions >= 0),
  correct_answers integer not null check (correct_answers >= 0),
  wrong_answers integer not null check (wrong_answers >= 0),
  empty_answers integer not null check (empty_answers >= 0),
  net_score numeric generated always as (correct_answers - (wrong_answers::numeric / 4)) stored
);

create table if not exists public.topic_question_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  exam_type text not null,
  subject text not null,
  topic text not null,
  source text,
  question_count integer not null check (question_count >= 0),
  correct_count integer not null check (correct_count >= 0),
  wrong_count integer not null check (wrong_count >= 0),
  empty_count integer not null check (empty_count >= 0),
  image_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.uploaded_images (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  image_type text not null check (image_type in ('deneme_sonucu', 'konu_analizi', 'soru_raporu')),
  extracted_text text,
  ai_analysis jsonb,
  created_at timestamptz not null default now()
);

create index if not exists study_sessions_student_date_idx on public.study_sessions(student_id, date desc);
create index if not exists mock_exams_student_date_idx on public.mock_exams(student_id, date desc);
create index if not exists topic_question_results_student_topic_idx on public.topic_question_results(student_id, topic, date desc);
create index if not exists uploaded_images_student_idx on public.uploaded_images(student_id, created_at desc);

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), ''),
    'student'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.study_sessions enable row level security;
alter table public.mock_exams enable row level security;
alter table public.mock_exam_subject_results enable row level security;
alter table public.topic_question_results enable row level security;
alter table public.uploaded_images enable row level security;

create policy "Profiles are visible to self and admins"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Study sessions visible to owner and admins"
  on public.study_sessions for select
  using (student_id = auth.uid() or public.is_admin());

create policy "Students insert own study sessions"
  on public.study_sessions for insert
  with check (student_id = auth.uid() or public.is_admin());

create policy "Students update own study sessions"
  on public.study_sessions for update
  using (student_id = auth.uid() or public.is_admin())
  with check (student_id = auth.uid() or public.is_admin());

create policy "Mock exams visible to owner and admins"
  on public.mock_exams for select
  using (student_id = auth.uid() or public.is_admin());

create policy "Students insert own mock exams"
  on public.mock_exams for insert
  with check (student_id = auth.uid() or public.is_admin());

create policy "Mock result rows visible through exam access"
  on public.mock_exam_subject_results for select
  using (
    exists (
      select 1 from public.mock_exams
      where mock_exams.id = mock_exam_subject_results.mock_exam_id
        and (mock_exams.student_id = auth.uid() or public.is_admin())
    )
  );

create policy "Mock result rows insert through exam access"
  on public.mock_exam_subject_results for insert
  with check (
    exists (
      select 1 from public.mock_exams
      where mock_exams.id = mock_exam_subject_results.mock_exam_id
        and (mock_exams.student_id = auth.uid() or public.is_admin())
    )
  );

create policy "Topic results visible to owner and admins"
  on public.topic_question_results for select
  using (student_id = auth.uid() or public.is_admin());

create policy "Topic results insertable by owner and admins"
  on public.topic_question_results for insert
  with check (student_id = auth.uid() or public.is_admin());

create policy "Uploaded images visible to owner uploader and admins"
  on public.uploaded_images for select
  using (student_id = auth.uid() or uploaded_by = auth.uid() or public.is_admin());

create policy "Uploaded images insertable by uploader"
  on public.uploaded_images for insert
  with check (uploaded_by = auth.uid() and (student_id = auth.uid() or public.is_admin()));

insert into storage.buckets (id, name, public)
values ('student-uploads', 'student-uploads', false)
on conflict (id) do nothing;

create policy "Upload owners and admins can read files"
  on storage.objects for select
  using (
    bucket_id = 'student-uploads'
    and (
      owner = auth.uid()
      or public.is_admin()
    )
  );

create policy "Authenticated users can upload student files"
  on storage.objects for insert
  with check (
    bucket_id = 'student-uploads'
    and auth.role() = 'authenticated'
  );
