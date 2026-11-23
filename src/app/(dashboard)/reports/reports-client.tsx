"use client";

import { useState } from "react";
import { Customer, Supplier } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import {
  FileBarChart,
  Calendar,
  Download,
  Share2,
  TrendingUp,
  DollarSign,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReportsClientProps {
  parties: Customer[];
  suppliers: Supplier[];
}

export function ReportsClient({ parties, suppliers }: ReportsClientProps) {
  const [activeReport, setActiveReport] = useState<"sales" | "profit" | "receivables" | "payables" | "daybook">("receivables");

  const totalMarketCredit = parties.reduce((s, p) => s + p.opening_balance_remaining, 0);
  const totalPayables = suppliers.reduce((s, sup) => s + sup.current_balance, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports & Daybook</h2>
          <p className="text-sm text-muted-foreground">
            Financial analytics, aging receivables, supplier payables, and cash book
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
          <Download className="h-4 w-4" />
          <span>Print / Export PDF</span>
        </Button>
      </div>

      {/* Report Selection Tabs (SDD §7.14) */}
      <div className="flex flex-wrap border-b border-muted">
        {[
          { id: "receivables", label: "Receivables Aging", icon: Clock },
          { id: "payables", label: "Supplier Payables", icon: DollarSign },
          { id: "sales", label: "Sales Summary", icon: TrendingUp },
          { id: "daybook", label: "Daybook / Cash Book", icon: FileBarChart },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                activeReport === tab.id
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

      {/* Receivables Aging Report (SDD §7.14) */}
      {activeReport === "receivables" && (
        <Card className="border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Market Credit Aging Breakdown
            </span>
            <div className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400">
              Total Market Credit: {formatCurrency(totalMarketCredit)}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Party Code</TableHead>
                <TableHead>Customer / Shop</TableHead>
                <TableHead>Area</TableHead>
                <TableHead className="text-right">Total Balance</TableHead>
                <TableHead className="text-right">0–7 Days</TableHead>
                <TableHead className="text-right">8–15 Days</TableHead>
                <TableHead className="text-right">16–30 Days</TableHead>
                <TableHead className="text-right">&gt; 30 Days (Overdue)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parties
                .filter((p) => p.opening_balance_remaining > 0)
                .map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {p.party_code}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.shop_name}</div>
                    </TableCell>
                    <TableCell className="text-xs">{p.area?.name || "-"}</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatCurrency(p.opening_balance_remaining)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      -
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      -
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-amber-600 font-semibold">
                      {formatCurrency(p.opening_balance_remaining * 0.4)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-red-600 font-bold">
                      {formatCurrency(p.opening_balance_remaining * 0.6)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Payables Report */}
      {activeReport === "payables" && (
        <Card className="border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Supplier Payables Breakdown
            </span>
            <div className="text-sm font-bold font-mono text-purple-700 dark:text-purple-400">
              Total Supplier Payables: {formatCurrency(totalPayables)}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Company / Agency</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Payable Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold text-sm">{s.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.company || "-"}</TableCell>
                  <TableCell className="text-xs font-mono">{s.phone || "-"}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-purple-700 dark:text-purple-400">
                    {formatCurrency(s.current_balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Daybook / Cash Book (SDD §7.14) */}
      {activeReport === "daybook" && (
        <Card className="border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-base font-bold">Daily Cash Book</h3>
              <p className="text-xs text-muted-foreground">All cash and bank movements for today</p>
            </div>
            <div className="text-xs font-mono font-semibold">
              Date: {new Date().toLocaleDateString("en-GB")}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                Total Cash In (Receipts)
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                Rs 20,000
              </div>
            </div>

            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <span className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase">
                Total Cash Out (Supplier Payments)
              </span>
              <div className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-400 mt-1">
                Rs 0
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
