"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { uploadImage, type UploadActionState } from "@/lib/actions/uploads";
import { IMAGE_TYPES } from "@/lib/constants";
import type { Profile } from "@/lib/types/database";

const initialState: UploadActionState = {};

export function UploadForm({
  profile,
  students
}: {
  profile: Profile;
  students: Profile[];
}) {
  const [state, formAction, pending] = useActionState(uploadImage, initialState);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Görsel yükle</CardTitle>
        <CardDescription>
          Deneme sonucu, konu analizi veya soru raporu ekran görüntüsünü sakla.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Öğrenci</Label>
            <Select name="student_id" defaultValue={profile.id} disabled={profile.role !== "admin"}>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name || student.id}
                </option>
              ))}
            </Select>
            {profile.role !== "admin" ? (
              <input type="hidden" name="student_id" value={profile.id} />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Görsel Türü</Label>
            <Select name="image_type" defaultValue="deneme_sonucu">
              {IMAGE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Görsel</Label>
            <Input
              name="image"
              type="file"
              accept="image/*"
              required
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
          </div>

          {preview ? (
            <div className="relative h-72 overflow-hidden rounded-3xl border bg-muted md:col-span-2">
              <Image
                src={preview}
                alt="Yükleme önizlemesi"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          ) : null}

          {state.error ? (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive md:col-span-2">
              {state.error}
            </p>
          ) : null}

          <div className="md:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Yükleniyor..." : "Yükle"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
