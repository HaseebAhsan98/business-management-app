"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Layers,
  Truck,
  CreditCard,
  Bell,
  FileBarChart,
  Settings,
  ShieldAlert,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/types/database";

interface SidebarProps {
  role: UserRole;
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["OWNER", "MANAGER", "SALESMAN"],
    },
    {
      name: "Orders",
      href: "/orders",
      icon: ShoppingCart,
      roles: ["OWNER", "MANAGER", "SALESMAN"],
    },
    {
      name: "Parties (Customers)",
      href: "/parties",
      icon: Users,
      roles: ["OWNER", "MANAGER", "SALESMAN"],
    },
    {
      name: "Products",
      href: "/products",
      icon: Package,
      roles: ["OWNER", "MANAGER"],
    },
    {
      name: "Stock Overview",
      href: "/stock",
      icon: Layers,
      roles: ["OWNER", "MANAGER"],
    },
    {
      name: "Purchases",
      href: "/purchases",
      icon: Truck,
      roles: ["OWNER", "MANAGER"],
    },
    {
      name: "Payments & Receipts",
      href: "/payments",
      icon: CreditCard,
      roles: ["OWNER", "MANAGER", "SALESMAN"],
    },
    {
      name: "Recovery Reminders",
      href: "/reminders",
      icon: Bell,
      roles: ["OWNER", "MANAGER"],
    },
    {
      name: "Reports & Daybook",
      href: "/reports",
      icon: FileBarChart,
      roles: ["OWNER", "MANAGER"],
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["OWNER"],
    },
    {
      name: "Audit Log",
      href: "/audit-log",
      icon: ShieldAlert,
      roles: ["OWNER"],
    },
  ];

  const filteredNav = navigation.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r bg-card z-30">
      <div className="flex h-16 items-center px-6 border-b justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Package className="h-6 w-6" />
          <span>TradeMaster</span>
        </Link>
      </div>

      <div className="p-4 border-b">
        <Link href="/orders/new">
          <Button className="w-full gap-2 shadow-sm font-semibold" size="lg">
            <PlusCircle className="h-5 w-5" />
            + New Order
          </Button>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground text-sm">{userName}</p>
            <p className="capitalize text-xs font-mono">{role.toLowerCase()}</p>
          </div>
          <Link href="/auth/logout">
            <Button variant="ghost" size="sm" className="text-xs text-destructive hover:bg-destructive/10">
              Sign out
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
