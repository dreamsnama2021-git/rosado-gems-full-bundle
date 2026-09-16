import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileText, Package, Search } from "lucide-react";
import { adminListCustomers, adminGetCustomerOrders } from "@/lib/admin.functions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildInvoice, buildPackingSlip, downloadCsv } from "@/lib/order-pdf";
import { orderNumber } from "@/lib/order-templates";

const q = queryOptions({ queryKey: ["admin", "customers"], queryFn: () => adminListCustomers() });

export const Route = createFileRoute("/_authenticated/admin/customers")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  errorComponent: ({ error }) => <p className="text-sm text-red-600">{error.message}</p>,
  component: Customers,
});

function Customers() {
  const { customers, accounts } = useSuspenseQuery(q).data;
  const [search, setSearch] = useState("");
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter((c) => `${c.name} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(s));
  }, [customers, search]);

  const revenue = customers.reduce((sum, c) => sum + c.spend_base, 0);

  function exportCsv() {
    const head = ["name", "email", "phone", "city", "country", "orders", "lifetime_value_inr", "first_order", "last_order"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      head.join(","),
      ...rows.map((c) => [c.name, c.email, c.phone, c.city, c.country, c.orders, c.spend_base.toFixed(2), c.first_order, c.last_order].map(esc).join(",")),
    ].join("\n");
    downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Customers</h1>
      <p className="mb-6 text-sm text-muted-foreground">Everyone who has ordered, with lifetime value and downloadable invoices.</p>

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <Stat label="Customers" value={String(customers.length)} />
        <Stat label="Registered accounts" value={String(accounts)} />
        <Stat label="Orders" value={String(customers.reduce((s, c) => s + c.orders, 0))} />
        <Stat label="Lifetime value (INR)" value={`₹ ${Math.round(revenue).toLocaleString()}`} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, email, phone, city" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
      </div>

      <div className="rounded-sm border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-header-top text-left text-xs uppercase tracking-[0.15em]">
            <tr>
              <th className="p-3">Customer</th><th className="p-3">Contact</th><th className="p-3">Location</th>
              <th className="p-3">Orders</th><th className="p-3">Lifetime value</th><th className="p-3">Last order</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.email} onClick={() => setOpenEmail(c.email)} className="cursor-pointer border-t border-border hover:bg-muted/50">
                <td className="p-3">{c.name || "—"}</td>
                <td className="p-3 text-xs">{c.email}<br />{c.phone || "—"}</td>
                <td className="p-3 text-xs">{[c.city, c.country].filter(Boolean).join(", ") || "—"}</td>
                <td className="p-3">{c.orders}</td>
                <td className="p-3">₹ {Math.round(c.spend_base).toLocaleString()}</td>
                <td className="p-3 text-xs">{c.last_order ? new Date(c.last_order).toLocaleDateString() : "—"}<br />{c.last_status.replace(/_/g, " ")}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No customers found</td></tr>}
          </tbody>
        </table>
      </div>

      <CustomerSheet email={openEmail} onClose={() => setOpenEmail(null)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border p-4">
      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}

function CustomerSheet({ email, onClose }: { email: string | null; onClose: () => void }) {
  const getOrders = useServerFn(adminGetCustomerOrders);
  const oq = useQuery({
    queryKey: ["admin", "customer-orders", email],
    queryFn: () => getOrders({ data: { email: email as string } }),
    enabled: !!email,
  });
  const orders = oq.data ?? [];

  return (
    <Sheet open={!!email} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader><SheetTitle>{email}</SheetTitle></SheetHeader>
        {oq.isLoading && <p className="py-8 text-sm text-muted-foreground">Loading orders…</p>}
        <div className="space-y-3 py-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-sm border border-border p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs">{orderNumber(o.id)}</span>
                <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1">{o.currency ?? "INR"} {Number(o.total).toLocaleString()} · {String(o.status).replace(/_/g, " ")} · {o.payment_method === "cod" ? "COD" : "Prepaid"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => buildInvoice(o)}><FileText className="mr-2 h-4 w-4" />Invoice</Button>
                <Button size="sm" variant="outline" onClick={() => buildPackingSlip(o)}><Package className="mr-2 h-4 w-4" />Packing slip</Button>
              </div>
            </div>
          ))}
          {!oq.isLoading && orders.length === 0 && <p className="text-sm text-muted-foreground">No orders.</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
