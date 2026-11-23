"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomerPayment } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, Plus, Search, CheckCircle, ArrowRight } from "lucide-react";
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

interface PaymentsClientProps {
  initialPayments: CustomerPayment[];
}

export function PaymentsClient({ initialPayments }: PaymentsClientProps) {
  const [payments] = useState<CustomerPayment[]>(initialPayments);
  const [search, setSearch] = useState("");

  const filtered = payments.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.receipt_no.toLowerCase().includes(q) ||
        (p.customer?.name && p.customer.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payments & Collections</h2>
          <p className="text-sm text-muted-foreground">
            Customer receipt history and running ledger updates
          </p>
        </div>

        <Link href="/payments/new">
          <Button className="gap-2 font-semibold">
            <Plus className="h-4 w-4" />
            <span>Receive Payment</span>
          </Button>
        </Link>
      </div>

      <Card className="border shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search receipt no or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <Card className="border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer / Shop</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount Received</TableHead>
              <TableHead className="text-right">Balance After</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No payment receipts recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs font-bold text-primary">
                    {p.receipt_no}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{formatDate(p.payment_date)}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm">{p.customer?.name}</div>
                    <div className="text-[11px] text-muted-foreground">{p.customer?.shop_name}</div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold">{p.method}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm text-emerald-600">
                    {formatCurrency(p.amount)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatCurrency(p.balance_after)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={p.status === "ACTIVE" ? "success" : "destructive"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
