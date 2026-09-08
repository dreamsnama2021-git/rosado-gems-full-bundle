import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { adminListProducts, adminListBlog, adminListOrders, adminListMessages } from "@/lib/admin.functions";

const q = queryOptions({
  queryKey: ["admin", "summary"],
  queryFn: async () => {
    const [p, b, o, m] = await Promise.all([adminListProducts(), adminListBlog(), adminListOrders(), adminListMessages()]);
    return { products: p.length, blog: b.length, orders: o.length, messages: m.length, latestOrders: o.slice(0, 5) };
  },
});

export const Route = createFileRoute("/_authenticated/admin/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  errorComponent: ({ error }) => <p className="text-sm text-red-600">{error.message}</p>,
  notFoundComponent: () => <p>Not found</p>,
  component: Dashboard,
});

function Dashboard() {
  const d = useSuspenseQuery(q).data;
  const cards = [
    { label: "Products", value: d.products, to: "/admin/products" as const },
    { label: "Blog posts", value: d.blog, to: "/admin/blog" as const },
    { label: "Orders", value: d.orders, to: "/admin/orders" as const },
    { label: "Messages", value: d.messages, to: "/admin/messages" as const },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage catalog, content and orders — with AI content assist.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="rounded-sm border border-border p-6 hover:border-foreground transition-colors">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{c.label}</p>
            <p className="mt-2 font-display text-4xl">{c.value}</p>
          </Link>
        ))}
      </div>
      <div>
        <h2 className="font-display text-2xl mb-3">Latest orders</h2>
        <div className="rounded-sm border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-header-top text-left text-xs uppercase tracking-[0.15em]"><tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead>
            <tbody>
              {d.latestOrders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td className="p-3">{o.contact_name}</td>
                  <td className="p-3">₹{Number(o.total).toLocaleString("en-IN")}</td>
                  <td className="p-3">{o.status}</td>
                  <td className="p-3">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {d.latestOrders.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">No orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
