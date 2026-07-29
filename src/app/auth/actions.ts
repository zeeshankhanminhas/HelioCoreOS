"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function loginUrl(type: "error" | "message", message: string) {
  return `/login?${type}=${encodeURIComponent(message)}`;
}

function safeNextPath(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "/dashboard";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!email || !password) {
    redirect(loginUrl("error", "Enter your email address and password."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect(loginUrl("error", error?.message ?? "Unable to sign in."));
  }

  const { error: bootstrapError } = await supabase.rpc("bootstrap_current_user", {
    organisation_name: data.user.user_metadata?.organisation_name ?? null,
    user_full_name: data.user.user_metadata?.full_name ?? null,
  });

  if (bootstrapError) {
    await supabase.auth.signOut();
    redirect(loginUrl("error", "Your account is valid, but workspace setup failed. Apply the Sprint 1 auth migration and try again."));
  }

  redirect(next);
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const organisationName = String(formData.get("organisationName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !organisationName || !email || !password) {
    redirect(loginUrl("error", "Complete all account creation fields."));
  }

  if (password.length < 8) {
    redirect(loginUrl("error", "Use a password with at least 8 characters."));
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: {
        full_name: fullName,
        organisation_name: organisationName,
      },
    },
  });

  if (error) {
    redirect(loginUrl("error", error.message));
  }

  if (data.session && data.user) {
    const { error: bootstrapError } = await supabase.rpc("bootstrap_current_user", {
      organisation_name: organisationName,
      user_full_name: fullName,
    });

    if (bootstrapError) {
      redirect(loginUrl("error", "Account created, but workspace setup failed. Apply the Sprint 1 auth migration, then sign in."));
    }

    redirect("/dashboard");
  }

  redirect(loginUrl("message", "Account created. Check your email to confirm your address, then sign in."));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?message=You%20have%20been%20signed%20out.");
}
