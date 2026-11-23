"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Customer } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, CheckCircle, AlertTriangle, ArrowRight, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recordCustomerPayment } from "../actions";

interface RecordPaymentClientProps {
  parties: Customer[];
  preselectedCustomerId?: string;
}

export function RecordPaymentClient({
  parties,
  preselectedCustomerId,
}: RecordPaymentClientProps) {
  const router = useRouter();

  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId || parties[0]?.id || "");
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<"CASH" | "BANK" | "WALLET" | "CHEQUE">("CASH");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedParty = useMemo(
    () => parties.find((p) => p.id === selectedCustomerId),
    [parties, selectedCustomerId]
  );

  const currentBalance = selectedParty?.opening_balance_remaining || 0;
  // Live balance feedback (SDD §7.12)
  const balanceAfter = Math.max(0, currentBalance - amount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomerId || amount <= 0) {
      setErrorMsg("Please select a customer and enter an amount");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const result = await recordCustomerPayment({
      customer_id: selectedCustomerId,
      amount,
      method,
      payment_date: paymentDate,
      note,
    });

    setSubmitting(false);

    if (result.error) {
      setErrorMsg(result.error);
    } else {
      router.push(`/parties/${selectedCustomerId}`);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Receive Customer Payment</h1>
        <p className="text-xs text-muted-foreground">
          Auto-allocates to opening balance first, then oldest unpaid bills
        </p>
      </div>

      <Card className="border shadow-md">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-md">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold">Select Party (Customer) *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-md border border-input text-sm bg-background mt-1 font-semibold"
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.shop_name} ({p.party_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Live Balance Tracker Card (SDD §7.12) */}
            <div className="p-4 bg-muted/40 rounded-lg border grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-xs text-muted-foreground font-semibold uppercase">Current Balance</span>
                <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5">
                  {formatCurrency(currentBalance)}
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground font-semibold uppercase">Balance After</span>
                <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {formatCurrency(balanceAfter)}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Amount Received (Rs) *</label>
              <Input
                type="number"
                step="0.01"
                min={1}
                required
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 5000"
                className="h-10 text-lg font-bold font-mono text-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">Payment Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-md border border-input text-xs bg-background mt-1 font-medium"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="WALLET">Easypaisa / JazzCash</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold">Payment Date</label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-9 mt-1 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Receipt Note / Cheque No</label>
              <Input
                placeholder="Optional memo or transaction ID..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="pt-2 border-t">
              <Button type="submit" disabled={submitting || amount <= 0} className="w-full font-bold h-10">
                {submitting ? "Allocating Payment..." : "Record Payment & Generate Receipt"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
