import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
};

export async function getUserWithProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, supabase };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, is_admin, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: profile as Profile | null, supabase };
}

export async function requireUser() {
  const authState = await getUserWithProfile();

  if (!authState.user) {
    redirect("/login?message=Log ind for at fortsætte.");
  }

  return authState;
}

export async function requireAdmin() {
  const authState = await requireUser();

  if (!authState.profile?.is_admin) {
    redirect("/dashboard?error=Du har ikke adgang til admin.");
  }

  return authState;
}
