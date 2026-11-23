"use client";

import { useState, useMemo } from "react";
import { Purchase, Supplier, Product, Category } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Truck,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Layers,
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
import { createPurchase } from "./actions";

interface PurchasesClientProps {
  initialPurchases: Purchase[];
  suppliers: Supplier[];
  products: Product[];
  categories: Category[];
}

export function PurchasesClient({
  initialPurchases,
  suppliers,
  products,
  categories,
}: PurchasesClientProps) {
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Purchase Form State
  const [purchaseType, setPurchaseType] = useState<"NORMAL" | "OPENING">("NORMAL");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [billNo, setBillNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidNow, setPaidNow] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [dueDays, setDueDays] = useState<number>(30);
  const [purchaseNote, setPurchaseNote] = useState("");

  // Line Items State
  const [items, setItems] = useState<
    {
      product_id: string;
      product_name: string;
      sku: string;
      entered_unit: "CARTON" | "PIECE";
      qty: number;
      rate_per_carton: number;
      last_rate: number;
    }[]
  >([]);

  // Item input
  const [selectedProductId, setSelectedProductId] = useState("");
  const [lineQty, setLineQty] = useState(50);
  const [lineUnit, setLineUnit] = useState<"CARTON" | "PIECE">("CARTON");
  const [lineRate, setLineRate] = useState(1050);

  const currentProd = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Rate difference indicator (SDD §7.10)
  const rateDiff = useMemo(() => {
    if (!currentProd) return null;
    const oldRate = currentProd.last_purchase_rate_carton || currentProd.sale_rate_carton;
    const diff = lineRate - oldRate;
    const pct = oldRate > 0 ? Math.round((diff / oldRate) * 100) : 0;
    return { diff, pct, isUp: diff > 0, isDown: diff < 0 };
  }, [currentProd, lineRate]);

  function handleAddLine() {
    if (!currentProd || lineQty <= 0 || lineRate <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        product_id: currentProd.id,
        product_name: currentProd.name,
        sku: currentProd.sku,
        entered_unit: lineUnit,
        qty: lineQty,
        rate_per_carton: lineRate,
        last_rate: currentProd.last_purchase_rate_carton || 0,
      },
    ]);
    setSelectedProductId("");
    setLineQty(50);
  }

  const grandTotal = useMemo(() => {
    return items.reduce((s, it) => s + it.qty * it.rate_per_carton, 0);
  }, [items]);

  const remainingPayable = Math.max(0, grandTotal - paidNow);

  async function handleSavePurchase(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      setModalError("Please add at least one line item");
      return;
    }

    setSaving(true);
    setModalError(null);

    const result = await createPurchase({
      purchase_type: purchaseType,
      supplier_id: purchaseType === "NORMAL" ? supplierId : undefined,
      supplier_bill_no: billNo,
      purchase_date: purchaseDate,
      paid_now: paidNow,
      payment_method: paymentMethod,
      due_days: dueDays,
      note: purchaseNote,
      items: items.map((it) => ({
        product_id: it.product_id,
        entered_unit: it.entered_unit,
        qty: it.qty,
        rate_per_carton: it.rate_per_carton,
      })),
    });

    setSaving(false);

    if (result.error) {
      setModalError(result.error);
    } else {
      setModalOpen(false);
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Purchases & Inward Stock</h2>
          <p className="text-sm text-muted-foreground">
            Record fresh purchase batches, update cost rates, and manage supplier payables
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setPurchaseType("OPENING");
              setItems([]);
              setModalError(null);
              setModalOpen(true);
            }}
            className="gap-2"
          >
            <Layers className="h-4 w-4" />
            <span>Add Opening Stock</span>
          </Button>

          <Button
            onClick={() => {
              setPurchaseType("NORMAL");
              setItems([]);
              setModalError(null);
              setModalOpen(true);
            }}
            className="gap-2 font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>New Purchase</span>
          </Button>
        </div>
      </div>

      {/* Purchases List */}
      <Card className="border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Purchase No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier / Agency</TableHead>
              <TableHead>Bill No</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Total Bill</TableHead>
              <TableHead className="text-right">Paid Now</TableHead>
              <TableHead className="text-right">Payable Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No purchases recorded yet. Click New Purchase to enter incoming stock.
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((pur) => (
                <TableRow key={pur.id}>
                  <TableCell className="font-mono text-xs font-bold text-primary">
                    {pur.purchase_no}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{formatDate(pur.purchase_date)}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm">
                      {pur.supplier?.name || "Opening Godown Stock"}
                    </div>
                    {pur.supplier?.company && (
                      <div className="text-[11px] text-muted-foreground">{pur.supplier.company}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{pur.supplier_bill_no || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={pur.purchase_type === "OPENING" ? "secondary" : "default"}>
                      {pur.purchase_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm">
                    {formatCurrency(pur.total)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-emerald-600 font-semibold">
                    {formatCurrency(pur.paid)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-purple-700 dark:text-purple-400">
                    {pur.balance > 0 ? formatCurrency(pur.balance) : "Rs 0"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* New Purchase Modal (SDD §7.10) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl shadow-xl bg-card border max-h-[92vh] overflow-y-auto">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">
                {purchaseType === "OPENING" ? "Enter Opening Godown Stock" : "New Purchase Entry"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <form onSubmit={handleSavePurchase} className="space-y-4">
                {modalError && (
                  <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-md">
                    {modalError}
                  </div>
                )}

                {/* Supplier and Header info */}
                {purchaseType === "NORMAL" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold">Supplier *</label>
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        required
                        className="w-full h-9 px-3 rounded-md border border-input text-xs bg-background mt-1"
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.company || "Agency"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold">Supplier Bill No</label>
                      <Input
                        value={billNo}
                        onChange={(e) => setBillNo(e.target.value)}
                        placeholder="e.g. 5521"
                        className="h-9 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold">Purchase Date</label>
                      <Input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        className="h-9 mt-1 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Add Product Line to Purchase (SDD §7.10) */}
                <div className="p-3 bg-muted/30 border rounded-lg space-y-3">
                  <div className="text-xs font-semibold">Add Purchase Item</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground">Select Product</label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => {
                          setSelectedProductId(e.target.value);
                          const p = products.find((x) => x.id === e.target.value);
                          if (p) setLineRate(p.last_purchase_rate_carton || p.sale_rate_carton);
                        }}
                        className="w-full h-9 px-3 rounded-md border border-input text-xs bg-background mt-0.5"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] text-muted-foreground">Quantity</label>
                        <Input
                          type="number"
                          min={1}
                          value={lineQty}
                          onChange={(e) => setLineQty(parseInt(e.target.value, 10) || 1)}
                          className="h-9 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">Unit</label>
                        <select
                          value={lineUnit}
                          onChange={(e) => setLineUnit(e.target.value as any)}
                          className="w-full h-9 px-2 rounded-md border border-input text-xs bg-background mt-0.5"
                        >
                          <option value="CARTON">Carton</option>
                          <option value="PIECE">Piece</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">Rate (Ctn)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={lineRate}
                          onChange={(e) => setLineRate(parseFloat(e.target.value) || 0)}
                          className="h-9 font-bold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rate UP/DOWN indicator (SDD §7.10) */}
                  {rateDiff && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>Last Purchase Rate: {formatCurrency(currentProd?.last_purchase_rate_carton)}</span>
                        <span>$\rightarrow$</span>
                        {rateDiff.diff === 0 ? (
                          <span className="text-muted-foreground">Same rate</span>
                        ) : rateDiff.isUp ? (
                          <span className="text-red-600 flex items-center font-bold">
                            <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> UP by {formatCurrency(rateDiff.diff)} (+{rateDiff.pct}%)
                          </span>
                        ) : (
                          <span className="text-emerald-600 flex items-center font-bold">
                            <TrendingDown className="h-3.5 w-3.5 mr-0.5" /> DOWN by {formatCurrency(Math.abs(rateDiff.diff))} ({rateDiff.pct}%)
                          </span>
                        )}
                      </div>

                      <Button type="button" size="sm" onClick={handleAddLine} className="gap-1 h-8">
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Items Added Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Rate / Ctn</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-16 text-center text-xs text-muted-foreground">
                          No items added yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold text-xs">{it.product_name}</TableCell>
                          <TableCell className="text-xs font-mono">{it.qty} {it.entered_unit.toLowerCase()}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{formatCurrency(it.rate_per_carton)}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-xs">
                            {formatCurrency(it.qty * it.rate_per_carton)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Payment Summary */}
                {purchaseType === "NORMAL" && (
                  <div className="p-3 bg-muted/20 border rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-xs">
                    <div>
                      <span className="text-muted-foreground">Total Bill:</span>
                      <div className="text-lg font-bold font-mono text-foreground">{formatCurrency(grandTotal)}</div>
                    </div>

                    <div>
                      <label className="font-semibold">Paid Now (Rs)</label>
                      <Input
                        type="number"
                        min={0}
                        max={grandTotal}
                        value={paidNow}
                        onChange={(e) => setPaidNow(parseFloat(e.target.value) || 0)}
                        className="h-8 font-semibold mt-1"
                      />
                    </div>

                    <div>
                      <span className="text-muted-foreground">Remaining Payable:</span>
                      <div className="text-lg font-bold font-mono text-purple-700 dark:text-purple-400">
                        {formatCurrency(remainingPayable)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving || items.length === 0} className="font-bold">
                    {saving ? "Saving..." : "Save Purchase & Update Stock"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
