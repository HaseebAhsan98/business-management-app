"use client";

import { useState } from "react";
import Link from "next/link";
import { Customer, Area } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  AlertTriangle,
  GitMerge,
  Edit,
  ExternalLink,
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
import { saveParty, checkDuplicateParty, mergeParties } from "./actions";

interface PartiesClientProps {
  initialParties: Customer[];
  areas: Area[];
}

export function PartiesClient({ initialParties, areas }: PartiesClientProps) {
  const [parties, setParties] = useState<Customer[]>(initialParties);
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState("all");
  const [hasBalanceOnly, setHasBalanceOnly] = useState(false);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Duplicate warning state
  const [nameInput, setNameInput] = useState("");
  const [areaInput, setAreaInput] = useState(areas[0]?.id || "");
  const [duplicateWarning, setDuplicateWarning] = useState<any[]>([]);

  // Merge modal selection
  const [keepId, setKeepId] = useState("");
  const [mergeId, setMergeId] = useState("");

  const filtered = parties.filter((p) => {
    if (selectedArea !== "all" && p.area_id !== selectedArea) return false;
    if (hasBalanceOnly && p.opening_balance_remaining <= 0) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.shop_name.toLowerCase().includes(q) ||
        p.party_code.toLowerCase().includes(q) ||
        (p.phone && p.phone.includes(q))
      );
    }
    return true;
  });

  async function handleNameBlur() {
    if (nameInput.trim() && areaInput) {
      const duplicates = await checkDuplicateParty(nameInput, areaInput);
      setDuplicateWarning(duplicates.filter((d) => d.id !== editingParty?.id));
    }
  }

  async function handleSaveParty(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    const result = await saveParty(formData);

    if (result.error) {
      setModalError(result.error);
      setSaving(false);
    } else {
      setModalOpen(false);
      setSaving(false);
      window.location.reload();
    }
  }

  async function handleMergeSubmit() {
    if (!keepId || !mergeId || keepId === mergeId) {
      alert("Please select two distinct accounts to merge");
      return;
    }
    setSaving(true);
    const result = await mergeParties(keepId, mergeId);
    setSaving(false);
    if (result.error) {
      alert(result.error);
    } else {
      alert("Parties successfully merged!");
      setMergeModalOpen(false);
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Parties & Customers</h2>
          <p className="text-sm text-muted-foreground">
            Customer directory, credit limits, pricing rules, and ledgers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setKeepId(parties[0]?.id || "");
              setMergeId(parties[1]?.id || "");
              setMergeModalOpen(true);
            }}
          >
            <GitMerge className="h-4 w-4 text-purple-600" />
            <span>Merge Parties</span>
          </Button>

          <Button
            className="gap-2 font-semibold"
            onClick={() => {
              setEditingParty(null);
              setNameInput("");
              setDuplicateWarning([]);
              setModalError(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Add Party</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, shop, code, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
          >
            <option value="all">All Areas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasBalanceOnly}
              onChange={(e) => setHasBalanceOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>Show Only Parties with Balance</span>
          </label>
        </div>
      </Card>

      {/* Parties Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Showing {filtered.length} Parties
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Party Code</TableHead>
                <TableHead>Customer / Shop</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Credit Limit</TableHead>
                <TableHead>Default Margin</TableHead>
                <TableHead className="text-right">Balance Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No parties found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {p.party_code}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.shop_name}</div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {p.area?.name || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {p.phone || <span className="text-muted-foreground italic">None</span>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {p.credit_days_limit > 0 ? `${p.credit_days_limit} days` : "Cash Only"}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      +{formatCurrency(p.default_profit_per_carton)} / ctn
                    </TableCell>
                    <TableCell className="text-right font-bold font-mono">
                      {p.opening_balance_remaining > 0 ? (
                        <span className="text-amber-700 dark:text-amber-400">
                          {formatCurrency(p.opening_balance_remaining)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Rs 0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/parties/${p.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                            <span>Ledger</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingParty(p);
                            setNameInput(p.name);
                            setAreaInput(p.area_id);
                            setDuplicateWarning([]);
                            setModalError(null);
                            setModalOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add / Edit Party Modal with Duplicate Detection */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg shadow-xl bg-card border max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingParty ? "Edit Party" : "Add New Party"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveParty} className="space-y-4">
                {editingParty && <input type="hidden" name="id" value={editingParty.id} />}

                {modalError && (
                  <div className="p-3 text-xs text-destructive bg-destructive/10 rounded-md">
                    {modalError}
                  </div>
                )}

                {/* Duplicate Party Warning Alert (SDD §7.7) */}
                {duplicateWarning.length > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Duplicate check: Similar party found in this area!</span>
                    </div>
                    <p className="text-muted-foreground">
                      Is this the same party as:{" "}
                      <strong>
                        {duplicateWarning.map((d) => `${d.name} (${d.shop_name})`).join(", ")}
                      </strong>
                      ?
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold">Area *</label>
                    <select
                      name="area_id"
                      required
                      value={areaInput}
                      onChange={(e) => {
                        setAreaInput(e.target.value);
                        handleNameBlur();
                      }}
                      className="w-full h-9 px-3 rounded-md border border-input text-sm bg-background mt-1"
                    >
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold">Party Name *</label>
                    <Input
                      name="name"
                      required
                      placeholder="e.g. Iqbal Ahmed"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onBlur={handleNameBlur}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold">Shop Name *</label>
                    <Input
                      name="shop_name"
                      required
                      placeholder="e.g. Iqbal Karyana Store"
                      defaultValue={editingParty?.shop_name || ""}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold">Phone (Optional)</label>
                    <Input
                      name="phone"
                      placeholder="e.g. 03001234567"
                      defaultValue={editingParty?.phone || ""}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Address</label>
                  <Input
                    name="address"
                    placeholder="e.g. Main Bazar, Landhi #3"
                    defaultValue={editingParty?.address || ""}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold">Credit Limit (Days)</label>
                    <Input
                      name="credit_days_limit"
                      type="number"
                      min={0}
                      defaultValue={editingParty?.credit_days_limit ?? 15}
                    />
                    <span className="text-[10px] text-muted-foreground">0 = Cash only</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold">Default Profit/Ctn</label>
                    <Input
                      name="default_profit_per_carton"
                      type="number"
                      step="0.01"
                      defaultValue={editingParty?.default_profit_per_carton ?? 40}
                    />
                    <span className="text-[10px] text-muted-foreground">Added to purchase cost</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold">Opening Balance</label>
                    <Input
                      name="opening_balance"
                      type="number"
                      step="0.01"
                      disabled={!!editingParty}
                      defaultValue={editingParty?.opening_balance ?? 0}
                    />
                    <span className="text-[10px] text-muted-foreground">Old ledger debt</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Notes</label>
                  <Input
                    name="notes"
                    placeholder="Optional business notes..."
                    defaultValue={editingParty?.notes || ""}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Party"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Merge Parties Modal (Owner Only, SDD §7.7) */}
      {mergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-xl bg-card border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitMerge className="h-5 w-5 text-purple-600" />
                <span>Merge Duplicate Parties</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                All orders, payments, running balances, and price rules from the merged account will move to the surviving account. The merged account will be deactivated.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-semibold">Surviving Account (Keep)</label>
                <select
                  value={keepId}
                  onChange={(e) => setKeepId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input text-sm bg-background"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.shop_name} ({p.party_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-destructive">Account to Merge (Deactivate)</label>
                <select
                  value={mergeId}
                  onChange={(e) => setMergeId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input text-sm bg-background"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.shop_name} ({p.party_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setMergeModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleMergeSubmit} disabled={saving} variant="destructive">
                  {saving ? "Merging..." : "Confirm & Merge"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
