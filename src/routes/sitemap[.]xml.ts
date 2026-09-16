import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "https://rosado.techberries.com";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

function pub() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

function encodePath(path: string) {
  return path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/")
    .replace(/&/g, "&amp;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/collections", changefreq: "weekly", priority: "0.9" },
          { path: "/blog", changefreq: "weekly", priority: "0.7" },
          { path: "/about", changefreq: "monthly", priority: "0.6" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/shipping", changefreq: "yearly", priority: "0.3" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
        ];

        try {
          const c = pub();
          const [cats, prods, posts, pages] = await Promise.all([
            c.from("categories").select("slug"),
            c.from("products").select("slug"),
            c.from("blog_posts").select("slug"),
            c.from("pages").select("slug").eq("published", true),
          ]);
          const reserved = new Set(["about", "contact", "privacy", "terms", "shipping"]);
          for (const r of cats.data ?? []) entries.push({ path: `/collections/${r.slug}`, changefreq: "weekly", priority: "0.8" });
          for (const r of prods.data ?? []) entries.push({ path: `/products/${r.slug}`, changefreq: "weekly", priority: "0.8" });
          for (const r of posts.data ?? []) entries.push({ path: `/blog/${r.slug}`, changefreq: "monthly", priority: "0.6" });
          for (const r of pages.data ?? []) {
            if (!reserved.has(r.slug)) entries.push({ path: `/pages/${r.slug}`, changefreq: "monthly", priority: "0.5" });
          }
        } catch {
          // Fall back to the static routes above when the database is unreachable.
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${encodePath(e.path)}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
