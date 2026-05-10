import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return { user, profile: null };
  }

  return { user, profile: profile as Profile };
}

export async function requireProfile() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/login");
  if (!profile) redirect("/login?message=Profil bulunamadı");

  return { user, profile };
}

export function canSeeAll(profile: Profile) {
  return profile.role === "admin";
}
