"use client";

import Link from "next/link";
import {
  Bell,
  CreditCard,
  FileBarChart,
  Settings,
  ShieldAlert,
  Package,
  Layers,
  Truck,
  Users,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MoreMenuPage() {
  const menuSections = [
    {
      title: "Operations & Master Data",
      items: [
        { name: "Products & Rates", href: "/products", icon: Package },
        { name: "Stock & Godown Batches", href: "/stock", icon: Layers },
        { name: "Purchases & Inward Stock", href: "/purchases", icon: Truck },
        { name: "Parties & Customers", href: "/parties", icon: Users },
      ],
    },
    {
      title: "Finance & Recovery",
      items: [
        { name: "Recovery Reminders", href: "/reminders", icon: Bell, badge: "3 Overdue" },
        { name: "Payments & Collections", href: "/payments", icon: CreditCard },
        { name: "Reports & Daybook", href: "/reports", icon: FileBarChart },
      ],
    },
    {
      title: "Administration",
      items: [
        { name: "Settings & Profile", href: "/settings", icon: Settings },
        { name: "Security Audit Log", href: "/audit-log", icon: ShieldAlert },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h2 className="text-xl font-bold">More Options</h2>
        <p className="text-xs text-muted-foreground">System navigation & administration</p>
      </div>

      <div className="space-y-4">
        {menuSections.map((sec) => (
          <div key={sec.title} className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {sec.title}
            </h3>
            <Card className="border shadow-sm divide-y">
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="text-[11px] font-bold text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </Card>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <Link href="/auth/logout">
          <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </Link>
      </div>
    </div>
  );
}
