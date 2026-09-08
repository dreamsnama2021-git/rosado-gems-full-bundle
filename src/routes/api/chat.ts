import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// Only user/assistant turns are accepted; the system prompt is built server-side
// and can never be supplied or overridden by the client.
const chatMessagesSchema = z
  .array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().trim().min(1).max(2000),
    }),
  )
  .min(1)
  .max(20);

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("AI not configured", { status: 500 });

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }
        const raw = (body as { messages?: unknown })?.messages;
        const parsed = chatMessagesSchema.safeParse(Array.isArray(raw) ? raw.slice(-20) : raw);
        if (!parsed.success) return Response.json({ error: "Invalid messages" }, { status: 400 });
        const messages = parsed.data.map((m) => ({ role: m.role, content: m.content }));

        // Load settings + product context
        const supa = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const [{ data: settings }, { data: products }, { data: categories }] = await Promise.all([
          supa.from("site_settings").select("ai_chat_enabled, ai_chat_persona, ai_chat_model").eq("id", "default").maybeSingle(),
          supa.from("products").select("name, slug, price, gemstone, metal, description").limit(30),
          supa.from("categories").select("name, slug").limit(20),
        ]);

        if (settings && settings.ai_chat_enabled === false) {
          return Response.json({ text: "The chat assistant is currently unavailable. Please email us or use WhatsApp." });
        }

        const persona = settings?.ai_chat_persona ?? "You are Rose, a shopping assistant for Rosado Gems.";
        const model = settings?.ai_chat_model ?? "google/gemini-2.5-flash";

        const catalog = (products ?? [])
          .map((p) => `- ${p.name} (₹${p.price}) [/products/${p.slug}]${p.gemstone ? ` · ${p.gemstone}` : ""}${p.metal ? ` · ${p.metal}` : ""}`)
          .join("\n");
        const cats = (categories ?? []).map((c) => `${c.name} (/collections/${c.slug})`).join(", ");

        const system = `${persona}

You have access to Rosado Gems' live catalog. Suggest specific products with markdown links when relevant.

Categories: ${cats}

Featured products:
${catalog}

Rules:
- Keep responses under 120 words.
- Use markdown links like [Product Name](/products/slug) when recommending items.
- For questions outside jewelry/shopping/company, politely redirect.
- If asked about custom orders, sizing, or bulk inquiries, suggest WhatsApp or the contact page (/contact).`;

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model,
            messages: [{ role: "system", content: system }, ...messages],
          }),
        });

        if (res.status === 429) return Response.json({ error: "Rate limit — please try again in a moment." }, { status: 429 });
        if (res.status === 402) return Response.json({ error: "AI credits exhausted. Please contact support." }, { status: 402 });
        if (!res.ok) return Response.json({ error: `AI error (${res.status})` }, { status: 500 });

        const j = await res.json();
        const text = j.choices?.[0]?.message?.content ?? "";
        return Response.json({ text });
      },
    },
  },
});
