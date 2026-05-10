"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BrainCircuit,
  ClipboardList,
  Gauge,
  History,
  ImageUp,
  LineChart,
  NotebookPen,
  PlusCircle,
  Target
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/study/new", label: "Yeni Çalışma Kaydı", icon: PlusCircle },
  { href: "/study/history", label: "Çalışma Geçmişi", icon: History },
  { href: "/analytics", label: "Analitik", icon: BarChart3 },
  { href: "/mock-exams/new", label: "Deneme Ekle", icon: NotebookPen },
  { href: "/mock-exams", label: "Denemeler", icon: ClipboardList },
  { href: "/mock-exams/analytics", label: "Deneme Analizi", icon: LineChart },
  { href: "/topic-analysis", label: "Konu Analizi", icon: Target },
  { href: "/upload", label: "Görsel Yükle", icon: ImageUp },
  { href: "/ai-reports", label: "AI Raporları", icon: BrainCircuit }
];

export function AppSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r bg-white/55 p-5 backdrop-blur lg:block">
      <Link href="/dashboard" className="block rounded-3xl bg-foreground p-5 text-white shadow-soft">
        <p className="font-serif text-2xl font-black tracking-tight">Takip Defteri</p>
        <p className="mt-2 text-sm text-white/72">
          Günlük çalışma, deneme ve konu performansı
        </p>
      </Link>

      <div className="mt-5 rounded-3xl border bg-white/70 p-4">
        <p className="text-sm text-muted-foreground">Oturum</p>
        <p className="font-bold">{profile.full_name || "Kullanıcı"}</p>
        <p className="text-xs uppercase tracking-[0.2em] text-primary">{profile.role}</p>
      </div>

      <nav className="mt-5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition",
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "hover:bg-white hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
