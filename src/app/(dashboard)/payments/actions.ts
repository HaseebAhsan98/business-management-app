"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomerPayment } from "@/types/database";

export async function getPayments() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customer_payments")
    .select(`
      *,
      customer:customers(id, name, shop_name, party_code)
    `)
    .order("paid_at", { ascending: false });

  if (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
  return data as CustomerPayment[];
}

export async function recordCustomerPayment(payload: {
  customer_id: string;
  amount: number;
  method: "CASH" | "BANK" | "WALLET" | "CHEQUE";
  payment_date: string;
  order_id?: string;
  note?: string;
}) {
  const supabase = createAdminClient();

  if (!payload.customer_id || payload.amount <= 0) {
    return { error: "Please select a party and enter a valid positive payment amount" };
  }

  // 1. Fetch current party balance
  const { data: cust, error: custErr } = await supabase
    .from("customers")
    .select("opening_balance_remaining, name")
    .eq("id", payload.customer_id)
    .single();

  if (custErr || !cust) {
    return { error: "Party not found" };
  }

  // Calculate total customer debt (Opening balance + Unpaid delivered orders)
  const { data: unpaidOrders } = await supabase
    .from("orders")
    .select("balance")
    .eq("customer_id", payload.customer_id)
    .eq("delivery_status", "DELIVERED")
    .gt("balance", 0);

  const totalDeliveredBalance = (unpaidOrders || []).reduce((s, o) => s + o.balance, 0);
  const balance_before = cust.opening_balance_remaining + totalDeliveredBalance;
  const balance_after = Math.max(0, balance_before - payload.amount);

  // 2. Generate sequential receipt number RCT-YYYY-NNNNNN (SDD §8.20)
  const year = new Date().getFullYear();
  const { count } = await supabase.from("customer_payments").select("*", { count: "exact", head: true });
  const nextSeq = (count || 0) + 1;
  const receipt_no = `RCT-${year}-${String(nextSeq).padStart(6, "0")}`;

  // 3. Insert Payment
  const { data: payment, error: pmtErr } = await supabase
    .from("customer_payments")
    .insert({
      receipt_no,
      customer_id: payload.customer_id,
      order_id: payload.order_id || null,
      amount: payload.amount,
      method: payload.method,
      payment_date: payload.payment_date || new Date().toISOString().split("T")[0],
      balance_before,
      balance_after,
      note: payload.note || null,
      received_by: "00000000-0000-0000-0000-000000000000",
    })
    .select()
    .single();

  if (pmtErr || !payment) {
    return { error: pmtErr?.message || "Failed to record payment" };
  }

  // 4. Run automated payment allocation waterfall (SDD §7.12, §8.9)
  await supabase.rpc("allocate_customer_payment", {
    p_payment_id: payment.id,
    p_customer_id: payload.customer_id,
    p_amount: payload.amount,
  });

  revalidatePath("/payments");
  revalidatePath("/parties");
  revalidatePath("/dashboard");
  revalidatePath("/reminders");
  return { success: true, receipt_no, balance_after };
}
