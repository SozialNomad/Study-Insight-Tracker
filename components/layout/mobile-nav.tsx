"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Panel" },
  { href: "/study/new", label: "Yeni" },
  { href: "/analytics", label: "Grafik" },
  { href: "/ai-reports", label: "AI" }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-3xl border bg-white/90 p-2 shadow-soft backdrop-blur lg:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-2xl px-3 py-2 text-center text-xs font-bold",
            pathname === item.href ? "bg-primary text-white" : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
