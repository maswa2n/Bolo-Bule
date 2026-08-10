"use server";

import { createClient } from "@/lib/supabase/server";

export async function ensureProfileAction() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sesi login tidak ditemukan." };
  }

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    return { error: selectError.message };
  }

  const existingProfile = existing as { id: string; role: string } | null;
  if (existingProfile) {
    return { ok: true, role: existingProfile.role };
  }

  const { count, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("role", ["admin", "reviewer"]);

  if (countError) {
    return { error: countError.message };
  }

  const role = (count ?? 0) === 0 ? "admin" : "learner";
  const fullName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User";

  const { error: insertError } = await supabase.from("profiles").insert({
    id: user.id,
    full_name: fullName,
    role,
  } as never);

  if (insertError) {
    return { error: insertError.message };
  }

  return { ok: true, role };
}

export async function getSessionUserAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, role: null };
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRow as { role: string; full_name: string | null } | null;

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      fullName: profile?.full_name ?? user.email ?? "User",
    },
    role: profile?.role ?? "learner",
  };
}
