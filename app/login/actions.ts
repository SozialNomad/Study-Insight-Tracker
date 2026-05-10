"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

type MutationResult = Promise<{ error: { message: string } | null }>;

const authSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı."),
  full_name: z.string().optional()
});

export type AuthActionState = {
  error?: string;
};

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Bilgileri kontrol edin." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Giriş başarısız. E-posta veya şifreyi kontrol edin." };
  }

  redirect("/dashboard");
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name") || ""
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Bilgileri kontrol edin." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name
      }
    }
  });

  if (error) {
    return { error: "Kayıt başarısız. Bu e-posta zaten kullanılıyor olabilir." };
  }

  if (data.user) {
    const profilesTable = supabase.from("profiles") as unknown as {
      upsert: (value: unknown) => MutationResult;
    };

    await profilesTable.upsert({
      id: data.user.id,
      full_name: parsed.data.full_name || parsed.data.email.split("@")[0],
      role: "student"
    });
  }

  redirect("/dashboard");
}
