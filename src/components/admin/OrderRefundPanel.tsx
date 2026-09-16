import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";
import { adminGetOrderRefunds, adminRefundOrder } from "@/lib/refunds.functions";

export function OrderRefundPanel({ orderId }: { orderId: string }) {
  const qc = useQueryClient();
  const getRefunds = useServerFn(adminGetOrderRefunds);
  const refundOrder = useServerFn(adminRefundOrder);

  const q = useQuery({
    queryKey: ["admin", "order-refunds", orderId],
    queryFn: () => getRefunds({ data: { order_id: orderId } }),
    enabled: !!orderId,
  });

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [manual, setManual] = useState(false);
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);

  const data = q.data;
  const refundable = data?.refundable ?? 0;
  const money = (n: number) => `${data?.currency ?? "INR"} ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  useEffect(() => { setAmount(refundable > 0 ? String(refundable) : ""); }, [refundable]);

  const gatewayLabel = data?.gateway === "razorpay" ? "Razorpay" : data?.gateway === "paypal" ? "PayPal" : data?.gateway ?? "offline";
  const canGatewayRefund = (data?.gateway === "razorpay" || data?.gateway === "paypal") && !!data?.gateway_payment_id && ["paid", "partially_refunded"].includes(String(data?.payment_status));

  async function submit() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) { toast.error("Enter a refund amount"); return; }
    if (value > refundable + 0.001) { toast.error(`Only ${money(refundable)} is left to refund`); return; }
    setBusy(true);
    try {
      const res = await refundOrder({ data: { order_id: orderId, amount: value, reason: reason || undefined, manual: manual || !canGatewayRefund, notify } });
      toast.success(res.fully ? "Order fully refunded" : `Refunded ${money(value)}`);
      setReason("");
      qc.invalidateQueries({ queryKey: ["admin", "order-refunds", orderId] });
      qc.invalidateQueries({ queryKey: ["admin", "order", orderId] });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Refund failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-3 rounded-sm border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">Refunds</p>
        <Badge variant="outline">{gatewayLabel}</Badge>
      </div>

      {q.isLoading && <p className="text-sm text-muted-foreground">Loading refunds…</p>}

      {data && (
        <>
          <p className="text-sm text-muted-foreground">
            Paid {money(data.total)} · Refunded {money(data.refunded)} · Available to refund <span className="font-medium text-foreground">{money(refundable)}</span>
          </p>

          {data.refunds.length > 0 && (
            <div className="divide-y divide-border rounded-sm border border-border text-sm">
              {data.refunds.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div>
                    <p className="font-medium">{money(Number(r.amount))} {r.is_manual && <Badge variant="secondary" className="ml-1">manual</Badge>}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}{r.created_by_email ? ` · ${r.created_by_email}` : ""}
                      {r.gateway_refund_id ? ` · ${r.gateway_refund_id}` : ""}
                    </p>
                    {r.reason && <p className="text-xs text-muted-foreground">{r.reason}</p>}
                  </div>
                  <Badge variant="outline">{r.status}</Badge>
                </div>
              ))}
            </div>
          )}

          {refundable <= 0 ? (
            <p className="text-sm text-muted-foreground">This order is fully refunded.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Refund amount ({data.currency})</Label>
                  <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <div className="mt-1 flex gap-2">
                    <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAmount(String(refundable))}>Full ({money(refundable)})</Button>
                    <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAmount(String(Math.round((refundable / 2) * 100) / 100))}>Half</Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Reason (optional)</Label>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Item returned, size exchange…" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={manual || !canGatewayRefund} onCheckedChange={setManual} disabled={!canGatewayRefund} />
                  Record as manual/offline refund
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={notify} onCheckedChange={setNotify} /> Notify the customer
                </label>
              </div>

              {!canGatewayRefund && (
                <p className="text-xs text-muted-foreground">
                  No captured {gatewayLabel === "offline" ? "online" : gatewayLabel} payment is linked to this order, so refunds can only be recorded manually.
                </p>
              )}

              <Button size="sm" onClick={submit} disabled={busy}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {busy ? "Processing…" : manual || !canGatewayRefund ? "Record refund" : `Refund via ${gatewayLabel}`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
