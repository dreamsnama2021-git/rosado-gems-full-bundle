import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, FileText, Package, Search, Tag } from "lucide-react";
import { adminListOrders } from "@/lib/admin.functions";
import { OrderDetailSheet } from "@/components/admin/OrderDetailSheet";
import { orderNumber, ORDER_STATUSES } from "@/lib/order-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildInvoice, buildPackingSlip, buildShippingLabel, downloadCsv, ordersToCsv } from "@/lib/order-pdf";

const q = queryOptions({ queryKey: ["admin", "orders"], queryFn: () => adminListOrders() });

export const Route = createFileRoute("/_authenticated/admin/orders")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  errorComponent: ({ error }) => <p className="text-sm text-red-600">{error.message}</p>,
  notFoundComponent: () => <p>Not found</p>,
  component: Orders,
});

function Orders() {
  const data = useSuspenseQuery(q).data;
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return data.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!s) return true;
      return `${orderNumber(o.id)} ${o.contact_name} ${o.contact_email} ${o.contact_phone ?? ""} ${o.awb_code ?? ""}`.toLowerCase().includes(s);
    });
  }, [data, search, status]);

  const revenue = rows.reduce((sum, o) => sum + Number(o.total_base ?? o.total ?? 0), 0);
  const pending = data.filter((o) => o.status === "pending" || o.payment_status === "pending").length;

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Orders</h1>
      <p className="mb-6 text-sm text-muted-foreground">Open an order to update status, message the customer, or download invoices and slips.</p>

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <Stat label="Orders" value={String(data.length)} />
        <Stat label="Shown" value={String(rows.length)} />
        <Stat label="Needs attention" value={String(pending)} />
        <Stat label="Revenue (INR)" value={`₹ ${Math.round(revenue).toLocaleString()}`} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search order no., customer, email, AWB" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="h-10 rounded-sm border border-border bg-background px-3 text-sm">
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <Button variant="outline" size="sm"
                onClick={() => downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, ordersToCsv(rows))}>
          <Download className="mr-2 h-4 w-4" />Export CSV
        </Button>
      </div>

      <div className="rounded-sm border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-header-top text-left text-xs uppercase tracking-[0.15em]">
            <tr>
              <th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Items</th>
              <th className="p-3">Total</th><th className="p-3">Payment</th>
              <th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3">Documents</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const items = Array.isArray(o.items) ? o.items.length : 0;
              return (
                <tr key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer border-t border-border hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">{orderNumber(o.id)}</td>
                  <td className="p-3">{o.contact_name}<br /><span className="text-xs text-muted-foreground">{o.contact_email}</span></td>
                  <td className="p-3">{items}</td>
                  <td className="p-3">{o.currency ?? "INR"} {Number(o.total).toLocaleString()}</td>
                  <td className="p-3 text-xs">{o.payment_method === "cod" ? "COD" : "Prepaid"} · {o.payment_status}</td>
                  <td className="p-3">{String(o.status).replace(/_/g, " ")}</td>
                  <td className="p-3 text-xs">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" title="Invoice PDF" aria-label="Download invoice" onClick={() => buildInvoice(o)}><FileText className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Packing slip" aria-label="Download packing slip" onClick={() => buildPackingSlip(o)}><Package className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Shipping label" aria-label="Download shipping label" onClick={() => buildShippingLabel(o)}><Tag className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-sm text-muted-foreground">No orders found</td></tr>}
          </tbody>
        </table>
      </div>
      <OrderDetailSheet orderId={openId} onOpenChange={(open) => { if (!open) setOpenId(null); }} />
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
