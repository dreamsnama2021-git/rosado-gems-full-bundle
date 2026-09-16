import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, RefreshCw, RotateCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { adminListWebhookEvents, adminRecheckWebhookEvent, type WebhookEvent } from "@/lib/webhook-events.functions";

const STATUS_TONE: Record<string, string> = {
  processed: "bg-primary/10 text-primary",
  ignored: "bg-muted text-muted-foreground",
  unmatched: "bg-amber-100 text-amber-800",
  failed: "bg-destructive/10 text-destructive",
  recheck_failed: "bg-destructive/10 text-destructive",
  invalid_signature: "bg-destructive/10 text-destructive",
  rechecked: "bg-muted text-muted-foreground",
};

export function WebhookLog() {
  const qc = useQueryClient();
  const list = useServerFn(adminListWebhookEvents);
  const recheck = useServerFn(adminRecheckWebhookEvent);

  const [gateway, setGateway] = useState<"all" | "razorpay" | "paypal" | "payoneer">("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "webhook-events", gateway, status],
    queryFn: () => list({ data: { gateway, status, limit: 100 } }),
    refetchOnWindowFocus: false,
  });

  async function runRecheck(id: string) {
    setBusy(id);
    try {
      const res = await recheck({ data: { id } });
      toast[res.status === "processed" ? "success" : "message"](res.note || `Event ${res.status}`);
      await qc.invalidateQueries({ queryKey: ["admin", "webhook-events"] });
      await qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const events: WebhookEvent[] = q.data?.events ?? [];
  const sel = "h-9 rounded-sm border border-border bg-background px-2 text-sm";

  return (
    <section className="rounded-sm border border-border p-6">
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-2xl">Webhook log</h2>
          <p className="text-sm text-muted-foreground">Every inbound gateway event with its signature, timestamp and raw payload.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <select aria-label="Filter by gateway" className={sel} value={gateway} onChange={(e) => setGateway(e.target.value as typeof gateway)}>
            <option value="all">All gateways</option>
            <option value="razorpay">Razorpay</option>
            <option value="paypal">PayPal</option>
            <option value="payoneer">Payoneer</option>
          </select>
          <select aria-label="Filter by status" className={sel} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="processed">Processed</option>
            <option value="unmatched">Unmatched</option>
            <option value="ignored">Ignored</option>
            <option value="failed">Failed</option>
            <option value="invalid_signature">Invalid signature</option>
          </select>
          <button
            aria-label="Refresh webhook log"
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "webhook-events"] })}
            className="flex h-9 items-center gap-2 rounded-sm border border-border px-3 text-sm hover:border-primary hover:text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} /><span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {q.isLoading && <p className="text-sm text-muted-foreground">Loading events…</p>}
      {!q.isLoading && events.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No webhook events received yet. Add the webhook URLs above in your Razorpay / PayPal dashboard — every call will be logged here.
        </p>
      )}

      <div className="divide-y divide-border">
        {events.map((ev) => {
          const isOpen = open === ev.id;
          return (
            <div key={ev.id} className="py-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <button
                  onClick={() => setOpen(isOpen ? null : ev.id)}
                  className="flex min-w-0 items-start gap-2 text-left"
                  aria-expanded={isOpen}
                >
                  {isOpen ? <ChevronDown className="mt-1 h-4 w-4 shrink-0" /> : <ChevronRight className="mt-1 h-4 w-4 shrink-0" />}
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm capitalize">{ev.gateway}</span>
                      <span className="truncate text-sm text-muted-foreground">{ev.event_type || "unknown event"}</span>
                      <span className={`rounded-sm px-2 py-0.5 text-[11px] uppercase tracking-wide ${STATUS_TONE[ev.status] ?? "bg-muted text-muted-foreground"}`}>
                        {ev.status.replace(/_/g, " ")}
                      </span>
                      {ev.signature_valid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-primary"><ShieldCheck className="h-3 w-3" />signature ok</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-destructive"><ShieldAlert className="h-3 w-3" />signature failed</span>
                      )}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {new Date(ev.received_at).toLocaleString()}
                      {ev.order_id ? ` · Order ${ev.order_id.slice(0, 8).toUpperCase()}` : " · no order matched"}
                      {ev.recheck_count > 0 ? ` · re-checked ${ev.recheck_count}×` : ""}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => runRecheck(ev.id)}
                  disabled={busy === ev.id}
                  className="flex h-9 shrink-0 items-center gap-2 rounded-sm border border-border px-3 text-sm hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  <RotateCw className={`h-4 w-4 ${busy === ev.id ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{busy === ev.id ? "Checking…" : "Re-check"}</span>
                </button>
              </div>

              {isOpen && (
                <div className="mt-3 space-y-3 pl-6 text-xs">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Event id</span><br />{ev.event_id || "—"}</div>
                    <div><span className="text-muted-foreground">Processed at</span><br />{ev.processed_at ? new Date(ev.processed_at).toLocaleString() : "—"}</div>
                    <div><span className="text-muted-foreground">Last re-check</span><br />{ev.last_recheck_at ? new Date(ev.last_recheck_at).toLocaleString() : "—"}</div>
                    <div className="min-w-0"><span className="text-muted-foreground">Signature</span><br /><span className="break-all">{ev.signature || "—"}</span></div>
                  </div>
                  {ev.error && <p className="text-destructive">Error: {ev.error}</p>}
                  {ev.note && <p className="text-muted-foreground">Note: {ev.note}</p>}
                  <div>
                    <p className="text-muted-foreground mb-1">Headers</p>
                    <pre className="max-h-40 overflow-auto rounded-sm bg-muted p-3">{JSON.stringify(ev.headers, null, 2)}</pre>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Raw payload</p>
                    <pre className="max-h-72 overflow-auto rounded-sm bg-muted p-3">{ev.payload_json || ev.raw_body}</pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
