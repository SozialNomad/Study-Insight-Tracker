import Image from "next/image";

import { UploadForm } from "@/components/forms/upload-form";
import { PageHeader } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { canSeeAll, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Json, Profile, UploadedImage } from "@/lib/types/database";
import { formatDateTR } from "@/lib/utils";

type ImageWithSignedUrl = UploadedImage & {
  signedUrl: string | null;
};

type AIAnalysisSummary = {
  status?: string;
  message?: string;
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
        title="Deneme Görseli Yükle"
        description="TYT veya AYT deneme konu analizi ekran görüntüsünü yükle."
      />

      <UploadForm profile={profile} students={students} />

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-black">Yüklenen deneme görselleri</h2>
        {images.length === 0 ? (
          <EmptyState
            title="Henüz deneme görseli yok"
            description="Yüklenen deneme konu analizi görselleri burada listelenecek."
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="secondary">{image.image_type}</Badge>
          <span className="text-sm text-muted-foreground">
            {formatDateTR(image.created_at)}
          </span>
        </div>

        {getAIAnalysisSummary(image.ai_analysis) ? (
          <div className="mt-3 rounded-xl bg-muted/50 p-3 text-xs">
            <div className="mb-1 flex items-center gap-2 font-bold">
              <span>AI Analizi:</span>
              <AIStatusBadge status={getAIAnalysisSummary(image.ai_analysis)?.status} />
            </div>
            <p className="text-muted-foreground italic">
              {getAIAnalysisSummary(image.ai_analysis)?.message || "Mesaj yok."}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function getAIAnalysisSummary(value: Json | null): AIAnalysisSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  return {
    status: typeof value.status === "string" ? value.status : undefined,
    message: typeof value.message === "string" ? value.message : undefined
  };
}

function AIStatusBadge({ status }: { status?: string }) {
  switch (status) {
    case "analyzed":
      return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none px-2 py-0 h-5 text-[10px]">Tamamlandı</Badge>;
    case "error":
      return <Badge variant="outline" className="border-red-200 px-2 py-0 h-5 text-[10px] text-red-600">Hata</Badge>;
    case "not_configured":
      return <Badge variant="outline" className="px-2 py-0 h-5 text-[10px]">Yapılandırılmadı</Badge>;
    default:
      return <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px]">Bilinmiyor</Badge>;
  }
}
