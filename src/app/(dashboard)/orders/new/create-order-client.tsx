"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Area, Customer, Category, Product } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingCart,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle,
  Truck,
  ArrowRight,
  Info,
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
import { createOrder } from "../actions";

interface OrderLineItem {
  product_id: string;
  product_name: string;
  sku: string;
  entered_unit: "CARTON" | "PIECE";
  qty: number;
  rate: number;
  rate_source: string;
  pieces_per_carton: number;
  last_purchase_rate_carton: number;
}

interface CreateOrderClientProps {
  areas: Area[];
  parties: Customer[];
  categories: Category[];
  products: Product[];
  preselectedCustomerId?: string;
}

export function CreateOrderClient({
  areas,
  parties,
  categories,
  products,
  preselectedCustomerId,
}: CreateOrderClientProps) {
  const router = useRouter();

  // Header Selections
  const [selectedArea, setSelectedArea] = useState<string>(areas[0]?.id || "");
  const [selectedPartyId, setSelectedPartyId] = useState<string>(preselectedCustomerId || "");
  const [creditDays, setCreditDays] = useState<number>(15);

  // Item Input State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [enteredUnit, setEnteredUnit] = useState<"CARTON" | "PIECE">("CARTON");
  const [lineQty, setLineQty] = useState<number>(10);
  const [lineRate, setLineRate] = useState<number>(0);
  const [rateSource, setRateSource] = useState<string>("DEFAULT_PROFIT");

  // Order List
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [orderNote, setOrderNote] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState<string>("");

  // Delivery & Payment Modal State
  const [deliverySheetOpen, setDeliverySheetOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<"CASH" | "CREDIT">("CREDIT");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Current Selected Customer
  const selectedParty = useMemo(
    () => parties.find((p) => p.id === selectedPartyId),
    [parties, selectedPartyId]
  );

  // Sync Area when Party is preselected
  useEffect(() => {
    if (selectedParty) {
      setSelectedArea(selectedParty.area_id);
      setCreditDays(selectedParty.credit_days_limit || 15);
    }
  }, [selectedParty]);

  // Parties filtered by Area (SDD §7.3)
  const availableParties = useMemo(
    () => parties.filter((p) => p.area_id === selectedArea),
    [parties, selectedArea]
  );

  // Products filtered by Category
  const availableProducts = useMemo(
    () => (selectedCategoryId === "all" ? products : products.filter((p) => p.category_id === selectedCategoryId)),
    [products, selectedCategoryId]
  );

  const currentProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Calculate Suggested Rate Waterfall on Product Selection (SDD §7.3, §8.11)
  useEffect(() => {
    if (!currentProduct) return;

    const baseCost = currentProduct.last_purchase_rate_carton || currentProduct.sale_rate_carton;
    const defaultMargin = selectedParty?.default_profit_per_carton ?? 40;

    let suggestedCartonRate = baseCost + defaultMargin;
    let source = "DEFAULT_PROFIT";

    if (currentProduct.sale_rate_carton && suggestedCartonRate === baseCost) {
      suggestedCartonRate = currentProduct.sale_rate_carton;
      source = "STANDARD";
    }

    if (enteredUnit === "PIECE") {
      const pieceRate = Math.round((suggestedCartonRate / currentProduct.pieces_per_carton) * 100) / 100;
      setLineRate(pieceRate);
    } else {
      setLineRate(suggestedCartonRate);
    }
    setRateSource(source);
  }, [currentProduct, selectedParty, enteredUnit]);

  // Add Item to Order Lines
  function handleAddItem() {
    if (!currentProduct || lineQty <= 0 || lineRate <= 0) return;

    const newItem: OrderLineItem = {
      product_id: currentProduct.id,
      product_name: currentProduct.name,
      sku: currentProduct.sku,
      entered_unit: enteredUnit,
      qty: lineQty,
      rate: lineRate,
      rate_source: rateSource,
      pieces_per_carton: currentProduct.pieces_per_carton,
      last_purchase_rate_carton: currentProduct.last_purchase_rate_carton,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedProductId("");
    setLineQty(10);
  }

  function handleRemoveItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // Calculate Order Totals
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.rate, 0),
    [items]
  );
  const total = Math.max(0, subtotal - discount);

  // Live Profit for Owner/Manager View (SDD §7.3)
  const totalProfitEstimate = useMemo(() => {
    return items.reduce((sum, item) => {
      const cartonRate = item.entered_unit === "PIECE" ? item.rate * item.pieces_per_carton : item.rate;
      const profitPerCarton = cartonRate - (item.last_purchase_rate_carton || 0);
      const cartons = item.entered_unit === "CARTON" ? item.qty : item.qty / item.pieces_per_carton;
      return sum + cartons * profitPerCarton;
    }, 0);
  }, [items]);

  async function handleFinalSubmit(deliveryStatus: "PENDING" | "DELIVERED") {
    if (!selectedPartyId || items.length === 0) {
      setErrorMsg("Please select a party and add at least one line item");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const result = await createOrder({
      customer_id: selectedPartyId,
      delivery_status: deliveryStatus,
      payment_type: paymentType,
      credit_days: creditDays,
      discount,
      note: orderNote,
      override_reason: overrideReason,
      cash_paid: paymentType === "CASH" ? total : cashReceived,
      items: items.map((it) => ({
        product_id: it.product_id,
        entered_unit: it.entered_unit,
        qty: it.qty,
        rate: it.rate,
        rate_source: it.rate_source,
      })),
    });

    setSubmitting(false);

    if (result.error) {
      setErrorMsg(result.error);
    } else {
      router.push("/orders");
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Sales Order</h1>
          <p className="text-xs text-muted-foreground">Fast order entry in under 1 minute</p>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          Date: <strong>{new Date().toLocaleDateString("en-GB")}</strong>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Area & Party Selection (SDD §7.3) */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold">1. Choose Area *</label>
              <select
                value={selectedArea}
                onChange={(e) => {
                  setSelectedArea(e.target.value);
                  setSelectedPartyId("");
                }}
                className="w-full h-10 px-3 rounded-md border border-input text-sm bg-background mt-1 font-medium"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold">2. Choose Party (Customer) *</label>
              <select
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input text-sm bg-background mt-1 font-semibold"
              >
                <option value="">-- Select Party from {areas.find((a) => a.id === selectedArea)?.name || "Area"} --</option>
                {availableParties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.shop_name} ({p.party_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Party Info Bar (SDD §7.3) */}
          {selectedParty && (
            <div className="p-3.5 bg-muted/40 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    Party Balance:{" "}
                    <strong className="text-amber-700 dark:text-amber-400 font-mono">
                      {formatCurrency(selectedParty.opening_balance_remaining)} owed
                    </strong>
                  </span>
                  <span>•</span>
                  <span>Credit Days Allowed: <strong>{selectedParty.credit_days_limit} days</strong></span>
                </div>
                <div className="text-muted-foreground">
                  Default profit margin: <strong>+{formatCurrency(selectedParty.default_profit_per_carton)} / ctn</strong>
                </div>
              </div>

              {/* Overdue Warning if any */}
              {selectedParty.opening_balance_remaining > 0 && (
                <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Has outstanding balance. Reason required if credit days exceeded.</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Add Line Item Section (SDD §7.3) */}
      <Card className="border shadow-sm p-4 bg-muted/10">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold">Category</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setSelectedProductId("");
                }}
                className="w-full h-9 px-3 rounded-md border border-input text-xs bg-background mt-1"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold">Product *</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input text-xs bg-background mt-1 font-semibold"
              >
                <option value="">-- Choose Product with Stock --</option>
                {availableProducts.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} ({prod.sku})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Rate & Qty Line */}
          {currentProduct && (
            <div className="p-3 bg-card border rounded-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground border-b pb-2">
                <span>
                  Pack: <strong>{currentProduct.flavour || ""} {currentProduct.pack_size || ""}</strong> ({currentProduct.pieces_per_carton} pcs/ctn)
                </span>
                <span className="text-foreground">
                  Last Cost: <strong>{formatCurrency(currentProduct.last_purchase_rate_carton)}</strong> / ctn
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-xs font-semibold">Quantity</label>
                  <Input
                    type="number"
                    min={1}
                    value={lineQty}
                    onChange={(e) => setLineQty(parseInt(e.target.value, 10) || 1)}
                    className="h-9 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold">Unit</label>
                  <select
                    value={enteredUnit}
                    onChange={(e) => setEnteredUnit(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-md border border-input text-xs bg-background"
                  >
                    <option value="CARTON">Carton</option>
                    <option value="PIECE">Piece</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold">
                    Rate / {enteredUnit === "CARTON" ? "Carton" : "Piece"} (Editable)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={lineRate}
                    onChange={(e) => setLineRate(parseFloat(e.target.value) || 0)}
                    className="h-9 font-bold font-mono text-primary"
                  />
                </div>

                <div>
                  <Button onClick={handleAddItem} className="w-full gap-2 font-semibold h-9">
                    <Plus className="h-4 w-4" />
                    <span>Add Item</span>
                  </Button>
                </div>
              </div>

              {/* Live Profit Preview (SDD §7.3) */}
              <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                <span>
                  Line Total: <strong>{formatCurrency(lineQty * lineRate)}</strong>
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  Profit on Line: ~{formatCurrency(
                    (lineRate - (currentProduct.last_purchase_rate_carton / (enteredUnit === "CARTON" ? 1 : currentProduct.pieces_per_carton))) * lineQty
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 3. Items Table (SDD §7.3) */}
      <Card className="border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Qty & Unit</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Line Amount</TableHead>
              <TableHead className="text-right">Estimated Profit</TableHead>
              <TableHead className="text-center">Remove</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No items added to this order yet. Select a product above to add.
                </TableCell>
              </TableRow>
            ) : (
              items.map((it, idx) => {
                const amount = it.qty * it.rate;
                const cost = (it.last_purchase_rate_carton / (it.entered_unit === "CARTON" ? 1 : it.pieces_per_carton)) * it.qty;
                const profit = amount - cost;

                return (
                  <TableRow key={idx}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm">{it.product_name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{it.sku}</div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {it.qty} {it.entered_unit.toLowerCase()}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-xs">
                      {formatCurrency(it.rate)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm">
                      {formatCurrency(amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                      +{formatCurrency(profit)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(idx)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Order Summary & Actions */}
        <div className="p-4 border-t bg-muted/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold">Special Discount (Rs):</label>
              <Input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-28 h-9 font-semibold"
              />
            </div>

            <div className="text-right space-y-0.5">
              <div className="text-xs text-muted-foreground">Order Total (Gross - Discount)</div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {formatCurrency(total)}
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                Est. Total Profit: +{formatCurrency(Math.max(0, totalProfitEstimate - discount))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting || items.length === 0}
              onClick={() => handleFinalSubmit("PENDING")}
              className="w-full sm:w-auto"
            >
              Save as Pending (Reserve Stock)
            </Button>

            <Button
              type="button"
              disabled={submitting || items.length === 0}
              onClick={() => setDeliverySheetOpen(true)}
              className="w-full sm:w-auto font-bold gap-2"
            >
              <Truck className="h-4 w-4" />
              <span>Save & Mark Delivered</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 4. Delivery & Payment Sheet Modal (SDD §7.6) */}
      {deliverySheetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-xl bg-card border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Delivery Status & Payment</span>
                <span className="font-mono text-primary text-base font-bold">{formatCurrency(total)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold">Payment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType("CREDIT")}
                    className={`p-2.5 text-xs font-bold rounded-md border ${
                      paymentType === "CREDIT" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    Credit (Bill)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType("CASH")}
                    className={`p-2.5 text-xs font-bold rounded-md border ${
                      paymentType === "CASH" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    Cash on Delivery
                  </button>
                </div>
              </div>

              {paymentType === "CREDIT" ? (
                <div className="space-y-3 p-3 bg-muted/40 rounded-lg border text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold">Credit Days</label>
                    <Input
                      type="number"
                      min={0}
                      value={creditDays}
                      onChange={(e) => setCreditDays(parseInt(e.target.value, 10) || 0)}
                      className="h-8 font-semibold"
                    />
                    <span className="text-muted-foreground text-[10px]">
                      Party standard limit: {selectedParty?.credit_days_limit || 15} days
                    </span>
                  </div>

                  {creditDays > (selectedParty?.credit_days_limit || 15) && (
                    <div className="space-y-1 pt-1">
                      <label className="font-bold text-amber-700 dark:text-amber-400">
                        Reason for Exceeding Credit Days *
                      </label>
                      <Input
                        required
                        placeholder="Owner approval note..."
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="h-8 border-amber-500"
                      />
                    </div>
                  )}

                  <div className="space-y-1 pt-1">
                    <label className="font-semibold">Immediate Cash Received (Optional Part Payment)</label>
                    <Input
                      type="number"
                      min={0}
                      max={total}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                      className="h-8 font-semibold"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300">Full Cash Payment</div>
                  <p className="text-muted-foreground">
                    Order will be marked as Delivered & Paid immediately. No balance added to party ledger.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold">Order Note (Optional)</label>
                <Input
                  placeholder="Special instructions or memo..."
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setDeliverySheetOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleFinalSubmit("DELIVERED")}
                  disabled={submitting}
                  className="gap-2 font-bold"
                >
                  {submitting ? "Processing FIFO..." : "Confirm & Deliver"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
