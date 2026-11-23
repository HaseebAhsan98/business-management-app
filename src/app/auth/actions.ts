"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types/database";

export interface LoginResult {
  error?: string;
  lockedUntil?: string;
}

export async function loginAction(formData: FormData): Promise<LoginResult | void> {
  const identifier = formData.get("identifier") as string;
  const password = formData.get("password") as string;
  const rememberMe = formData.get("rememberMe") === "on";

  if (!identifier || !password) {
    return { error: "Please enter your username/phone and password" };
  }

  const supabase = createClient();

  // If user identifier does not contain '@', append a dummy domain for Supabase auth email convention or query users
  const email = identifier.includes("@") 
    ? identifier 
    : `${identifier.replace(/[^a-zA-Z0-9]/g, "")}@app.internal`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message || "Invalid credentials" };
  }

  // Fetch user role from public.users profile
  const { data: profile } = await supabase
    .from("users")
    .select("role, is_active")
    .eq("id", data.user.id)
    .single();

  if (profile && !profile.is_active) {
    await supabase.auth.signOut();
    return { error: "This user account has been deactivated" };
  }

  const role: UserRole = profile?.role || "SALESMAN";

  // SDD §7.1: After login the user sees Dashboard (Owner/Manager) or New Order screen (Salesman)
  if (role === "SALESMAN") {
    redirect("/orders/new");
  } else {
    redirect("/dashboard");
  }
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
