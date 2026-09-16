import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCurrencyProposals,
  submitCurrencyProposal,
  approveCurrencyProposal,
  rejectCurrencyProposal,
  withdrawCurrencyProposal,
  type CurrencyProposal,
} from "@/lib/currency-proposals.functions";
import { normalizeCurrencies, convertFromINR, formatMoney, type CurrencyRow, type CurrencyRounding } from "@/lib/currency";
import { Plus, Trash2, Check, X, Undo2, Clock, ShieldCheck } from "lucide-react";

const inp = "w-full border border-border bg-background px-3 py-2 text-sm rounded-sm";
const label = "mb-1 block text-xs uppercase tracking-[0.18em] text-muted-foreground";

const ROUNDING: Array<[CurrencyRounding, string]> = [
  ["none", "Exact (2 decimals)"],
  ["nearest_1", "Nearest whole"],
  ["nearest_5", "Nearest 5"],
  ["ending_99", "Charm .99"],
];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-red-100 text-red-900",
  withdrawn: "bg-muted text-muted-foreground",
};

function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString();
}

/** Human-readable list of what a proposal changes versus the live rates. */
function diffRows(live: CurrencyRow[], next: CurrencyRow[]) {
  const out: string[] = [];
  const liveMap = new Map(live.map((c) => [c.code, c]));
  const nextMap = new Map(next.map((c) => [c.code, c]));

  for (const c of next) {
    const prev = liveMap.get(c.code);
    if (!prev) { out.push(`Add ${c.code} (${c.country}) at ${c.rate}`); continue; }
    if (prev.rate !== c.rate) out.push(`${c.code} rate ${prev.rate} → ${c.rate}`);
    if (prev.rounding !== c.rounding) out.push(`${c.code} rounding ${prev.rounding} → ${c.rounding}`);
    if (prev.enabled !== c.enabled) out.push(`${c.code} ${c.enabled ? "enabled" : "disabled"}`);
    if (prev.symbol !== c.symbol) out.push(`${c.code} symbol ${prev.symbol} → ${c.symbol}`);
    if (prev.country_code !== c.country_code) out.push(`${c.code} country ${prev.country_code} → ${c.country_code}`);
  }
  for (const c of live) if (!nextMap.has(c.code)) out.push(`Remove ${c.code} (${c.country})`);
  return out;
}

export function CurrenciesPanel({ initial }: { initial: unknown }) {
  const live = useMemo(() => normalizeCurrencies(initial), [initial]);
  const [rows, setRows] = useState<CurrencyRow[]>(() => normalizeCurrencies(initial));
  const [note, setNote] = useState("");
  const qc = useQueryClient();

  const fetchProposals = useServerFn(listCurrencyProposals);
  const submitFn = useServerFn(submitCurrencyProposal);
  const approveFn = useServerFn(approveCurrencyProposal);
  const rejectFn = useServerFn(rejectCurrencyProposal);
  const withdrawFn = useServerFn(withdrawCurrencyProposal);

  const { data } = useQuery({
    queryKey: ["currency-proposals"],
    queryFn: () => fetchProposals(),
  });
  const proposals = data?.proposals ?? [];
  const viewerId = data?.viewerId ?? "";
  const pending = proposals.filter((p) => p.status === "pending");

  const refresh = () => qc.invalidateQueries({ queryKey: ["currency-proposals"] });

  const submit = useMutation({
    mutationFn: () => submitFn({ data: { currencies: rows, note } }),
    onSuccess: () => { toast.success("Sent for approval"); setNote(""); refresh(); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not submit"),
  });

  const review = useMutation({
    mutationFn: async (arg: { id: string; action: "approve" | "reject" | "withdraw" }) => {
      if (arg.action === "approve") return approveFn({ data: { id: arg.id } });
      if (arg.action === "reject") return rejectFn({ data: { id: arg.id } });
      return withdrawFn({ data: { id: arg.id } });
    },
    onSuccess: (_r, arg) => {
      toast.success(arg.action === "approve" ? "Rates are now live" : arg.action === "reject" ? "Proposal rejected" : "Proposal withdrawn");
      refresh();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not update proposal"),
  });

  const changes = diffRows(live, rows);

  function upd(i: number, patch: Partial<CurrencyRow>) {
    setRows((p) => p.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 border border-border rounded-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Currencies &amp; Exchange Rates</h2>
            <p className="text-xs text-muted-foreground">
              Prices are stored in INR. Rate changes are reviewed before they reach shoppers — a second administrator must approve them.
            </p>
          </div>
          <button
            onClick={() => submit.mutate()}
            disabled={submit.isPending || changes.length === 0}
            className="btn-primary btn-small disabled:opacity-50"
          >
            <span>{submit.isPending ? "Submitting…" : "Submit for approval"}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <th className="py-2 pr-3">Country</th>
                <th className="py-2 pr-3">Country code</th>
                <th className="py-2 pr-3">Currency</th>
                <th className="py-2 pr-3">Symbol</th>
                <th className="py-2 pr-3">Rate (1 INR =)</th>
                <th className="py-2 pr-3">Rounding</th>
                <th className="py-2 pr-3">Preview (₹10,000)</th>
                <th className="py-2 pr-3">On</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const locked = r.code === "INR";
                return (
                  <tr key={i} className="border-t border-border">
                    <td className="py-2 pr-3"><input className={inp} value={r.country} onChange={(e) => upd(i, { country: e.target.value })} /></td>
                    <td className="py-2 pr-3"><input className={inp} value={r.country_code} onChange={(e) => upd(i, { country_code: e.target.value.toUpperCase() })} /></td>
                    <td className="py-2 pr-3"><input className={inp} value={r.code} disabled={locked} onChange={(e) => upd(i, { code: e.target.value.toUpperCase() })} /></td>
                    <td className="py-2 pr-3"><input className={inp} value={r.symbol} onChange={(e) => upd(i, { symbol: e.target.value })} /></td>
                    <td className="py-2 pr-3"><input type="number" step="0.0001" min="0" className={inp} value={r.rate} disabled={locked} onChange={(e) => upd(i, { rate: Number(e.target.value) || 0 })} /></td>
                    <td className="py-2 pr-3">
                      <select className={inp} value={r.rounding} onChange={(e) => upd(i, { rounding: e.target.value as CurrencyRounding })}>
                        {ROUNDING.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatMoney(convertFromINR(10000, r), r)}</td>
                    <td className="py-2 pr-3"><input type="checkbox" checked={r.enabled} disabled={locked} onChange={(e) => upd(i, { enabled: e.target.checked })} /></td>
                    <td className="py-2">
                      {!locked && (
                        <button aria-label="Remove" onClick={() => setRows((p) => p.filter((_, idx) => idx !== i))} className="text-foreground/50 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setRows((p) => [...p, { country: "", country_code: "", code: "", symbol: "", rate: 0.012, rounding: "nearest_1", enabled: true }])}
            className="inline-flex items-center gap-2 text-sm text-primary"
          >
            <Plus className="h-4 w-4" /> Add currency
          </button>
          <button onClick={() => setRows(live)} className="text-sm text-muted-foreground hover:text-foreground">
            Reset to live rates
          </button>
        </div>

        <div className="rounded-sm border border-border bg-muted/30 p-4">
          <p className={label}>Pending changes in this draft</p>
          {changes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Draft matches the live rates. Edit a rate to submit it for approval.</p>
          ) : (
            <ul className="list-disc pl-5 text-xs text-muted-foreground">
              {changes.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          )}
          <label className={`${label} mt-4`}>Note for the reviewer (optional)</label>
          <input className={inp} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Monthly refresh from RBI reference rates" />
        </div>
      </section>

      <section className="space-y-4 border border-border rounded-sm p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="font-display text-xl">Approval queue</h2>
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">{pending.length} awaiting review</span>
          )}
        </div>

        {proposals.length === 0 && <p className="text-xs text-muted-foreground">No rate proposals yet.</p>}

        <div className="space-y-3">
          {proposals.map((p: CurrencyProposal) => {
            const own = p.submitted_by === viewerId;
            const isPending = p.status === "pending";
            const list = diffRows(live, normalizeCurrencies(p.currencies));
            return (
              <article key={p.id} className="rounded-sm border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] uppercase tracking-[0.14em] ${STATUS_STYLE[p.status] ?? ""}`}>{p.status}</span>
                    <span className="text-muted-foreground">
                      by {p.submitted_by_email ?? "admin"}{own ? " (you)" : ""} · {fmtDate(p.created_at)}
                    </span>
                  </div>
                  {isPending && (
                    <div className="flex items-center gap-2">
                      {own ? (
                        <button
                          onClick={() => review.mutate({ id: p.id, action: "withdraw" })}
                          className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs hover:bg-muted"
                        >
                          <Undo2 className="h-3.5 w-3.5" /> Withdraw
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => review.mutate({ id: p.id, action: "approve" })}
                            disabled={review.isPending}
                            className="inline-flex items-center gap-1.5 rounded-sm bg-foreground px-3 py-1.5 text-xs text-background disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve &amp; publish
                          </button>
                          <button
                            onClick={() => review.mutate({ id: p.id, action: "reject" })}
                            disabled={review.isPending}
                            className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {p.note && <p className="mt-2 text-xs italic text-muted-foreground">“{p.note}”</p>}

                <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                  {list.length === 0 ? <li>No difference from the current live rates.</li> : list.map((c, i) => <li key={i}>{c}</li>)}
                </ul>

                {own && isPending && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-amber-700">
                    <Clock className="h-3.5 w-3.5" /> Waiting for another administrator to approve — you cannot approve your own proposal.
                  </p>
                )}

                {(p.status === "approved" || p.status === "rejected") && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {p.status === "approved" ? "Published" : "Rejected"} by {p.reviewed_by_email ?? "admin"} · {fmtDate(p.reviewed_at)}
                    {p.review_note ? ` · ${p.review_note}` : ""}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
