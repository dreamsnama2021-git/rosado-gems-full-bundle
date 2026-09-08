import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminUser } from "@/lib/admin-role";

async function callLovableAI(system: string, user: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content ?? "";
}

async function assertAdmin(supabase: ReturnType<typeof Object>, userId: string) {
  await assertAdminUser(supabase, userId);
}

export const aiGenerate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: "product-description" | "product-seo" | "product-title" | "product-excerpt" | "blog-body" | "blog-seo" | "blog-title" | "blog-excerpt" | "page-seo" | "page-title" | "page-excerpt"; context: string }) =>
    z.object({
      kind: z.enum([
        "product-description", "product-seo", "product-title", "product-excerpt",
        "blog-body", "blog-seo", "blog-title", "blog-excerpt",
        "page-seo", "page-title", "page-excerpt",
      ]),
      context: z.string().min(1).max(4000),
    }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const prompts: Record<string, [string, string]> = {
      "product-description": [
        "You are a luxury jewelry copywriter for Rosado Gems, Mumbai. Write elegant, sensory product descriptions in 60-90 words.",
        `Write a product description for:\n${data.context}`,
      ],
      "product-seo": [
        "You are an SEO specialist. Return ONLY strict JSON: {\"meta_title\":\"...\",\"meta_description\":\"...\"}. Title <60 chars, description <160 chars. Include the brand 'Rosado Gems'.",
        `Product: ${data.context}`,
      ],
      "product-title": [
        "Luxury jewelry naming expert for Rosado Gems. Return ONE short, evocative product title (3-7 words). No quotes, no trailing punctuation.",
        `Details: ${data.context}`,
      ],
      "product-excerpt": [
        "Return a single 1-2 sentence tagline (max 160 chars) for a luxury jewelry product. Plain text only, no quotes.",
        `Product: ${data.context}`,
      ],
      "blog-body": [
        "You are a jewelry editor for Rosado Gems. Write a warm 400-500 word blog post in flowing prose, 3-4 paragraphs.",
        `Topic: ${data.context}`,
      ],
      "blog-seo": [
        "SEO for a jewelry blog. Return ONLY strict JSON: {\"meta_title\":\"...\",\"meta_description\":\"...\",\"excerpt\":\"...\"}. Title <60, description <160, excerpt <180 chars.",
        `Blog title / topic: ${data.context}`,
      ],
      "blog-title": [
        "Editorial headline writer for a luxury jewelry blog. Return ONE catchy blog title (5-10 words). Plain text only, no quotes.",
        `Seed: ${data.context}`,
      ],
      "blog-excerpt": [
        "Return a single 1-2 sentence blog excerpt (max 180 chars). Plain text only, no quotes.",
        `Blog: ${data.context}`,
      ],
      "page-seo": [
        "SEO specialist. Return ONLY strict JSON: {\"meta_title\":\"...\",\"meta_description\":\"...\"}. Title <60 chars, description <160 chars.",
        `Page: ${data.context}`,
      ],
      "page-title": [
        "Return ONE concise page title (2-6 words) for a luxury jewelry site. Plain text only, no quotes.",
        `Seed: ${data.context}`,
      ],
      "page-excerpt": [
        "Return a single 1-2 sentence page excerpt (max 180 chars). Plain text only, no quotes.",
        `Page: ${data.context}`,
      ],
    };
    const [sys, usr] = prompts[data.kind];
    const text = await callLovableAI(sys, usr);
    if (data.kind.endsWith("-seo")) {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) try { return { json: JSON.parse(m[0]) as Record<string, string>, text }; } catch { /* fallthrough */ }
    }
    return { text: text.trim().replace(/^["']|["']$/g, "") };
  });
