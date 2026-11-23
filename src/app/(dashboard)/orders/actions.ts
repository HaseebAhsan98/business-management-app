"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { Order, OrderItem } from "@/types/database";

export async function getOrders(filters?: {
  deliveryStatus?: string;
  paymentStatus?: string;
  customerId?: string;
  search?: string;
}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("orders")
    .select(`
      *,
      customer:customers(id, name, shop_name, party_code, area:areas(name)),
      salesman:users!orders_salesman_id_fkey(id, name)
    `)
    .order("created_at", { ascending: false });

  if (filters?.deliveryStatus && filters.deliveryStatus !== "all") {
    query = query.eq("delivery_status", filters.deliveryStatus);
  }
  if (filters?.paymentStatus && filters.paymentStatus !== "all") {
    query = query.eq("payment_status", filters.paymentStatus);
  }
  if (filters?.customerId && filters.customerId !== "all") {
    query = query.eq("customer_id", filters.customerId);
  }
  if (filters?.search) {
    const s = filters.search.trim().toLowerCase();
    query = query.or(`order_no.ilike.%${s}%,note.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  return data as Order[];
}

export async function createOrder(payload: {
  customer_id: string;
  salesman_id?: string;
  delivery_status: "PENDING" | "DELIVERED";
  payment_type: "CASH" | "CREDIT";
  credit_days: number;
  discount: number;
  override_reason?: string;
  note?: string;
  cash_paid?: number;
  items: {
    product_id: string;
    entered_unit: "CARTON" | "PIECE";
    qty: number;
    rate: number;
    rate_source: string;
  }[];
}) {
  const supabase = createAdminClient();

  if (!payload.customer_id || !payload.items || payload.items.length === 0) {
    return { error: "Please select a customer and add at least one product" };
  }

  // 1. Validate Stock Shortage for each line (SDD §8.12)
  for (const item of payload.items) {
    const { data: prod } = await supabase
      .from("products")
      .select("pieces_per_carton, name")
      .eq("id", item.product_id)
      .single();

    const piecesPerCarton = prod?.pieces_per_carton || 1;
    const piecesNeeded = item.entered_unit === "CARTON" ? item.qty * piecesPerCarton : item.qty;

    // Check available stock
    const { data: avail } = await supabase.rpc("get_product_stock_availability", {
      p_product_id: item.product_id,
    });

    const availablePieces = avail?.[0]?.available_pieces ?? 0;
    if (piecesNeeded > availablePieces) {
      const availCartons = Math.floor(availablePieces / piecesPerCarton);
      return {
        error: `Only ${availCartons} cartons available for ${prod?.name || "product"}. Add stock first.`,
      };
    }
  }

  // 2. Generate sequential order number ORD-YYYY-NNNNNN (SDD §8.20)
  const year = new Date().getFullYear();
  const { count } = await supabase.from("orders").select("*", { count: "exact", head: true });
  const nextSeq = (count || 0) + 1;
  const order_no = `ORD-${year}-${String(nextSeq).padStart(6, "0")}`;

  // 3. Compute Totals
  let subtotal = 0;
  payload.items.forEach((item) => {
    subtotal += item.qty * item.rate;
  });
  const total = Math.max(0, subtotal - (payload.discount || 0));
  const amount_paid = payload.delivery_status === "DELIVERED" 
    ? (payload.payment_type === "CASH" ? total : (payload.cash_paid || 0))
    : 0;
  const balance = payload.payment_type === "CREDIT" ? Math.max(0, total - amount_paid) : 0;
  const payment_status = amount_paid >= total ? "PAID" : amount_paid > 0 ? "PARTIAL" : "UNPAID";

  const order_date = new Date().toISOString().split("T")[0];
  const due_date = payload.credit_days > 0
    ? new Date(Date.now() + payload.credit_days * 86400000).toISOString().split("T")[0]
    : order_date;

  // Insert Order
  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_no,
      order_date,
      customer_id: payload.customer_id,
      delivery_status: payload.delivery_status,
      payment_type: payload.payment_type,
      credit_days: payload.credit_days,
      due_date,
      subtotal,
      discount: payload.discount || 0,
      total,
      amount_paid,
      balance,
      payment_status,
      override_reason: payload.override_reason || null,
      note: payload.note || null,
      salesman_id: payload.salesman_id || "00000000-0000-0000-0000-000000000000",
      created_by: "00000000-0000-0000-0000-000000000000",
    })
    .select()
    .single();

  if (orderError || !newOrder) {
    return { error: orderError?.message || "Failed to create order" };
  }

  // Insert Order Items
  for (let i = 0; i < payload.items.length; i++) {
    const it = payload.items[i];
    const { data: prod } = await supabase
      .from("products")
      .select("pieces_per_carton, last_purchase_rate_carton")
      .eq("id", it.product_id)
      .single();

    const piecesPerCarton = prod?.pieces_per_carton || 1;
    const qty_pieces = it.entered_unit === "CARTON" ? it.qty * piecesPerCarton : it.qty;
    const rate_per_piece = it.entered_unit === "CARTON" ? it.rate / piecesPerCarton : it.rate;
    const line_total = it.qty * it.rate;

    await supabase.from("order_items").insert({
      order_id: newOrder.id,
      product_id: it.product_id,
      qty_pieces,
      entered_unit: it.entered_unit,
      rate_per_piece,
      rate_per_carton: it.entered_unit === "CARTON" ? it.rate : it.rate * piecesPerCarton,
      rate_source: it.rate_source || "STANDARD",
      line_total,
      sort_order: i,
    });
  }

  // If marked DELIVERED immediately, run FIFO deduction RPC (SDD §8.3)
  if (payload.delivery_status === "DELIVERED") {
    await supabase.rpc("execute_order_delivery", {
      p_order_id: newOrder.id,
      p_user_id: "00000000-0000-0000-0000-000000000000",
    });
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true, order_id: newOrder.id, order_no };
}

export async function deliverOrder(orderId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("execute_order_delivery", {
    p_order_id: orderId,
    p_user_id: "00000000-0000-0000-0000-000000000000",
  });

  if (error) return { error: error.message };
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function cancelOrder(orderId: string, reason: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("reverse_order_delivery", {
    p_order_id: orderId,
    p_user_id: "00000000-0000-0000-0000-000000000000",
    p_reason: reason,
  });

  if (error) return { error: error.message };
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true };
}
