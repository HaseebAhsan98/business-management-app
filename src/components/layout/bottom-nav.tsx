"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Layers,
  Menu,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/database";

interface BottomNavProps {
  role: UserRole;
  pendingAlertsCount?: number;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Home",
      href: role === "SALESMAN" ? "/orders/new" : "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Orders",
      href: "/orders",
      icon: ShoppingCart,
    },
    {
      name: "Parties",
      href: "/parties",
      icon: Users,
    },
    {
      name: "Stock",
      href: "/stock",
      icon: Layers,
      hideForSalesman: true,
    },
    {
      name: "More",
      href: "/more",
      icon: Menu,
    },
  ];

  const visibleItems = navItems.filter((i) => !(i.hideForSalesman && role === "SALESMAN"));

  return (
    <>
      {/* Sticky Floating + New Order Button for Mobile */}
      <div className="fixed bottom-20 right-4 lg:hidden z-40">
        <Link href="/orders/new">
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all">
            <PlusCircle className="h-5 w-5" />
            <span>+ Order</span>
          </button>
        </Link>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur z-30 h-16 flex items-center justify-around px-2 shadow-sm">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
