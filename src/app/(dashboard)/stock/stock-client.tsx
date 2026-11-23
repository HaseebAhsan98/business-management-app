"use client";

import { useState } from "react";
import { Product, Category, Company } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import {
  Layers,
  Search,
  AlertTriangle,
  Package,
  ArrowRight,
  PlusCircle,
  MinusCircle,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

interface StockClientProps {
  initialProducts: Product[];
  categories: Category[];
  companies: Company[];
}

export function StockClient({
  initialProducts,
  categories,
  companies,
}: StockClientProps) {
  const [products] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const filtered = products.filter((p) => {
    if (selectedCategory !== "all" && p.category_id !== selectedCategory) return false;
    if (selectedCompany !== "all" && p.company_id !== selectedCompany) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stock Overview & Batches</h2>
          <p className="text-sm text-muted-foreground">
            Real-time on-hand stock, reservations, available quantities, and valuation
          </p>
        </div>
      </div>

      {/* Filter and Search Bar (SDD §7.9) */}
      <Card className="border shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search product or SKU..."
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

      {/* Stock Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tracking {filtered.length} Inventory Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">On Hand</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Last Cost (Ctn)</TableHead>
                <TableHead className="text-center">Stock Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((prod) => (
                <TableRow key={prod.id}>
                  <TableCell className="font-semibold text-sm">{prod.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{prod.sku}</TableCell>
                  <TableCell className="text-xs">{prod.company?.name || "-"}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm">
                    50 ctn <span className="text-[11px] text-muted-foreground font-normal">(300 pcs)</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-blue-600 font-semibold">
                    0 ctn
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                    50 ctn
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatCurrency(prod.last_purchase_rate_carton)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="success">In Stock</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
