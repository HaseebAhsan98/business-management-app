"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { Supplier } from "@/types/database";

export async function getSuppliers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
  return data as Supplier[];
}

export async function saveSupplier(formData: FormData) {
  const supabase = createAdminClient();

  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const company = (formData.get("company") as string | null)?.trim() || null;
  const address = (formData.get("address") as string | null)?.trim() || null;
  const opening_balance = parseFloat((formData.get("opening_balance") as string) || "0");
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  if (!name) return { error: "Supplier name is required" };

  if (id) {
    const { error } = await supabase
      .from("suppliers")
      .update({
        name,
        phone,
        company,
        address,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("suppliers").insert({
      name,
      phone,
      company,
      address,
      opening_balance,
      current_balance: opening_balance,
      notes,
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/suppliers");
  return { success: true };
}
