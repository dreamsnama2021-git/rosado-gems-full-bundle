import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminUser } from "@/lib/admin-role";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(supabase: any, userId: string) {
  await assertAdminUser(supabase, userId);
}

export type PaymentSettings = {
  default_gateway: "stripe" | "razorpay" | "cashfree" | "paypal" | "payoneer";
  currency: string;
  stripe_enabled: boolean;
  stripe_mode: "test" | "live";
  stripe_publishable_key: string;
  stripe_secret_key: string;
  stripe_webhook_secret: string;
  razorpay_enabled: boolean;
  razorpay_mode: "test" | "live";
  razorpay_key_id: string;
  razorpay_key_secret: string;
  razorpay_webhook_secret: string;
  cashfree_enabled: boolean;
  cashfree_mode: "test" | "live";
  cashfree_app_id: string;
  cashfree_secret_key: string;
  cashfree_webhook_secret: string;
  paypal_enabled: boolean;
  paypal_mode: "sandbox" | "live";
  paypal_client_id: string;
  paypal_client_secret: string;
  paypal_webhook_id: string;
  payoneer_enabled: boolean;
  payoneer_mode: "sandbox" | "live";
  payoneer_merchant_code: string;
  payoneer_api_key: string;
  payoneer_division: string;
  payoneer_webhook_secret: string;
};

export const adminGetPaymentSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("payment_settings").select("*").eq("id", "default").maybeSingle();
    if (error) throw error;
    return data as (PaymentSettings & { id: string }) | null;
  });

const payload = z.object({
  default_gateway: z.enum(["stripe", "razorpay", "cashfree", "paypal", "payoneer"]),
  currency: z.string().min(3).max(6),
  stripe_enabled: z.boolean(),
  stripe_mode: z.enum(["test", "live"]),
  stripe_publishable_key: z.string(),
  stripe_secret_key: z.string(),
  stripe_webhook_secret: z.string(),
  razorpay_enabled: z.boolean(),
  razorpay_mode: z.enum(["test", "live"]),
  razorpay_key_id: z.string(),
  razorpay_key_secret: z.string(),
  razorpay_webhook_secret: z.string(),
  cashfree_enabled: z.boolean(),
  cashfree_mode: z.enum(["test", "live"]),
  cashfree_app_id: z.string(),
  cashfree_secret_key: z.string(),
  cashfree_webhook_secret: z.string(),
  paypal_enabled: z.boolean(),
  paypal_mode: z.enum(["sandbox", "live"]),
  paypal_client_id: z.string(),
  paypal_client_secret: z.string(),
  paypal_webhook_id: z.string(),
  payoneer_enabled: z.boolean(),
  payoneer_mode: z.enum(["sandbox", "live"]),
  payoneer_merchant_code: z.string(),
  payoneer_api_key: z.string(),
  payoneer_division: z.string(),
  payoneer_webhook_secret: z.string(),
});

export const adminUpdatePaymentSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof payload>) => payload.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("payment_settings").upsert({ id: "default", ...data });
    if (error) throw error;
    return { ok: true };
  });
