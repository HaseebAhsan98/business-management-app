"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Package,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Layers,
  FileText,
  Calendar,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type DateRange = "today" | "this-week" | "this-month" | "last-month" | "custom";

export default function DashboardPage() {
  const [range, setRange] = useState<DateRange>("this-month");

  // Summary Metrics (Default Phase 1 / Seed Baseline)
  const metrics = {
    todaySale: 45000,
    monthSale: 384500,
    monthProfit: 46200,
    totalMarketCredit: 63500,
    overdueAmount: 20000,
    supplierPayable: 32500,
    cashReceivedToday: 20000,
    stockValue: 512000,
  };

  const topParties = [
    { code: "P-0001", name: "Iqbal Karyana Store", area: "Landhi", sales: 85000, credit: 10000 },
    { code: "P-0005", name: "Madina Milk & Bakers", area: "Korangi", sales: 64000, credit: 15000 },
    { code: "P-0010", name: "Lucky Departmental Store", area: "Saddar", sales: 52000, credit: 25000 },
    { code: "P-0007", name: "Farhan Karyana", area: "Malir", sales: 38000, credit: 8500 },
  ];

  const topProducts = [
    { name: "Sting Red Energy 1.5L", sku: "STING-RED-1.5L", qty: "180 ctn", total: 198000 },
    { name: "Pepsi Regular 1.5L", sku: "PEPSI-REG-1.5L", qty: "110 ctn", total: 132000 },
    { name: "Peek Freans Sooper", sku: "EBM-SOOPER-NORM", qty: "45 ctn", total: 64800 },
    { name: "Century A4 70gsm", sku: "CENTURY-A4-70GSM", qty: "12 reams", total: 54000 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Business Overview</h2>
          <p className="text-sm text-muted-foreground">Real-time trading and financial metrics</p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-muted p-1 rounded-lg border">
          {(
            [
              { id: "today", label: "Today" },
              { id: "this-week", label: "This Week" },
              { id: "this-month", label: "This Month" },
              { id: "last-month", label: "Last Month" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setRange(t.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                range === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Operational Alerts Bar (SDD §7.2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link href="/reminders" className="block">
          <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl hover:bg-amber-500/15 transition-colors">
            <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="text-sm font-semibold">Overdue Bills (3 Parties)</span>
            </div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
              {formatCurrency(metrics.overdueAmount)}
            </span>
          </div>
        </Link>

        <Link href="/orders?status=PENDING" className="block">
          <div className="flex items-center justify-between p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/15 transition-colors">
            <div className="flex items-center gap-2.5 text-blue-800 dark:text-blue-300">
              <Truck className="h-4 w-4 shrink-0" />
              <span className="text-sm font-semibold">Pending Deliveries</span>
            </div>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">
              4 Orders
            </span>
          </div>
        </Link>

        <Link href="/stock?filter=low" className="block">
          <div className="flex items-center justify-between p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/15 transition-colors">
            <div className="flex items-center gap-2.5 text-red-800 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-semibold">Low Stock Warnings</span>
            </div>
            <span className="text-xs font-bold text-red-700 dark:text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full">
              2 SKUs
            </span>
          </div>
        </Link>
      </div>

      {/* 8 Primary Financial Cards (SDD §7.2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sale */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Today's Sale</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(metrics.todaySale)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Daily billing total</p>
          </CardContent>
        </Card>

        {/* This Month's Sale */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Month's Sale</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(metrics.monthSale)}</div>
            <p className="text-[11px] text-emerald-600 flex items-center font-medium mt-1">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> +14% vs last month
            </p>
          </CardContent>
        </Card>

        {/* This Month's Profit */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Month's Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">{formatCurrency(metrics.monthProfit)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Margin: ~12.0%</p>
          </CardContent>
        </Card>

        {/* Cash Received Today */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Cash In Today</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(metrics.cashReceivedToday)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Counter + Recovery receipts</p>
          </CardContent>
        </Card>

        {/* Total Market Credit (Receivables) */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Market Credit</CardTitle>
            <Users className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400">
              {formatCurrency(metrics.totalMarketCredit)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Total owed by all parties</p>
          </CardContent>
        </Card>

        {/* Overdue Amount */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Overdue Amount</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {formatCurrency(metrics.overdueAmount)}
            </div>
            <p className="text-[11px] text-red-500 mt-1">Past allowed credit days</p>
          </CardContent>
        </Card>

        {/* Supplier Payable */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Supplier Payable</CardTitle>
            <Truck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(metrics.supplierPayable)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Owed to distributors</p>
          </CardContent>
        </Card>

        {/* Stock Value */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Stock Value</CardTitle>
            <Layers className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(metrics.stockValue)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Cost basis in godown</p>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Summary Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Parties by Credit & Sales */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Top Parties</CardTitle>
              <CardDescription className="text-xs">Sales and outstanding credit balances</CardDescription>
            </div>
            <Link href="/parties">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View all <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {topParties.map((p) => (
                <div key={p.code} className="flex items-center justify-between p-3.5 hover:bg-muted/30">
                  <div>
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="font-mono text-[11px]">{p.code}</span>
                      <span>•</span>
                      <span>{p.area}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">{formatCurrency(p.sales)}</div>
                    <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      Owes {formatCurrency(p.credit)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Top Selling Products</CardTitle>
              <CardDescription className="text-xs">Volume and gross revenue</CardDescription>
            </div>
            <Link href="/products">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View all <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {topProducts.map((prod) => (
                <div key={prod.sku} className="flex items-center justify-between p-3.5 hover:bg-muted/30">
                  <div>
                    <div className="font-semibold text-sm">{prod.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{prod.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{formatCurrency(prod.total)}</div>
                    <div className="text-xs text-muted-foreground font-medium">{prod.qty}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
