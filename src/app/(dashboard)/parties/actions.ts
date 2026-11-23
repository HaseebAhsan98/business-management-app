"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { Customer, Area } from "@/types/database";

export async function getParties(filters?: {
  areaId?: string;
  search?: string;
  hasBalance?: boolean;
}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("customers")
    .select(`
      *,
      area:areas(id, name)
    `)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (filters?.areaId && filters.areaId !== "all") {
    query = query.eq("area_id", filters.areaId);
  }
  if (filters?.hasBalance) {
    query = query.gt("opening_balance_remaining", 0);
  }
  if (filters?.search) {
    const s = filters.search.trim().toLowerCase();
    query = query.or(`name.ilike.%${s}%,shop_name.ilike.%${s}%,party_code.ilike.%${s}%,phone.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching parties:", error);
    return [];
  }
  return data as Customer[];
}

export async function getAreas() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("areas").select("*").eq("is_active", true).order("name");
  if (error) return [];
  return data as Area[];
}

export async function checkDuplicateParty(name: string, area_id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("check_duplicate_customer", {
    p_name: name,
    p_area_id: area_id,
  });

  if (error) {
    console.error("Duplicate check error:", error);
    return [];
  }
  return data || [];
}

export async function saveParty(formData: FormData) {
  const supabase = createAdminClient();

  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const shop_name = formData.get("shop_name") as string;
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const address = (formData.get("address") as string | null)?.trim() || null;
  const area_id = formData.get("area_id") as string;
  const credit_days_limit = parseInt(formData.get("credit_days_limit") as string || "15", 10);
  const default_profit_per_carton = parseFloat(formData.get("default_profit_per_carton") as string || "40");
  const opening_balance = parseFloat(formData.get("opening_balance") as string || "0");
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  if (!name || !shop_name || !area_id) {
    return { error: "Name, shop name, and area are required" };
  }

  // Phone uniqueness check if provided (SDD §7.7)
  if (phone) {
    let phoneQuery = supabase.from("customers").select("id").eq("phone", phone);
    if (id) phoneQuery = phoneQuery.neq("id", id);
    const { data: phoneMatch } = await phoneQuery;
    if (phoneMatch && phoneMatch.length > 0) {
      return { error: "Phone number is already assigned to another party" };
    }
  }

  if (id) {
    const { error } = await supabase
      .from("customers")
      .update({
        name,
        shop_name,
        phone,
        address,
        area_id,
        credit_days_limit,
        default_profit_per_carton,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { error: error.message };
  } else {
    // Generate sequential party code P-XXXX
    const { count } = await supabase.from("customers").select("*", { count: "exact", head: true });
    const nextSeq = (count || 0) + 1;
    const party_code = `P-${String(nextSeq).padStart(4, "0")}`;

    const { error } = await supabase.from("customers").insert({
      party_code,
      name,
      shop_name,
      phone,
      address,
      area_id,
      credit_days_limit,
      default_profit_per_carton,
      opening_balance,
      opening_balance_remaining: opening_balance,
      notes,
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/parties");
  return { success: true };
}

export async function mergeParties(keepId: string, mergeId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("merge_customers", {
    p_keep_customer_id: keepId,
    p_merge_customer_id: mergeId,
    p_user_id: "00000000-0000-0000-0000-000000000000",
  });

  if (error) return { error: error.message };
  revalidatePath("/parties");
  return { success: true };
}

export async function getPartyDetails(id: string) {
  const supabase = createAdminClient();
  const { data: customer, error: custError } = await supabase
    .from("customers")
    .select(`*, area:areas(id, name)`)
    .eq("id", id)
    .single();

  if (custError || !customer) return null;

  // Price rules
  const { data: priceRules } = await supabase
    .from("customer_price_rules")
    .select("*, product:products(id, name, sku, last_purchase_rate_carton, sale_rate_carton)")
    .eq("customer_id", id);

  // Delivered Orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", id)
    .order("order_date", { ascending: false });

  // Payments
  const { data: payments } = await supabase
    .from("customer_payments")
    .select("*")
    .eq("customer_id", id)
    .order("payment_date", { ascending: false });

  return { customer, priceRules: priceRules || [], orders: orders || [], payments: payments || [] };
}

export async function saveCustomerPriceRule(
  customerId: string,
  productId: string,
  ruleType: "PROFIT_ON_COST" | "FIXED_RATE",
  amountPerCarton: number
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("customer_price_rules")
    .upsert({
      customer_id: customerId,
      product_id: productId,
      rule_type: ruleType,
      amount_per_carton: amountPerCarton,
      updated_at: new Date().toISOString(),
    });

  if (error) return { error: error.message };
  revalidatePath(`/parties/${customerId}`);
  return { success: true };
}
