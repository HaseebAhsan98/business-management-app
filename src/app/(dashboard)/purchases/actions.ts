"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { Purchase } from "@/types/database";

export async function getPurchases() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("purchases")
    .select(`
      *,
      supplier:suppliers(id, name, company),
      items:purchase_items(
        id,
        qty_pieces,
        qty_remaining_pieces,
        rate_per_carton,
        line_total,
        product:products(id, name, sku, pieces_per_carton)
      )
    `)
    .order("purchase_date", { ascending: false });

  if (error) {
    console.error("Error fetching purchases:", error);
    return [];
  }
  return data as Purchase[];
}

export async function createPurchase(payload: {
  purchase_type: "NORMAL" | "OPENING";
  supplier_id?: string;
  supplier_bill_no?: string;
  purchase_date: string;
  paid_now: number;
  payment_method?: string;
  due_days?: number;
  note?: string;
  items: {
    product_id: string;
    entered_unit: "CARTON" | "PIECE";
    qty: number;
    rate_per_carton: number;
  }[];
}) {
  const supabase = createAdminClient();

  if (!payload.items || payload.items.length === 0) {
    return { error: "Please add at least one product line item" };
  }

  // 1. Calculate Totals
  let total = 0;
  for (const it of payload.items) {
    const { data: prod } = await supabase
      .from("products")
      .select("pieces_per_carton")
      .eq("id", it.product_id)
      .single();

    const piecesPerCarton = prod?.pieces_per_carton || 1;
    const cartons = it.entered_unit === "CARTON" ? it.qty : it.qty / piecesPerCarton;
    total += cartons * it.rate_per_carton;
  }

  const paid = payload.paid_now || 0;
  const balance = Math.max(0, total - paid);
  const due_date = payload.due_days
    ? new Date(Date.now() + payload.due_days * 86400000).toISOString().split("T")[0]
    : null;

  // 2. Generate sequential purchase number PUR-YYYY-NNNNNN (SDD §8.20)
  const year = new Date().getFullYear();
  const { count } = await supabase.from("purchases").select("*", { count: "exact", head: true });
  const nextSeq = (count || 0) + 1;
  const purchase_no = `PUR-${year}-${String(nextSeq).padStart(6, "0")}`;

  // 3. Insert Purchase Record
  const { data: newPurchase, error: purError } = await supabase
    .from("purchases")
    .insert({
      purchase_no,
      purchase_type: payload.purchase_type,
      supplier_id: payload.purchase_type === "NORMAL" ? payload.supplier_id : null,
      supplier_bill_no: payload.supplier_bill_no || null,
      purchase_date: payload.purchase_date || new Date().toISOString().split("T")[0],
      total,
      paid,
      balance,
      due_date,
      note: payload.note || null,
      created_by: "00000000-0000-0000-0000-000000000000",
    })
    .select()
    .single();

  if (purError || !newPurchase) {
    return { error: purError?.message || "Failed to save purchase" };
  }

  // 4. Create Batches, Update Last Purchase Rate, and Log Stock Movements
  for (const it of payload.items) {
    const { data: prod } = await supabase
      .from("products")
      .select("pieces_per_carton, last_purchase_rate_carton")
      .eq("id", it.product_id)
      .single();

    const piecesPerCarton = prod?.pieces_per_carton || 1;
    const qty_pieces = it.entered_unit === "CARTON" ? it.qty * piecesPerCarton : it.qty;
    const unit_cost_per_piece = it.rate_per_carton / piecesPerCarton;
    const line_total = (qty_pieces / piecesPerCarton) * it.rate_per_carton;

    // Create Batch (SDD §8.6)
    const { data: batch } = await supabase
      .from("purchase_items")
      .insert({
        purchase_id: newPurchase.id,
        product_id: it.product_id,
        qty_pieces,
        qty_remaining_pieces: qty_pieces,
        unit_cost_per_piece,
        rate_per_carton: it.rate_per_carton,
        line_total,
      })
      .select()
      .single();

    // Update Product's Last Purchase Rate (SDD §8.4, §8.6)
    await supabase
      .from("products")
      .update({
        last_purchase_rate_carton: it.rate_per_carton,
        updated_at: new Date().toISOString(),
      })
      .eq("id", it.product_id);

    // Record Rate History
    if (prod && prod.last_purchase_rate_carton !== it.rate_per_carton) {
      await supabase.from("product_rate_history").insert({
        product_id: it.product_id,
        rate_type: "PURCHASE",
        old_rate: prod.last_purchase_rate_carton || 0,
        new_rate: it.rate_per_carton,
        source: "PURCHASE",
        changed_by: "00000000-0000-0000-0000-000000000000",
      });
    }

    // Log Stock Movement (SDD §8.19)
    await supabase.from("stock_movements").insert({
      product_id: it.product_id,
      movement_type: payload.purchase_type === "OPENING" ? "OPENING" : "PURCHASE",
      qty_pieces,
      ref_type: "PURCHASE",
      ref_id: newPurchase.id,
      batch_id: batch?.id || null,
      created_by: "00000000-0000-0000-0000-000000000000",
    });
  }

  // 5. Update Supplier Balance if unpaid balance exists
  if (payload.supplier_id && balance > 0) {
    const { data: supp } = await supabase.from("suppliers").select("current_balance").eq("id", payload.supplier_id).single();
    if (supp) {
      await supabase
        .from("suppliers")
        .update({
          current_balance: supp.current_balance + balance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.supplier_id);
    }
  }

  revalidatePath("/purchases");
  revalidatePath("/stock");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { success: true, purchase_no };
}
