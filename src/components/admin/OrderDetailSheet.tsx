import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildInvoice, buildPackingSlip, buildShippingLabel } from "@/lib/order-pdf";
import { FileText, Package, Tag } from "lucide-react";
import { adminGetOrder, adminSendOrderMessage, adminUpdateOrder } from "@/lib/admin.functions";
import { ORDER_STATUSES, ORDER_TEMPLATES, PAYMENT_STATUSES, fillTemplate, orderNumber } from "@/lib/order-templates";
import { OrderRefundPanel } from "@/components/admin/OrderRefundPanel";
import { PaymentTimeline } from "@/components/site/PaymentTimeline";
import { adminGetOrderRefunds } from "@/lib/refunds.functions";


type Props = { orderId: string | null; onOpenChange: (open: boolean) => void };

export function OrderDetailSheet({ orderId, onOpenChange }: Props) {
  const qc = useQueryClient();
  const getOrder = useServerFn(adminGetOrder);
  const updateOrder = useServerFn(adminUpdateOrder);
  const sendMessage = useServerFn(adminSendOrderMessage);

  const q = useQuery({
    queryKey: ["admin", "order", orderId],
    queryFn: () => getOrder({ data: { id: orderId as string } }),
    enabled: !!orderId,
  });

  const listRefunds = useServerFn(adminGetOrderRefunds);
  const refundsQ = useQuery({
    queryKey: ["admin", "order-refunds", orderId],
    queryFn: () => listRefunds({ data: { order_id: orderId as string } }),
    enabled: !!orderId,
  });

  const order = q.data?.order;
  const messages = q.data?.messages ?? [];

  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [courier, setCourier] = useState("");
  const [awb, setAwb] = useState("");
  const [tracking, setTracking] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  const [templateKey, setTemplateKey] = useState("order_confirmed");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [visible, setVisible] = useState(true);
  const [applyStatus, setApplyStatus] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!order) return;
    setStatus(order.status ?? "pending");
    setPaymentStatus(order.payment_status ?? "pending");
    setCourier(order.courier_name ?? "");
    setAwb(order.awb_code ?? "");
    setTracking(order.tracking_url ?? "");
  }, [order?.id, order?.status, order?.payment_status]);

  const template = useMemo(() => ORDER_TEMPLATES.find((t) => t.key === templateKey), [templateKey]);

  // Fill the composer whenever a template (or the order) changes.
  useEffect(() => {
    if (!order || !template) return;
    setSubject(fillTemplate(template.subject, order));
    setBody(template.key === "custom" ? "" : fillTemplate(template.body, order));
  }, [templateKey, order?.id, order?.courier_name, order?.awb_code, order?.tracking_url]);

  async function saveMeta() {
    if (!orderId) return;
    setSavingMeta(true);
    try {
      await updateOrder({ data: { id: orderId, status, payment_status: paymentStatus, courier_name: courier, awb_code: awb, tracking_url: tracking } });
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin", "order", orderId] });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update order"); }
    finally { setSavingMeta(false); }
  }

  async function send() {
    if (!orderId || !body.trim()) { toast.error("Write a message first"); return; }
    setSending(true);
    try {
      await sendMessage({ data: {
        order_id: orderId,
        subject,
        body,
        template_key: templateKey,
        visible_to_customer: visible,
        set_status: applyStatus ? template?.status : undefined,
        set_payment_status: applyStatus ? template?.paymentStatus : undefined,
      } });
      toast.success(visible ? "Update sent to the customer" : "Internal note saved");
      setBody(template?.key === "custom" ? "" : body);
      qc.invalidateQueries({ queryKey: ["admin", "order", orderId] });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not send message"); }
    finally { setSending(false); }
  }

  const items = Array.isArray(order?.items) ? (order!.items as Array<Record<string, unknown>>) : [];
  const money = (n: unknown) => `${order?.currency ?? "INR"} ${Number(n ?? 0).toLocaleString()}`;

  return (
    <Sheet open={!!orderId} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{order ? `Order ${orderNumber(order.id)}` : "Order"}</SheetTitle>
        </SheetHeader>

        {q.isLoading && <p className="py-10 text-sm text-muted-foreground">Loading order…</p>}
        {order && (
          <div className="space-y-8 py-4">
            {/* Documents */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => buildInvoice(order)}><FileText className="mr-2 h-4 w-4" />Invoice PDF</Button>
              <Button size="sm" variant="outline" onClick={() => buildPackingSlip(order)}><Package className="mr-2 h-4 w-4" />Packing slip</Button>
              <Button size="sm" variant="outline" onClick={() => buildShippingLabel(order)}><Tag className="mr-2 h-4 w-4" />Shipping label</Button>
            </div>

            {/* Summary */}
            <div className="grid gap-3 rounded-sm border border-border p-4 text-sm sm:grid-cols-2">
              <div><span className="text-muted-foreground">Customer</span><br />{order.contact_name}</div>
              <div><span className="text-muted-foreground">Email</span><br />{order.contact_email}</div>
              <div><span className="text-muted-foreground">Phone</span><br />{order.contact_phone || "—"}</div>
              <div><span className="text-muted-foreground">Placed</span><br />{new Date(order.created_at).toLocaleString()}</div>
              <div><span className="text-muted-foreground">Payment</span><br />{order.payment_method === "cod" ? "Cash on delivery (offline)" : "Prepaid"} · {order.payment_status}</div>
              <div><span className="text-muted-foreground">Total</span><br />{money(order.total)}</div>
            </div>

            {/* Payment timeline */}
            <PaymentTimeline
              paymentStatus={String(order.payment_status ?? "pending")}
              paymentMethod={order.payment_method}
              gateway={order.payment_gateway}
              createdAt={order.created_at}
              paidAt={order.paid_at}
              total={Number(order.total)}
              currency={String(order.currency ?? "INR")}
              refundedTotal={Number(order.refunded_total ?? 0)}
              refunds={(refundsQ.data?.refunds ?? []).map((r) => ({ amount: Number(r.amount), created_at: String(r.created_at), status: String(r.status) }))}
            />

            {/* Items */}
            <div>
              <p className="eyebrow mb-2">Items</p>
              <div className="rounded-sm border border-border divide-y divide-border text-sm">
                {items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3">
                    <div>
                      <p>{String(it.name ?? "")}</p>
                      {it.variant ? <p className="text-xs text-muted-foreground">{String(it.variant)}</p> : null}
                      {it.sku ? <p className="text-xs text-muted-foreground">SKU {String(it.sku)}</p> : null}
                    </div>
                    <div className="text-right">
                      <p>× {String(it.qty ?? 1)}</p>
                      <p className="text-xs text-muted-foreground">{money(it.line_total)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 space-y-1 text-right text-sm">
                <p className="text-muted-foreground">Subtotal {money(order.subtotal)} · Shipping {money(order.shipping)} · Tax {money(order.tax)}{Number(order.cod_fee) > 0 ? ` · COD fee ${money(order.cod_fee)}` : ""}</p>
                <p className="font-medium">Total {money(order.total)}</p>
              </div>
            </div>

            {/* Status + fulfilment */}
            <div className="space-y-3 rounded-sm border border-border p-4">
              <p className="eyebrow">Status &amp; fulfilment</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Order status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Payment status</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Courier</Label><Input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Blue Dart" /></div>
                <div><Label className="text-xs">AWB / tracking no.</Label><Input value={awb} onChange={(e) => setAwb(e.target.value)} /></div>
                <div className="sm:col-span-2"><Label className="text-xs">Tracking URL</Label><Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="https://" /></div>
              </div>
              <Button onClick={saveMeta} disabled={savingMeta} size="sm">{savingMeta ? "Saving…" : "Save order details"}</Button>
            </div>

            {/* Refunds */}
            <OrderRefundPanel orderId={order.id} />



            {/* Conversation */}
            <div className="space-y-3">
              <p className="eyebrow">Conversation</p>
              <div className="space-y-3">
                {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet. Send the first update below.</p>}
                {messages.map((m) => (
                  <div key={m.id} className={`rounded-sm border p-3 text-sm ${m.direction === "inbound" ? "border-border bg-muted/40" : "border-border"}`}>
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{m.direction === "inbound" ? "Customer" : m.author_name}</span>
                      <span>·</span>
                      <span>{new Date(m.created_at).toLocaleString()}</span>
                      {!m.visible_to_customer && <Badge variant="secondary">internal note</Badge>}
                      {m.status_snapshot && <Badge variant="outline">{m.status_snapshot}</Badge>}
                    </div>
                    {m.subject && <p className="mb-1 font-medium">{m.subject}</p>}
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Composer */}
            <div className="space-y-3 rounded-sm border border-border p-4">
              <p className="eyebrow">Send an update</p>
              <div>
                <Label className="text-xs">Predefined term</Label>
                <Select value={templateKey} onValueChange={setTemplateKey}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ORDER_TEMPLATES.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
              <div><Label className="text-xs">Message</Label><Textarea rows={9} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a custom message to the customer…" /></div>
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm"><Switch checked={visible} onCheckedChange={setVisible} /> Visible to customer</label>
                {(template?.status || template?.paymentStatus) && (
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={applyStatus} onCheckedChange={setApplyStatus} />
                    Also set status {template?.status ? `→ ${template.status.replace(/_/g, " ")}` : ""} {template?.paymentStatus ? `· payment → ${template.paymentStatus}` : ""}
                  </label>
                )}
              </div>
              <Button onClick={send} disabled={sending}>{sending ? "Sending…" : visible ? "Send to customer" : "Save internal note"}</Button>
              <p className="text-xs text-muted-foreground">The customer sees these updates on their order in “My account”. Placeholders like {"{{order_no}}"} are filled in automatically.</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
