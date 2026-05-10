import { notFound } from "next/navigation";

import { MockExamForm } from "@/components/forms/mock-exam-form";
import { PageHeader } from "@/components/layout/topbar";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { MockExam, MockExamSubjectResult } from "@/lib/types/database";

type MockExamWithResults = MockExam & {
  mock_exam_subject_results: MockExamSubjectResult[];
};

export default async function EditMockExamPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("mock_exams")
    .select("*, mock_exam_subject_results(*)")
    .eq("id", id)
    .eq("student_id", profile.id)
    .single();

  if (!exam) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title="Denemeyi Düzenle"
        description="Deneme bilgilerini ve ders bazlı netlerini güncelle."
      />
      <MockExamForm initialData={exam as MockExamWithResults} />
    </>
  );
}
