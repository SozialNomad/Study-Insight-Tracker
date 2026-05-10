"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteMockExam } from "@/lib/actions/mock-exams";

export function DeleteExamButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Bu denemeyi silmek istediğinize emin misiniz?")) return;

    setLoading(true);
    try {
      await deleteMockExam(id);
    } catch (error) {
      alert("Silme işlemi sırasında bir hata oluştu.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="icon"
      className="rounded-xl"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
