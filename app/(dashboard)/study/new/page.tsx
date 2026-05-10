import { PageHeader } from "@/components/layout/topbar";
import { StudySessionForm } from "@/components/forms/study-session-form";

export default function NewStudyPage() {
  return (
    <>
      <PageHeader
        title="Yeni Çalışma Kaydı"
        description="Konu, süre, kaynak ve soru sonuçlarını Türkçe alanlarla kaydet."
      />
      <StudySessionForm />
    </>
  );
}
