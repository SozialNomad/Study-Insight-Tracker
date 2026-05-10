import Image from "next/image";

import { UploadForm } from "@/components/forms/upload-form";
import { PageHeader } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { canSeeAll, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UploadedImage } from "@/lib/types/database";
import { formatDateTR } from "@/lib/utils";

type ImageWithSignedUrl = UploadedImage & {
  signedUrl: string | null;
};

export default async function UploadPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const students = await getStudents(profile);

  let query = supabase
    .from("uploaded_images")
    .select("*")
    .order("created_at", { ascending: false });

  if (!canSeeAll(profile)) query = query.eq("student_id", profile.id);

  const { data = [] } = await query;
  const images = await Promise.all(
    ((data ?? []) as UploadedImage[]).map(async (image) => {
      const { data: signed } = await supabase.storage
        .from("student-uploads")
        .createSignedUrl(image.image_url, 60 * 30);

      return {
        ...image,
        signedUrl: signed?.signedUrl ?? null
      };
    })
  );

  return (
    <>
      <PageHeader
        title="Görsel Yükle"
        description="Soru raporu ve deneme ekran görüntülerini sakla; AI analizi için güvenli zemin hazır."
      />

      <UploadForm profile={profile} students={students} />

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-black">Yüklenen görseller</h2>
        {images.length === 0 ? (
          <EmptyState
            title="Henüz görsel yok"
            description="Yüklenen görseller burada önizleme kartları olarak listelenecek."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {images.map((image) => (
              <ImageCard key={image.id} image={image} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

async function getStudents(profile: Profile) {
  if (!canSeeAll(profile)) return [profile];

  const supabase = await createClient();
  const { data = [] } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("full_name", { ascending: true });

  return (data ?? []) as Profile[];
}

function ImageCard({ image }: { image: ImageWithSignedUrl }) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="relative h-56 overflow-hidden rounded-2xl bg-muted">
          {image.signedUrl ? (
            <Image src={image.signedUrl} alt="Yüklenen görsel" fill className="object-contain" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Önizleme oluşturulamadı
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary">{image.image_type}</Badge>
          <span className="text-sm text-muted-foreground">
            {formatDateTR(image.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
