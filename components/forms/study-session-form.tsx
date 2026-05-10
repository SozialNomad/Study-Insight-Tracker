"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ACTIVITY_TYPES, EXAM_TYPES, RESOURCE_SUGGESTIONS, SUBJECTS } from "@/lib/constants";
import { todayISO } from "@/lib/utils";
import { createStudySession, type StudyActionState } from "@/lib/actions/study";

const initialState: StudyActionState = {};

export function StudySessionForm() {
  const [activityType, setActivityType] = useState("Test Çözümü");
  const [state, formAction, pending] = useActionState(createStudySession, initialState);
  const showQuestions = activityType === "Test Çözümü" || activityType === "Deneme";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yeni çalışma kaydı</CardTitle>
        <CardDescription>
          Günlük çalışmayı birkaç net alanla kaydedelim; grafikler buradan beslenecek.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5 md:grid-cols-2">
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
          <Field label="Ders">
            <Input name="subject" list="subjects" required placeholder="Örn. Matematik" />
            <datalist id="subjects">
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject} />
              ))}
            </datalist>
          </Field>
          <Field label="Konu">
            <Input name="topic" required placeholder="Örn. Fonksiyonlar" />
          </Field>
          <Field label="Çalışma Türü">
            <Select
              name="activity_type"
              required
              value={activityType}
              onChange={(event) => setActivityType(event.target.value)}
            >
              {ACTIVITY_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </Select>
          </Field>
          <Field label="Kaynak">
            <Input name="resource_name" list="resources" placeholder="Örn. Bilgi Sarmalı" />
            <datalist id="resources">
              {RESOURCE_SUGGESTIONS.map((resource) => (
                <option key={resource} value={resource} />
              ))}
            </datalist>
          </Field>
          <Field label="Süre">
            <div className="grid grid-cols-2 gap-3">
              <Input name="hours" type="number" min={0} defaultValue={1} aria-label="Saat" />
              <Input name="minutes" type="number" min={0} max={59} defaultValue={0} aria-label="Dakika" />
            </div>
            <p className="text-xs text-muted-foreground">Saat ve dakika olarak girilir.</p>
          </Field>

          {showQuestions ? (
            <div className="grid gap-4 rounded-3xl border bg-muted/35 p-4 md:col-span-2 md:grid-cols-5">
              <Field label="Toplam Soru">
                <Input name="total_questions" type="number" min={0} />
              </Field>
              <Field label="Çözülen Soru">
                <Input name="solved_questions" type="number" min={0} required />
              </Field>
              <Field label="Doğru">
                <Input name="correct_answers" type="number" min={0} />
              </Field>
              <Field label="Yanlış">
                <Input name="wrong_answers" type="number" min={0} />
              </Field>
              <Field label="Boş">
                <Input name="empty_answers" type="number" min={0} />
              </Field>
            </div>
          ) : null}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea id="notes" name="notes" placeholder="Kısa gözlem, zorlanılan yer veya motivasyon notu..." />
          </div>

          {state.error ? (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive md:col-span-2">
              {state.error}
            </p>
          ) : null}

          <div className="md:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
