"use client";

import Link from "next/link";
import { UserRole } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, PlusCircle, LogOut } from "lucide-react";

interface HeaderProps {
  role?: UserRole;
  userName?: string;
  title?: string;
}

export function Header({ role = "OWNER", userName = "Admin", title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b bg-card/95 backdrop-blur px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden font-bold text-primary">
          <Package className="h-5 w-5" />
          <span>TradeMaster</span>
        </Link>
        {title && <h1 className="hidden sm:block text-lg font-bold tracking-tight text-foreground">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        <Link href="/orders/new" className="hidden sm:inline-flex">
          <Button size="sm" className="gap-1.5 font-semibold">
            <PlusCircle className="h-4 w-4" />
            <span>New Order</span>
          </Button>
        </Link>

        <div className="flex items-center gap-2 pl-2 border-l">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold">{userName}</div>
            <Badge variant="outline" className="text-[10px] uppercase font-mono px-1 py-0">
              {role}
            </Badge>
          </div>
          <Link href="/auth/logout">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
