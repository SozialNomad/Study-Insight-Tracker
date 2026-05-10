import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/topbar";
import { ACTIVITY_TYPES, EXAM_TYPES, SUBJECTS } from "@/lib/constants";
import { canSeeAll, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { StudySession } from "@/lib/types/database";
import { formatDateTR, minutesToHuman } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function StudyHistoryPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("study_sessions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (!canSeeAll(profile)) query = query.eq("student_id", profile.id);
  if (stringParam(params.start)) query = query.gte("date", stringParam(params.start));
  if (stringParam(params.end)) query = query.lte("date", stringParam(params.end));
  if (stringParam(params.exam_type)) query = query.eq("exam_type", stringParam(params.exam_type));
  if (stringParam(params.subject)) query = query.eq("subject", stringParam(params.subject));
  if (stringParam(params.activity_type)) {
    query = query.eq("activity_type", stringParam(params.activity_type));
  }
  if (stringParam(params.resource_name)) {
    query = query.ilike("resource_name", `%${stringParam(params.resource_name)}%`);
  }

  const { data = [] } = await query;
  const sessions = (data ?? []) as StudySession[];
  const totalMinutes = sessions.reduce((sum, item) => sum + item.duration_minutes, 0);
  const totalQuestions = sessions.reduce((sum, item) => sum + (item.solved_questions ?? 0), 0);
  const totalCorrect = sessions.reduce((sum, item) => sum + (item.correct_answers ?? 0), 0);
  const totalWrong = sessions.reduce((sum, item) => sum + (item.wrong_answers ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Çalışma Geçmişi"
        description="Tarih, sınav türü, ders, çalışma türü ve kaynağa göre filtrele."
      />

      <Card className="mb-5">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3 xl:grid-cols-6">
          <FilterForm params={params} />
        </CardContent>
      </Card>

      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <SummaryCard label="Toplam süre" value={minutesToHuman(totalMinutes)} />
        <SummaryCard label="Çözülen soru" value={String(totalQuestions)} />
        <SummaryCard label="Doğru" value={String(totalCorrect)} />
        <SummaryCard label="Yanlış" value={String(totalWrong)} />
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="Bu filtrelerle kayıt yok"
          description="Filtreleri genişletmeyi veya yeni çalışma kaydı eklemeyi deneyebilirsin."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Sınav</TableHead>
                  <TableHead>Ders</TableHead>
                  <TableHead>Konu</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Kaynak</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Doğru/Yanlış/Boş</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{formatDateTR(session.date)}</TableCell>
                    <TableCell>
                      <Badge>{session.exam_type}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{session.subject}</TableCell>
                    <TableCell>{session.topic}</TableCell>
                    <TableCell>{session.activity_type}</TableCell>
                    <TableCell>{session.resource_name || "-"}</TableCell>
                    <TableCell>{minutesToHuman(session.duration_minutes)}</TableCell>
                    <TableCell>
                      {(session.correct_answers ?? "-")}/{(session.wrong_answers ?? "-")}/
                      {(session.empty_answers ?? "-")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function FilterForm({ params }: { params: Record<string, string | string[] | undefined> }) {
  return (
    <form className="contents">
      <Field label="Başlangıç">
        <Input name="start" type="date" defaultValue={stringParam(params.start)} />
      </Field>
      <Field label="Bitiş">
        <Input name="end" type="date" defaultValue={stringParam(params.end)} />
      </Field>
      <Field label="TYT / AYT">
        <Select name="exam_type" defaultValue={stringParam(params.exam_type)}>
          <option value="">Tümü</option>
          {EXAM_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </Select>
      </Field>
      <Field label="Ders">
        <Select name="subject" defaultValue={stringParam(params.subject)}>
          <option value="">Tümü</option>
          {SUBJECTS.map((subject) => (
            <option key={subject}>{subject}</option>
          ))}
        </Select>
      </Field>
      <Field label="Çalışma türü">
        <Select name="activity_type" defaultValue={stringParam(params.activity_type)}>
          <option value="">Tümü</option>
          {ACTIVITY_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </Select>
      </Field>
      <Field label="Kaynak">
        <Input name="resource_name" placeholder="Kaynak ara" defaultValue={stringParam(params.resource_name)} />
      </Field>
      <div className="md:col-span-3 xl:col-span-6">
        <Button type="submit">Filtrele</Button>
      </div>
    </form>
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-black">{value}</p>
      </CardContent>
    </Card>
  );
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
