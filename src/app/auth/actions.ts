"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

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

  const { error } = await auth.signIn.email({ email, password });

  if (error) {
    redirect(loginUrl("error", error.message || "Unable to sign in."));
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

  const { error } = await auth.signUp.email({
    email,
    password,
    name: fullName,
  });

  if (error) {
    redirect(loginUrl("error", error.message || "Unable to create account."));
  }

  const query = new URLSearchParams({
    organisationName,
    fullName,
  });
  redirect(`/auth/bootstrap?${query.toString()}`);
}

export async function signOut() {
  await auth.signOut();
  redirect("/login?message=You%20have%20been%20signed%20out.");
}
