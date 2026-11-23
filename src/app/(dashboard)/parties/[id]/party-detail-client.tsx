"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Customer,
  CustomerPriceRule,
  Order,
  CustomerPayment,
  Product,
} from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  MapPin,
  Phone,
  Clock,
  PlusCircle,
  FileText,
  CreditCard,
  Share2,
  Calendar,
  DollarSign,
  Edit,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { saveCustomerPriceRule } from "../actions";

interface PartyDetailClientProps {
  customer: Customer;
  priceRules: (CustomerPriceRule & { product: Product })[];
  orders: Order[];
  payments: CustomerPayment[];
  allProducts: Product[];
}

export function PartyDetailClient({
  customer,
  priceRules,
  orders,
  payments,
  allProducts,
}: PartyDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"ledger" | "pricelist" | "orders" | "payments">("ledger");

  // Price Rule Editing State
  const [editingProductRule, setEditingProductRule] = useState<Product | null>(null);
  const [ruleType, setRuleType] = useState<"PROFIT_ON_COST" | "FIXED_RATE">("PROFIT_ON_COST");
  const [ruleAmount, setRuleAmount] = useState<number>(40);
  const [savingRule, setSavingRule] = useState(false);

  // Build Chronological Ledger Entries (SDD §7.7)
  interface LedgerEntry {
    date: string;
    description: string;
    refNo: string;
    debit: number; // Order amount
    credit: number; // Payment amount
    balance: number;
  }

  const ledgerEntries: LedgerEntry[] = [];
  let currentRunning = 0;

  // 1. Opening Balance Entry
  if (customer.opening_balance > 0) {
    currentRunning += customer.opening_balance;
    ledgerEntries.push({
      date: customer.created_at,
      description: "Opening Balance Carried Forward",
      refNo: "OPENING",
      debit: customer.opening_balance,
      credit: 0,
      balance: currentRunning,
    });
  }

  // Combine Orders and Payments sorted chronologically
  const combinedEvents = [
    ...orders.map((o) => ({ type: "ORDER" as const, date: o.order_date, created: o.created_at, data: o })),
    ...payments.map((p) => ({ type: "PAYMENT" as const, date: p.payment_date, created: p.paid_at, data: p })),
  ].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());

  for (const event of combinedEvents) {
    if (event.type === "ORDER") {
      const o = event.data;
      if (o.delivery_status === "DELIVERED") {
        currentRunning += o.total;
        ledgerEntries.push({
          date: o.delivered_at || o.created_at,
          description: `Delivered Order (${o.payment_type})`,
          refNo: o.order_no,
          debit: o.total,
          credit: 0,
          balance: currentRunning,
        });
      }
    } else {
      const p = event.data;
      if (p.status === "ACTIVE") {
        currentRunning -= p.amount;
        ledgerEntries.push({
          date: p.paid_at || p.created_at,
          description: `Payment Received (${p.method})`,
          refNo: p.receipt_no,
          debit: 0,
          credit: p.amount,
          balance: currentRunning,
        });
      }
    }
  }

  async function handleSavePriceRule(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProductRule) return;
    setSavingRule(true);
    await saveCustomerPriceRule(customer.id, editingProductRule.id, ruleType, ruleAmount);
    setSavingRule(false);
    setEditingProductRule(null);
    window.location.reload();
  }

  function getPartyRateForProduct(prod: Product) {
    const customRule = priceRules.find((r) => r.product_id === prod.id);
    if (customRule) {
      if (customRule.rule_type === "FIXED_RATE") {
        return { rate: customRule.amount_per_carton, label: "Fixed Rate", profit: customRule.amount_per_carton - prod.last_purchase_rate_carton };
      } else {
        const rate = (prod.last_purchase_rate_carton || prod.sale_rate_carton) + customRule.amount_per_carton;
        return { rate, label: `Cost + ${customRule.amount_per_carton}`, profit: customRule.amount_per_carton };
      }
    }
    // Default Profit on cost (SDD §8.11)
    const profit = customer.default_profit_per_carton || 40;
    const rate = (prod.last_purchase_rate_carton || prod.sale_rate_carton) + profit;
    return { rate, label: `Default (+${profit})`, profit };
  }

  return (
    <div className="space-y-6">
      {/* Party Summary Card */}
      <Card className="border shadow-sm p-6 bg-card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {customer.party_code}
              </span>
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              <Badge variant="outline" className="text-xs">
                {customer.area?.name || "No Area"}
              </Badge>
            </div>

            <p className="text-sm font-medium text-muted-foreground">{customer.shop_name}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              {customer.phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="h-3 w-3" /> {customer.phone}
                </span>
              )}
              {customer.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {customer.address}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Credit Limit:{" "}
                <strong>{customer.credit_days_limit} days</strong>
              </span>
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                Default Profit: +{formatCurrency(customer.default_profit_per_carton)} / ctn
              </span>
            </div>
          </div>

          {/* Balance & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t lg:border-t-0 pt-4 lg:pt-0">
            <div className="text-left sm:text-right">
              <div className="text-xs text-muted-foreground font-semibold uppercase">Total Balance Due</div>
              <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">
                {formatCurrency(currentRunning)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/payments/new?customerId=${customer.id}`}>
                <Button size="sm" className="gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CreditCard className="h-4 w-4" />
                  <span>Receive Payment</span>
                </Button>
              </Link>
              <Link href={`/orders/new?customerId=${customer.id}`}>
                <Button size="sm" className="gap-1.5 font-semibold">
                  <PlusCircle className="h-4 w-4" />
                  <span>New Order</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex border-b border-muted">
        {[
          { id: "ledger", label: "Party Ledger", icon: FileText },
          { id: "pricelist", label: "Party Price List", icon: DollarSign },
          { id: "orders", label: `Orders (${orders.length})`, icon: Clock },
          { id: "payments", label: `Payments (${payments.length})`, icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Ledger */}
      {activeTab === "ledger" && (
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Date-wise Ledger Statement</CardTitle>
              <p className="text-xs text-muted-foreground">Running balance after every order and payment</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Reference No</TableHead>
                    <TableHead>Transaction Details</TableHead>
                    <TableHead className="text-right">Debit (Bill)</TableHead>
                    <TableHead className="text-right">Credit (Paid)</TableHead>
                    <TableHead className="text-right">Running Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No transactions recorded for this party yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledgerEntries.map((entry, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs font-mono">{formatDate(entry.date)}</TableCell>
                        <TableCell className="text-xs font-mono font-bold text-primary">
                          {entry.refNo}
                        </TableCell>
                        <TableCell className="text-xs">{entry.description}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {entry.debit > 0 ? (
                            <span className="text-red-600 font-semibold">{formatCurrency(entry.debit)}</span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {entry.credit > 0 ? (
                            <span className="text-emerald-600 font-semibold">{formatCurrency(entry.credit)}</span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                          {formatCurrency(entry.balance)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Party Price List (SDD §7.7) */}
      {activeTab === "pricelist" && (
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Custom Party Rate List</CardTitle>
              <p className="text-xs text-muted-foreground">
                Rates automatically calculate for this party in new orders. Click Edit to override.
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Last Purchase Cost</TableHead>
                    <TableHead className="text-center">Pricing Rule</TableHead>
                    <TableHead className="text-right">Profit / Carton</TableHead>
                    <TableHead className="text-right">Resulting Rate (Ctn)</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allProducts.map((prod) => {
                    const priceInfo = getPartyRateForProduct(prod);
                    const customRule = priceRules.find((r) => r.product_id === prod.id);

                    return (
                      <TableRow key={prod.id}>
                        <TableCell className="font-semibold text-sm">{prod.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{prod.sku}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {formatCurrency(prod.last_purchase_rate_carton)}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          <Badge variant={customRule ? "default" : "outline"}>
                            {priceInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                          +{formatCurrency(priceInfo.profit)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold text-foreground">
                          {formatCurrency(priceInfo.rate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingProductRule(prod);
                              if (customRule) {
                                setRuleType(customRule.rule_type);
                                setRuleAmount(customRule.amount_per_carton);
                              } else {
                                setRuleType("PROFIT_ON_COST");
                                setRuleAmount(customer.default_profit_per_carton || 40);
                              }
                            }}
                            className="h-8 gap-1 text-xs"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Set Rate</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Party Price Rule Modal */}
      {editingProductRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-xl bg-card border">
            <CardHeader>
              <CardTitle>Set Price Rule: {editingProductRule.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePriceRule} className="space-y-4">
                <div className="p-3 bg-muted/40 rounded-md text-xs space-y-1">
                  <div>
                    Last Purchase Cost:{" "}
                    <strong>{formatCurrency(editingProductRule.last_purchase_rate_carton)}</strong>
                  </div>
                  <div>
                    Standard Market Rate:{" "}
                    <strong>{formatCurrency(editingProductRule.sale_rate_carton)}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold">Rule Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRuleType("PROFIT_ON_COST")}
                      className={`p-2 text-xs font-semibold rounded-md border ${
                        ruleType === "PROFIT_ON_COST" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      Profit Above Cost
                    </button>
                    <button
                      type="button"
                      onClick={() => setRuleType("FIXED_RATE")}
                      className={`p-2 text-xs font-semibold rounded-md border ${
                        ruleType === "FIXED_RATE" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      Fixed Selling Rate
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {ruleType === "PROFIT_ON_COST" ? "Profit per carton (Rs)" : "Fixed Rate per carton (Rs)"}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={ruleAmount}
                    onChange={(e) => setRuleAmount(parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Resulting price:{" "}
                    <strong>
                      {formatCurrency(
                        ruleType === "PROFIT_ON_COST"
                          ? editingProductRule.last_purchase_rate_carton + ruleAmount
                          : ruleAmount
                      )}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setEditingProductRule(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={savingRule}>
                    {savingRule ? "Saving..." : "Save Rule"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Orders List */}
      {activeTab === "orders" && (
        <Card className="border shadow-sm p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Delivery Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Balance Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                    No orders for this party yet.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono font-bold text-xs text-primary">{o.order_no}</TableCell>
                    <TableCell className="text-xs">{formatDate(o.order_date)}</TableCell>
                    <TableCell>
                      <Badge variant={o.delivery_status === "DELIVERED" ? "success" : "warning"}>
                        {o.delivery_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={o.payment_status === "PAID" ? "success" : "warning"}>
                        {o.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(o.total)}</TableCell>
                    <TableCell className="text-right font-mono text-amber-700 dark:text-amber-400 font-semibold">
                      {formatCurrency(o.balance)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tab 4: Payments List */}
      {activeTab === "payments" && (
        <Card className="border shadow-sm p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount Received</TableHead>
                <TableHead className="text-right">Remaining Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    No payments recorded for this party yet.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono font-bold text-xs text-primary">{p.receipt_no}</TableCell>
                    <TableCell className="text-xs">{formatDate(p.payment_date)}</TableCell>
                    <TableCell className="text-xs font-medium">{p.method}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-600">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(p.balance_after)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
