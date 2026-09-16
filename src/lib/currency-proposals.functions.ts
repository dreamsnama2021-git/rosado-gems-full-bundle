import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminUser } from "@/lib/admin-role";
import type { CurrencyRow } from "@/lib/currency";

export type ProposalStatus = "pending" | "approved" | "rejected" | "withdrawn";

export type CurrencyProposal = {
  id: string;
  currencies: CurrencyRow[];
  note: string | null;
  status: ProposalStatus;
  submitted_by: string | null;
  submitted_by_email: string | null;
  reviewed_by: string | null;
  reviewed_by_email: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  applied_at: string | null;
  created_at: string;
};

const currencyRow = z.object({
  country: z.string().min(1),
  country_code: z.string().min(2).max(3),
  code: z.string().min(3).max(4),
  symbol: z.string().min(1),
  rate: z.number().positive(),
  rounding: z.enum(["none", "nearest_1", "nearest_5", "ending_99"]),
  enabled: z.boolean(),
});

const submitPayload = z.object({
  currencies: z.array(currencyRow).min(1),
  note: z.string().max(500).optional(),
});

const reviewPayload = z.object({
  id: z.string().uuid(),
  note: z.string().max(500).optional(),
});

/** Email of the signed-in reviewer, when the token carries one. */
function callerEmail(claims: unknown): string | null {
  const email = (claims as { email?: unknown } | null)?.email;
  return typeof email === "string" ? email : null;
}

/** Every rate proposal, newest first. Admin only. */
export const listCurrencyProposals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("currency_rate_proposals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return {
      proposals: ((data ?? []) as unknown) as CurrencyProposal[],
      viewerId: context.userId as string,
    };
  });

/** Queue a rate change for review. Nothing goes live here. */
export const submitCurrencyProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof submitPayload>) => submitPayload.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("currency_rate_proposals")
      .insert({
        currencies: data.currencies,
        note: data.note?.trim() || null,
        status: "pending",
        submitted_by: context.userId,
        submitted_by_email: callerEmail(context.claims),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: (row as { id: string }).id };
  });

/**
 * Approve a pending proposal and publish its rates.
 * A proposal can never be approved by the admin who submitted it.
 */
export const approveCurrencyProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof reviewPayload>) => reviewPayload.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: proposal, error: readErr } = await supabaseAdmin
      .from("currency_rate_proposals")
      .select("id, status, currencies, submitted_by")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!proposal) throw new Error("Proposal not found");

    const p = (proposal as unknown) as { status: string; currencies: CurrencyRow[]; submitted_by: string | null };
    if (p.status !== "pending") throw new Error("Only pending proposals can be approved");
    if (p.submitted_by && p.submitted_by === context.userId) {
      throw new Error("You cannot approve your own rate proposal — another admin must review it");
    }

    // Publish first, then record the approval so a failed write never marks it live.
    const { error: applyErr } = await supabaseAdmin
      .from("site_settings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ id: "default", currencies: p.currencies } as any);
    if (applyErr) throw applyErr;

    const now = new Date().toISOString();
    const { error: markErr } = await supabaseAdmin
      .from("currency_rate_proposals")
      .update({
        status: "approved",
        reviewed_by: context.userId,
        reviewed_by_email: callerEmail(context.claims),
        review_note: data.note?.trim() || null,
        reviewed_at: now,
        applied_at: now,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .eq("id", data.id);
    if (markErr) throw markErr;

    return { ok: true };
  });

/** Decline a pending proposal without touching live rates. */
export const rejectCurrencyProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof reviewPayload>) => reviewPayload.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("currency_rate_proposals")
      .update({
        status: "rejected",
        reviewed_by: context.userId,
        reviewed_by_email: callerEmail(context.claims),
        review_note: data.note?.trim() || null,
        reviewed_at: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .eq("id", data.id)
      .eq("status", "pending");
    if (error) throw error;
    return { ok: true };
  });

/** The submitter pulls their own pending proposal back. */
export const withdrawCurrencyProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdminUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("currency_rate_proposals")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ status: "withdrawn", reviewed_at: new Date().toISOString() } as any)
      .eq("id", data.id)
      .eq("status", "pending")
      .eq("submitted_by", context.userId);
    if (error) throw error;
    return { ok: true };
  });
