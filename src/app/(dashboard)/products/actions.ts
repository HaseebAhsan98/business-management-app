"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { Product } from "@/types/database";

export async function getProducts(filters?: {
  categoryId?: string;
  companyId?: string;
  search?: string;
  activeOnly?: boolean;
}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name),
      company:companies(id, name)
    `)
    .order("name", { ascending: true });

  if (filters?.categoryId && filters.categoryId !== "all") {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters?.companyId && filters.companyId !== "all") {
    query = query.eq("company_id", filters.companyId);
  }
  if (filters?.activeOnly) {
    query = query.eq("is_active", true);
  }
  if (filters?.search) {
    const s = filters.search.trim().toLowerCase();
    query = query.or(`name.ilike.%${s}%,sku.ilike.%${s}%,flavour.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return data as Product[];
}

export async function getCategories() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("categories").select("*").eq("is_active", true).order("name");
  if (error) return [];
  return data;
}

export async function getCompanies() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("companies").select("*").eq("is_active", true).order("name");
  if (error) return [];
  return data;
}

export async function saveProduct(formData: FormData) {
  const supabase = createAdminClient();

  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const category_id = formData.get("category_id") as string;
  const company_id = formData.get("company_id") as string;
  const flavour = formData.get("flavour") as string | null;
  const pack_size = formData.get("pack_size") as string | null;
  const pieces_per_carton = parseInt(formData.get("pieces_per_carton") as string, 10);
  const sale_rate_carton = parseFloat(formData.get("sale_rate_carton") as string);
  const min_stock_pieces = parseInt((formData.get("min_stock_pieces") as string) || "0", 10);

  if (!name || !sku || !category_id || !company_id || !pieces_per_carton || isNaN(sale_rate_carton)) {
    return { error: "Please fill in all required fields accurately" };
  }

  const payload = {
    name,
    sku: sku.toUpperCase().trim(),
    category_id,
    company_id,
    flavour: flavour ? flavour.trim() : null,
    pack_size: pack_size ? pack_size.trim() : null,
    pieces_per_carton,
    sale_rate_carton,
    min_stock_pieces,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    // Check old rate for rate history logging (SDD §7.8)
    const { data: existing } = await supabase.from("products").select("sale_rate_carton").eq("id", id).single();
    
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) return { error: error.message };

    if (existing && existing.sale_rate_carton !== sale_rate_carton) {
      await supabase.from("product_rate_history").insert({
        product_id: id,
        rate_type: "SALE",
        old_rate: existing.sale_rate_carton,
        new_rate: sale_rate_carton,
        source: "MANUAL",
        changed_by: "00000000-0000-0000-0000-000000000000", // system/admin
      });
    }
  } else {
    const { data, error } = await supabase.from("products").insert(payload).select().single();
    if (error) return { error: error.message };

    // Initial rate history
    if (data) {
      await supabase.from("product_rate_history").insert({
        product_id: data.id,
        rate_type: "SALE",
        old_rate: 0,
        new_rate: sale_rate_carton,
        source: "MANUAL",
        changed_by: "00000000-0000-0000-0000-000000000000",
      });
    }
  }

  revalidatePath("/products");
  return { success: true };
}

export async function toggleProductActive(id: string, currentState: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: !currentState, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/products");
  return { success: true };
}

export async function bulkRateUpdate(params: {
  category_id?: string;
  company_id?: string;
  type: "PERCENT" | "FIXED";
  amount: number;
}) {
  const supabase = createAdminClient();
  let query = supabase.from("products").select("id, sale_rate_carton, name");

  if (params.category_id && params.category_id !== "all") {
    query = query.eq("category_id", params.category_id);
  }
  if (params.company_id && params.company_id !== "all") {
    query = query.eq("company_id", params.company_id);
  }

  const { data: prods, error } = await query;
  if (error || !prods || prods.length === 0) {
    return { error: "No products matched the selected filters" };
  }

  for (const p of prods) {
    let newRate = p.sale_rate_carton;
    if (params.type === "PERCENT") {
      newRate = Math.round(p.sale_rate_carton * (1 + params.amount / 100));
    } else {
      newRate = p.sale_rate_carton + params.amount;
    }
    if (newRate < 0) newRate = 0;

    await supabase.from("products").update({ sale_rate_carton: newRate }).eq("id", p.id);
    await supabase.from("product_rate_history").insert({
      product_id: p.id,
      rate_type: "SALE",
      old_rate: p.sale_rate_carton,
      new_rate: newRate,
      source: "BULK_UPDATE",
      changed_by: "00000000-0000-0000-0000-000000000000",
    });
  }

  revalidatePath("/products");
  return { success: true, count: prods.length };
}
