import { MockExamForm } from "@/components/forms/mock-exam-form";
import { PageHeader } from "@/components/layout/topbar";

export default function NewMockExamPage() {
  return (
    <>
      <PageHeader
        title="Deneme Ekle"
        description="TYT veya AYT deneme sonuçlarını ders bazında kaydet."
      />
      <MockExamForm />
    </>
  );
}
