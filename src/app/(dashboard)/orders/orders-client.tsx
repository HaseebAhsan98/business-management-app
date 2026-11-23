"use client";

import { useState } from "react";
import Link from "next/link";
import { Order, Customer } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ArrowRight,
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
import { deliverOrder, cancelOrder } from "./actions";

interface OrdersClientProps {
  initialOrders: Order[];
  parties: Customer[];
}

export function OrdersClient({ initialOrders, parties }: OrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [partyFilter, setPartyFilter] = useState("all");

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.delivery_status !== statusFilter) return false;
    if (paymentFilter !== "all" && o.payment_status !== paymentFilter) return false;
    if (partyFilter !== "all" && o.customer_id !== partyFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.order_no.toLowerCase().includes(q) ||
        (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
        (o.customer?.shop_name && o.customer.shop_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalAmountFiltered = filtered.reduce((s, o) => s + o.total, 0);
  const totalBalanceFiltered = filtered.reduce((s, o) => s + o.balance, 0);

  async function handleDeliver(orderId: string) {
    if (!confirm("Confirm order delivery? Stock will be deducted using FIFO.")) return;
    const res = await deliverOrder(orderId);
    if (res.error) {
      alert(res.error);
    } else {
      window.location.reload();
    }
  }

  async function handleCancel(orderId: string) {
    const reason = prompt("Enter cancellation reason:");
    if (!reason) return;
    const res = await cancelOrder(orderId, reason);
    if (res.error) {
      alert(res.error);
    } else {
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders List</h2>
          <p className="text-sm text-muted-foreground">
            Track daily sales, deliveries, and payment status
          </p>
        </div>

        <Link href="/orders/new">
          <Button className="gap-2 font-semibold">
            <Plus className="h-4 w-4" />
            <span>New Order</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar (SDD §7.4) */}
      <Card className="border shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search order no, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Delivery Statuses</option>
            <option value="PENDING">Pending (Reserved)</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">All Payment Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>

          <select
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            value={partyFilter}
            onChange={(e) => setPartyFilter(e.target.value)}
          >
            <option value="all">All Parties</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.shop_name})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Showing {filtered.length} Orders
          </span>
          <div className="text-xs text-muted-foreground space-x-3">
            <span>Total Sales: <strong>{formatCurrency(totalAmountFiltered)}</strong></span>
            <span>•</span>
            <span>Total Unpaid Balance: <strong className="text-amber-700 dark:text-amber-400">{formatCurrency(totalBalanceFiltered)}</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer / Shop</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Balance Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No orders match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {o.order_no}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{formatDate(o.order_date)}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm">{o.customer?.name}</div>
                      <div className="text-[11px] text-muted-foreground">{o.customer?.shop_name}</div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {o.payment_type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.delivery_status === "DELIVERED"
                            ? "success"
                            : o.delivery_status === "PENDING"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {o.delivery_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.payment_status === "PAID"
                            ? "success"
                            : o.payment_status === "PARTIAL"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {o.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm">
                      {formatCurrency(o.total)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                      {o.balance > 0 ? formatCurrency(o.balance) : "Rs 0"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {o.delivery_status === "PENDING" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeliver(o.id)}
                            className="h-8 gap-1 text-xs text-emerald-700 hover:bg-emerald-50"
                          >
                            <Truck className="h-3 w-3" />
                            <span>Deliver</span>
                          </Button>
                        )}
                        {o.delivery_status !== "CANCELLED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(o.id)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            title="Cancel Order"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
