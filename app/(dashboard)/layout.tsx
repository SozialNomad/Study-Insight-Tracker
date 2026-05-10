import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { requireProfile } from "@/lib/auth";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireProfile();

  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar profile={profile} />
      <main className="w-full px-4 py-6 pb-24 sm:px-6 lg:px-10 lg:pb-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
