"use client";

import { useState } from "react";
import { Product, Category, Company } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Edit,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
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
import { saveProduct, toggleProductActive, bulkRateUpdate } from "./actions";

interface ProductsClientProps {
  initialProducts: Product[];
  categories: Category[];
  companies: Company[];
}

export function ProductsClient({
  initialProducts,
  categories,
  companies,
}: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState("all");

  // Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Bulk rate update state
  const [bulkType, setBulkType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [bulkAmount, setBulkAmount] = useState<number>(5);

  const filtered = products.filter((p) => {
    if (selectedCategory !== "all" && p.category_id !== selectedCategory) return false;
    if (selectedCompany !== "all" && p.company_id !== selectedCompany) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.flavour && p.flavour.toLowerCase().includes(q))
      );
    }
    return true;
  });

  async function handleSaveProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    const result = await saveProduct(formData);

    if (result.error) {
      setModalError(result.error);
      setSaving(false);
    } else {
      setEditModalOpen(false);
      setSaving(false);
      window.location.reload();
    }
  }

  async function handleToggleActive(p: Product) {
    await toggleProductActive(p.id, p.is_active);
    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, is_active: !item.is_active } : item))
    );
  }

  async function handleBulkRateSubmit() {
    setSaving(true);
    const result = await bulkRateUpdate({
      category_id: selectedCategory,
      company_id: selectedCompany,
      type: bulkType,
      amount: bulkAmount,
    });
    setSaving(false);
    if (result.error) {
      alert(result.error);
    } else {
      alert(`Successfully updated ${result.count} products!`);
      setBulkModalOpen(false);
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products & Pricing</h2>
          <p className="text-sm text-muted-foreground">
            Manage product variants, carton rates, and bulk price updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setBulkModalOpen(true)}
          >
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span>Bulk Rate Update</span>
          </Button>

          <Button
            className="gap-2 font-semibold"
            onClick={() => {
              setEditingProduct(null);
              setModalError(null);
              setEditModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search product, SKU, or flavour..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="all">All Brands / Companies</option>
            {companies.map((co) => (
              <option key={co.id} value={co.id}>
                {co.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Showing {filtered.length} Products
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Pack / Size</TableHead>
                <TableHead>Pcs/Ctn</TableHead>
                <TableHead className="text-right">Last Cost (Ctn)</TableHead>
                <TableHead className="text-right">Sale Rate (Ctn)</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No products found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.company?.name || "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {p.flavour ? `${p.flavour} (${p.pack_size || ""})` : p.pack_size || "-"}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{p.pieces_per_carton} pcs</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground font-mono">
                      {p.last_purchase_rate_carton > 0 ? formatCurrency(p.last_purchase_rate_carton) : "Rs 0"}
                    </TableCell>
                    <TableCell className="text-right font-bold font-mono text-foreground">
                      {formatCurrency(p.sale_rate_carton)}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className="cursor-pointer inline-flex items-center"
                        title={p.is_active ? "Click to deactivate" : "Click to activate"}
                      >
                        {p.is_active ? (
                          <Badge variant="success" className="gap-1 cursor-pointer">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="gap-1 cursor-pointer">
                            <XCircle className="h-3 w-3" /> Inactive
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProduct(p);
                          setModalError(null);
                          setEditModalOpen(true);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add / Edit Product Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg shadow-xl bg-card border">
            <CardHeader>
              <CardTitle>{editingProduct ? "Edit Product" : "Add New Product"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                {editingProduct && <input type="hidden" name="id" value={editingProduct.id} />}

                {modalError && (
                  <div className="p-3 text-xs text-destructive bg-destructive/10 rounded-md">
                    {modalError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold">Category *</label>
                    <select
                      name="category_id"
                      required
                      defaultValue={editingProduct?.category_id || categories[0]?.id}
                      className="w-full h-9 px-3 rounded-md border border-input text-sm bg-background mt-1"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold">Brand / Company *</label>
                    <select
                      name="company_id"
                      required
                      defaultValue={editingProduct?.company_id || companies[0]?.id}
                      className="w-full h-9 px-3 rounded-md border border-input text-sm bg-background mt-1"
                    >
                      {companies.map((co) => (
                        <option key={co.id} value={co.id}>
                          {co.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Product Name *</label>
                  <Input
                    name="name"
                    required
                    placeholder="e.g. Sting Red Energy"
                    defaultValue={editingProduct?.name || ""}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold">SKU Code *</label>
                    <Input
                      name="sku"
                      required
                      placeholder="e.g. STING-RED-1.5L"
                      defaultValue={editingProduct?.sku || ""}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Flavour</label>
                    <Input
                      name="flavour"
                      placeholder="e.g. Berry"
                      defaultValue={editingProduct?.flavour || ""}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Pack Size</label>
                    <Input
                      name="pack_size"
                      placeholder="e.g. 1.5L"
                      defaultValue={editingProduct?.pack_size || ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold">Pieces / Carton *</label>
                    <Input
                      name="pieces_per_carton"
                      type="number"
                      required
                      min={1}
                      defaultValue={editingProduct?.pieces_per_carton || 6}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Sale Rate (Carton) *</label>
                    <Input
                      name="sale_rate_carton"
                      type="number"
                      step="0.01"
                      required
                      defaultValue={editingProduct?.sale_rate_carton || ""}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Min Alert Stock</label>
                    <Input
                      name="min_stock_pieces"
                      type="number"
                      defaultValue={editingProduct?.min_stock_pieces || 30}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Product"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Rate Update Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-xl bg-card border">
            <CardHeader>
              <CardTitle>Bulk Rate Update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Apply price change across selected filters:
                <br />
                <strong>Category:</strong> {selectedCategory === "all" ? "All" : categories.find(c => c.id === selectedCategory)?.name}
                <br />
                <strong>Brand:</strong> {selectedCompany === "all" ? "All" : companies.find(co => co.id === selectedCompany)?.name}
              </p>

              <div className="space-y-2">
                <label className="text-xs font-semibold">Change Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkType("PERCENT")}
                    className={`p-2 text-xs font-semibold rounded-md border ${
                      bulkType === "PERCENT" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkType("FIXED")}
                    className={`p-2 text-xs font-semibold rounded-md border ${
                      bulkType === "FIXED" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    Fixed Amount (Rs)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">
                  {bulkType === "PERCENT" ? "Percentage (+/- %)" : "Amount (+/- Rs per carton)"}
                </label>
                <Input
                  type="number"
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 5 or -10"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setBulkModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkRateSubmit} disabled={saving}>
                  {saving ? "Applying..." : "Apply Rate Change"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
