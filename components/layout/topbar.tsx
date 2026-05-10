import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export function PageHeader({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
          Study Insight
        </p>
        <h1 className="mt-2 font-serif text-4xl font-black tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      </div>
      <form
        action={async () => {
          "use server";
          const supabase = await createClient();
          await supabase.auth.signOut();
          redirect("/login");
        }}
      >
        <Button type="submit" variant="outline">
          Çıkış Yap
        </Button>
      </form>
    </div>
  );
}
