import { useEffect, useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { searchSite } from "@/lib/account.functions";
import { useMoney } from "@/lib/currency";

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const money = useMoney();
  const [q, setQ] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [res, setRes] = useState<{ products: any[]; posts: any[]; categories: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 20); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!q.trim()) { setRes(null); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try { const r = await searchSite({ data: { q: q.trim() } }); setRes(r); }
      finally { setLoading(false); }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose}>
      <div className="mx-auto mt-24 max-w-2xl bg-background rounded-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, categories, journal…"
            className="flex-1 h-14 bg-transparent text-base outline-none placeholder:text-muted-foreground" />
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading && <p className="text-sm text-muted-foreground">Searching…</p>}
          {!loading && !res && <p className="text-sm text-muted-foreground">Start typing to search.</p>}
          {res && (
            <div className="space-y-6">
              {res.products.length > 0 && (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Products</p>
                  <div className="grid gap-2">
                    {res.products.map((p) => (
                      <Link key={p.id} to="/products/$slug" params={{ slug: p.slug }} onClick={onClose}
                        className="flex items-center gap-3 hover:bg-header-top p-2 rounded-sm">
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="h-10 w-10 object-cover rounded-sm" />}
                        <span className="flex-1 text-sm">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{money(Number(p.price))}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {res.categories.length > 0 && (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {res.categories.map((c) => (
                      <Link key={c.id} to="/collections/$slug" params={{ slug: c.slug }} onClick={onClose}
                        className="text-sm border border-border px-3 py-1 rounded-sm hover:border-foreground">{c.name}</Link>
                    ))}
                  </div>
                </div>
              )}
              {res.posts.length > 0 && (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Journal</p>
                  <div className="grid gap-2">
                    {res.posts.map((p) => (
                      <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} onClick={onClose}
                        className="flex items-center gap-3 hover:bg-header-top p-2 rounded-sm">
                        {p.cover_image && <img src={p.cover_image} alt="" className="h-10 w-16 object-cover rounded-sm" />}
                        <span className="text-sm">{p.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {res.products.length === 0 && res.categories.length === 0 && res.posts.length === 0 && (
                <p className="text-sm text-muted-foreground">No results for "{q}".</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
