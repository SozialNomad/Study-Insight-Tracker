"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createMockExam, type MockExamActionState } from "@/lib/actions/mock-exams";
import { EXAM_TYPES, SUBJECTS } from "@/lib/constants";
import { todayISO } from "@/lib/utils";

const initialState: MockExamActionState = {};

export function MockExamForm() {
  const [state, formAction, pending] = useActionState(createMockExam, initialState);
  const [scores, setScores] = useState<Record<string, { correct: number; wrong: number }>>({});

  function updateScore(subject: string, key: "correct" | "wrong", value: string) {
    setScores((current) => ({
      ...current,
      [subject]: {
        correct: current[subject]?.correct ?? 0,
        wrong: current[subject]?.wrong ?? 0,
        [key]: Number(value || 0)
      }
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deneme sonucu ekle</CardTitle>
        <CardDescription>
          Her ders için doğru, yanlış, boş ve toplam soru sayılarını gir; net otomatik hesaplanır.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tarih">
              <Input name="date" type="date" required defaultValue={todayISO()} />
            </Field>
            <Field label="Sınav Türü">
              <Select name="exam_type" required defaultValue="AYT">
                {EXAM_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </Select>
            </Field>
            <Field label="Deneme Adı">
              <Input name="exam_name" required placeholder="Örn. AYT Deneme 1" />
            </Field>
            <Field label="Kaynak">
              <Input name="source" placeholder="Örn. 345" />
            </Field>
          </div>

          <div className="overflow-hidden rounded-3xl border bg-white/55">
            <div className="grid grid-cols-[1.2fr_repeat(5,0.8fr)] gap-2 bg-muted px-4 py-3 text-xs font-black uppercase tracking-wide text-muted-foreground">
              <span>Ders</span>
              <span>Toplam</span>
              <span>Doğru</span>
              <span>Yanlış</span>
              <span>Boş</span>
              <span>Net</span>
            </div>
            {SUBJECTS.map((subject) => {
              const net = (scores[subject]?.correct ?? 0) - (scores[subject]?.wrong ?? 0) / 4;

              return (
                <div
                  key={subject}
                  className="grid grid-cols-[1.2fr_repeat(5,0.8fr)] gap-2 border-t px-4 py-3 text-sm"
                >
                  <span className="self-center font-bold">{subject}</span>
                  <Input name={`${subject}_total`} type="number" min={0} inputMode="numeric" />
                  <Input
                    name={`${subject}_correct`}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    onChange={(event) => updateScore(subject, "correct", event.target.value)}
                  />
                  <Input
                    name={`${subject}_wrong`}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    onChange={(event) => updateScore(subject, "wrong", event.target.value)}
                  />
                  <Input name={`${subject}_empty`} type="number" min={0} inputMode="numeric" />
                  <span className="self-center rounded-xl bg-primary/10 px-2 py-2 text-center font-black text-primary">
                    {net.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <Field label="Notlar">
            <Textarea name="notes" placeholder="Deneme sonrası kısa gözlem..." />
          </Field>

          {state.error ? (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
