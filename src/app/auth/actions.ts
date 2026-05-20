"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function redirectWithMessage(path: string, type: "error" | "message", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

function readRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getOrigin() {
  const headerStore = await headers();
  return headerStore.get("origin") ?? "http://localhost:3000";
}

export async function signUpAction(formData: FormData) {
  const supabase = await createClient();
  const displayName = readRequiredString(formData, "displayName");
  const email = readRequiredString(formData, "email");
  const password = readRequiredString(formData, "password");

  if (displayName.length < 2 || displayName.length > 40) {
    redirectWithMessage("/signup", "error", "Visningsnavn skal være mellem 2 og 40 tegn.");
  }

  if (!email || !password) {
    redirectWithMessage("/signup", "error", "Email og adgangskode er påkrævet.");
  }

  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`
    }
  });

  if (error) {
    redirectWithMessage("/signup", "error", "Kontoen kunne ikke oprettes. Prøv igen.");
  }

  if (data.session) {
    redirectWithMessage("/dashboard", "message", "Kontoen er oprettet. Velkommen til VM 2026.");
  }

  redirectWithMessage(
    "/login",
    "message",
    "Kontoen er oprettet. Tjek din email, hvis Supabase kræver bekræftelse."
  );
}

export async function loginAction(formData: FormData) {
  const supabase = await createClient();
  const email = readRequiredString(formData, "email");
  const password = readRequiredString(formData, "password");

  if (!email || !password) {
    redirectWithMessage("/login", "error", "Email og adgangskode er påkrævet.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirectWithMessage("/login", "error", "Email eller adgangskode er forkert.");
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirectWithMessage("/login", "message", "Du er logget ud.");
}

export async function resetPasswordAction(formData: FormData) {
  const supabase = await createClient();
  const email = readRequiredString(formData, "email");

  if (!email) {
    redirectWithMessage("/reset-password", "error", "Skriv din email.");
  }

  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`
  });

  if (error) {
    redirectWithMessage("/reset-password", "error", "Linket kunne ikke sendes. Prøv igen.");
  }

  redirectWithMessage(
    "/reset-password",
    "message",
    "Hvis emailen findes, sender Supabase et link til nulstilling."
  );
}

export async function updatePasswordAction(formData: FormData) {
  const supabase = await createClient();
  const password = readRequiredString(formData, "password");
  const confirmPassword = readRequiredString(formData, "confirmPassword");

  if (password.length < 8) {
    redirectWithMessage("/update-password", "error", "Adgangskoden skal være mindst 8 tegn.");
  }

  if (password !== confirmPassword) {
    redirectWithMessage("/update-password", "error", "Adgangskoderne er ikke ens.");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirectWithMessage("/login", "error", "Nulstillingslinket er udløbet. Prøv igen.");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirectWithMessage("/update-password", "error", "Adgangskoden kunne ikke opdateres.");
  }

  redirectWithMessage("/dashboard", "message", "Din adgangskode er opdateret.");
}
