"use client";

import { useState } from "react";
import { Supplier } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import { Truck, Plus, Phone, Building2, MapPin, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { saveSupplier } from "./actions";

interface SuppliersClientProps {
  initialSuppliers: Supplier[];
}

export function SuppliersClient({ initialSuppliers }: SuppliersClientProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  async function handleSaveSupplier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    const result = await saveSupplier(formData);

    if (result.error) {
      setModalError(result.error);
      setSaving(false);
    } else {
      setModalOpen(false);
      setSaving(false);
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Suppliers & Payables</h2>
          <p className="text-sm text-muted-foreground">
            Manage wholesale distributors, company agencies, and payables
          </p>
        </div>

        <Button
          className="gap-2 font-semibold"
          onClick={() => {
            setEditingSupplier(null);
            setModalError(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span>Add Supplier</span>
        </Button>
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier Name</TableHead>
              <TableHead>Company / Agency</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Payable Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold">{s.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {s.company || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{s.phone || "-"}</TableCell>
                  <TableCell className="text-xs">{s.address || "-"}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-purple-700 dark:text-purple-400">
                    {formatCurrency(s.current_balance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingSupplier(s);
                        setModalError(null);
                        setModalOpen(true);
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
      </Card>

      {/* Add / Edit Supplier Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-xl bg-card border">
            <CardHeader>
              <CardTitle>{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSupplier} className="space-y-4">
                {editingSupplier && <input type="hidden" name="id" value={editingSupplier.id} />}

                {modalError && (
                  <div className="p-3 text-xs text-destructive bg-destructive/10 rounded-md">
                    {modalError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Supplier Name *</label>
                  <Input
                    name="name"
                    required
                    placeholder="e.g. Al-Madina Distributors"
                    defaultValue={editingSupplier?.name || ""}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold">Company / Brand</label>
                    <Input
                      name="company"
                      placeholder="e.g. Beverages Wholesale"
                      defaultValue={editingSupplier?.company || ""}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Phone</label>
                    <Input
                      name="phone"
                      placeholder="e.g. 03001234567"
                      defaultValue={editingSupplier?.phone || ""}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Address</label>
                  <Input
                    name="address"
                    placeholder="e.g. Sector 15, Korangi Industrial Area"
                    defaultValue={editingSupplier?.address || ""}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Opening Balance (Payable)</label>
                  <Input
                    name="opening_balance"
                    type="number"
                    step="0.01"
                    disabled={!!editingSupplier}
                    defaultValue={editingSupplier?.opening_balance || 0}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Supplier"}
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
