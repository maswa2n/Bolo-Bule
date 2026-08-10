"use server";

import { createClient } from "@/lib/supabase/server";

type AdminSessionResult =
  | { userId: string; role: string }
  | { error: string };

export async function requireAdminSession(): Promise<AdminSessionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "Anda belum login. Buka /login terlebih dahulu, lalu coba lagi.",
    };
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message };
  }

  const profile = profileRow as { role: string } | null;
  const role = profile?.role ?? "learner";
  if (role !== "admin" && role !== "reviewer") {
    return {
      error: "Akun Anda tidak punya akses admin/reviewer. Daftar ulang sebagai user pertama atau minta admin menaikkan role.",
    };
  }

  return { userId: user.id, role };
}
