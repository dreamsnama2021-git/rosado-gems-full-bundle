import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeNewsletter } from "@/lib/products.functions";
import { toast } from "sonner";
import { Reveal } from "@/components/site/Reveal";

export function NewsletterBand() {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setPending(true);
    try { await subscribe({ data: { email } }); toast.success("Welcome to the rosado"); setEmail(""); }
    catch { toast.error("Something went wrong"); }
    finally { setPending(false); }
  }
  return (
    <section className="py-20 bg-header-top text-foreground">
      <div className="container-site grid gap-8 md:grid-cols-2 md:items-center">
        <Reveal>
          <p className="eyebrow mb-3 !text-primary-glow">The Rosado Letter</p>
          <h2 className="font-display text-3xl md:text-4xl">Private previews, delivered rarely</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <form onSubmit={onSubmit} className="flex border border-foreground/25 bg-transparent">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Your email" className="flex-1 bg-transparent px-5 py-4 text-sm text-foreground placeholder:text-foreground/50 outline-none" />
            <button disabled={pending} className="bg-foreground px-6 text-[0.72rem] uppercase tracking-[0.22em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60">{pending ? "…" : "Subscribe"}</button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
