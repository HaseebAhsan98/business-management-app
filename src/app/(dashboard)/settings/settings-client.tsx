"use client";

import { useState } from "react";
import { Area, Category, Company } from "@/types/database";
import { Settings, Building, MapPin, Layers, ShieldCheck, Save, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SettingsClientProps {
  areas: Area[];
  categories: Category[];
  companies: Company[];
}

export function SettingsClient({
  areas,
  categories,
  companies,
}: SettingsClientProps) {
  const [profitBasis, setProfitBasis] = useState<"LAST_PURCHASE" | "FIFO">("LAST_PURCHASE");
  const [savedNotice, setSavedNotice] = useState(false);

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Settings & Rules</h2>
        <p className="text-sm text-muted-foreground">
          Business profile, financial rules, and master lookup configuration
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>Settings successfully updated!</span>
        </div>
      )}

      {/* Business Profile (SDD §7.15) */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" />
            <span>Business Profile & Invoices</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold">Trading Business Name</label>
                <Input defaultValue="Al-Rehman Trading Co." className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold">Contact Phone</label>
                <Input defaultValue="+92-300-1234567" className="mt-1 font-mono" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold">Godown / Shop Address</label>
              <Input defaultValue="Plot 42, Main Wholesale Market, Karachi" className="mt-1" />
            </div>

            <div>
              <label className="text-xs font-semibold">Invoice Footer Note</label>
              <Input
                defaultValue="Thank you for your business. Terms: No returns on loose items."
                className="mt-1"
              />
            </div>

            <div className="pt-2 border-t flex justify-end">
              <Button type="submit" size="sm" className="gap-1.5 font-bold">
                <Save className="h-4 w-4" />
                <span>Save Business Profile</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Business Rules (SDD §7.15, §8.4) */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Profit & Accounting Rules</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold">Profit Calculation Cost Basis (SDD §8.4)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setProfitBasis("LAST_PURCHASE")}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  profitBasis === "LAST_PURCHASE"
                    ? "border-primary bg-primary/5"
                    : "border-input bg-card hover:bg-muted/30"
                }`}
              >
                <div className="font-bold text-xs text-foreground">Latest Purchase Rate (Default)</div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Line profit is calculated using the latest purchase cost at the moment of delivery.
                </p>
              </div>

              <div
                onClick={() => setProfitBasis("FIFO")}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  profitBasis === "FIFO"
                    ? "border-primary bg-primary/5"
                    : "border-input bg-card hover:bg-muted/30"
                }`}
              >
                <div className="font-bold text-xs text-foreground">FIFO Real Batch Cost</div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Line profit is calculated using the actual weighted cost of the consumed inventory batches.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold">Daily Notification Time</label>
              <Input defaultValue="09:00 AM" className="mt-1 text-xs font-mono" />
            </div>
            <div>
              <label className="text-xs font-semibold">Invoice Number Prefix</label>
              <Input defaultValue="ORD-" className="mt-1 text-xs font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
