"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CreditCard,
  DollarSign,
  Home,
  PiggyBank,
  Settings,
} from "lucide-react";
import { AuthButton } from "./auth-button";

const sidebarLinks = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Transactions", href: "/transactions", icon: CreditCard },
  { name: "Savings", href: "/savings", icon: PiggyBank },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <DollarSign className="h-6 w-6 text-green-600" />
          <span className="text-lg">FinanceAI</span>
        </Link>
        <AuthButton />
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                  pathname === link.href &&
                    "bg-muted font-medium text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <div className="rounded-lg bg-muted p-4">
          <h5 className="mb-2 text-sm font-medium">Pro Tip</h5>
          <p className="text-xs text-muted-foreground">
            Set up automatic categorization to save time tracking expenses.
          </p>
        </div>
      </div>
    </div>
  );
}
