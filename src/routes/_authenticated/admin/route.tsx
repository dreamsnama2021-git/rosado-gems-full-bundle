import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/admin-role";
import { LayoutDashboard, Package, FileText, MessageSquare, ShoppingBag, Mail, CreditCard, Truck, Settings, ArrowLeft, FolderTree, Tags, Wand2, ListTree, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth" });
    if (!(await isAdminUser(supabase, userData.user.id))) throw redirect({ to: "/account" });
  },
  component: AdminShell,
});

const nav: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/studio", label: "Studio Editor", icon: Wand2 },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Product Categories", icon: FolderTree },
  { to: "/admin/blog", label: "Blog", icon: FileText },
  { to: "/admin/blog-categories", label: "Blog Categories", icon: Tags },
  { to: "/admin/navigation", label: "Menus & Footer", icon: ListTree },
  { to: "/admin/comments", label: "Comments", icon: MessageSquare },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/messages", label: "Messages", icon: Mail },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/shipping", label: "Shipping", icon: Truck },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminShell() {
  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[#2a2a2e] bg-[#1c1c20] text-white/80 sticky top-0 h-screen">
        <div className="h-14 flex items-center px-5 border-b border-white/10">
          <Link to="/admin" className="font-display text-lg text-white">Rosado Admin</Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={n.exact ? { exact: true } : undefined}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              activeProps={{ className: "flex items-center gap-3 px-3 py-2 rounded-md text-sm bg-primary text-primary-foreground font-medium shadow-sm" }}
            >
              <n.icon className="h-4 w-4" />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-md text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to site
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden border-b border-border bg-header-top">
          <div className="flex items-center justify-between px-4 h-14">
            <Link to="/admin" className="font-display text-lg">Rosado Admin</Link>
            <Link to="/" className="text-xs uppercase tracking-[0.2em]">↩ Site</Link>
          </div>
          <nav className="flex items-center gap-4 px-4 pb-3 overflow-x-auto text-xs uppercase tracking-[0.2em]">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={n.exact ? { exact: true } : undefined} className="whitespace-nowrap hover:text-primary" activeProps={{ className: "whitespace-nowrap text-primary font-semibold" }}>
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 px-6 md:px-10 py-8"><Outlet /></main>
      </div>
    </div>
  );
}
