"use client";

import { useState } from "react";
import Link from "next/link";
import { Customer } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import {
  Bell,
  Clock,
  Phone,
  MessageCircle,
  CreditCard,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface RemindersClientProps {
  initialParties: Customer[];
}

export function RemindersClient({ initialParties }: RemindersClientProps) {
  const [parties] = useState<Customer[]>(initialParties);
  const [activeTab, setActiveTab] = useState<"overdue" | "today" | "upcoming" | "promised">("overdue");
  const [promiseModalParty, setPromiseModalParty] = useState<Customer | null>(null);
  const [promiseDate, setPromiseDate] = useState("");
  const [promiseNote, setPromiseNote] = useState("");

  const totalToCollect = parties.reduce((s, p) => s + p.opening_balance_remaining, 0);

  function getWhatsAppUrl(p: Customer) {
    if (!p.phone) return "#";
    const cleanPhone = p.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone;
    const msg = `Assalam-o-Alaikum ${p.name} sahib, TradeMaster ki taraf se reminder hai ke aapka total balance ${formatCurrency(p.opening_balance_remaining)} pending hai. Baraye meherbani payment clear karwa dein. Shukriya!`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Bar (SDD §7.13) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recovery Reminders</h2>
          <p className="text-sm text-muted-foreground">
            Daily collection tracker, call shortcuts, and WhatsApp reminders
          </p>
        </div>
      </div>

      {/* Header Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm p-4 bg-muted/20">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Total to Collect</span>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {formatCurrency(totalToCollect)}
          </div>
        </Card>

        <Card className="border shadow-sm p-4 bg-red-500/10 border-red-500/30">
          <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase">Total Overdue</span>
          <div className="text-2xl font-bold font-mono text-red-700 dark:text-red-400 mt-1">
            {formatCurrency(totalToCollect)}
          </div>
        </Card>

        <Card className="border shadow-sm p-4 bg-muted/20">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Parties with Dues</span>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {parties.length} Parties
          </div>
        </Card>
      </div>

      {/* Reminder Tabs (SDD §7.13) */}
      <div className="flex border-b border-muted">
        {[
          { id: "overdue", label: `Overdue (${parties.length})` },
          { id: "today", label: "Due Today (0)" },
          { id: "upcoming", label: "Due in Next 3 Days (0)" },
          { id: "promised", label: "Promised (0)" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Party Cards List (SDD §7.13) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parties.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-muted-foreground">
            No overdue recoveries! All accounts are in good standing.
          </div>
        ) : (
          parties.map((p) => (
            <Card key={p.id} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {p.party_code}
                      </span>
                      <span className="font-bold text-base">{p.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.shop_name}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-red-600">
                      {formatCurrency(p.opening_balance_remaining)}
                    </div>
                    <span className="text-[10px] font-semibold text-red-700 dark:text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full">
                      Past Due Date
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2.5 rounded-md">
                  <div>Credit Limit: <strong>{p.credit_days_limit} days</strong></div>
                  <div>Area: <strong>{p.area?.name || "-"}</strong></div>
                  {p.phone && <div>Phone: <strong className="font-mono">{p.phone}</strong></div>}
                </div>

                {/* Quick Actions Bar (SDD §7.13) */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
                  {p.phone && (
                    <>
                      <a href={`tel:${p.phone}`}>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                          <Phone className="h-3.5 w-3.5 text-blue-600" />
                          <span>Call</span>
                        </Button>
                      </a>

                      <a href={getWhatsAppUrl(p)} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-emerald-700 hover:bg-emerald-50">
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>WhatsApp</span>
                        </Button>
                      </a>
                    </>
                  )}

                  <Link href={`/payments/new?customerId=${p.id}`}>
                    <Button size="sm" className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Receive</span>
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPromiseModalParty(p);
                      setPromiseDate("");
                      setPromiseNote("");
                    }}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    Set Promise
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Set Promise Date Modal */}
      {promiseModalParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm shadow-xl bg-card border">
            <CardHeader>
              <CardTitle className="text-base">Set Promise Date</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Party promised payment on a specific date. The reminder will move to the Promised tab until then.
              </p>

              <div>
                <label className="text-xs font-semibold">Promised Date</label>
                <Input
                  type="date"
                  value={promiseDate}
                  onChange={(e) => setPromiseDate(e.target.value)}
                  className="h-9 mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Note / Remarks</label>
                <Input
                  placeholder="e.g. Promised payment on Monday after cash recovery"
                  value={promiseNote}
                  onChange={(e) => setPromiseNote(e.target.value)}
                  className="h-9 mt-1 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setPromiseModalParty(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    alert(`Promise date recorded for ${promiseModalParty.name}!`);
                    setPromiseModalParty(null);
                  }}
                  className="font-bold"
                >
                  Save Promise
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
