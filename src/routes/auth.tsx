import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteShell } from "@/components/site/SiteShell";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — Rosado Gems" }, { name: "description", content: "Sign in to your Rosado Gems account." }] }),
  validateSearch: z.object({ redirect: z.string().optional() }).parse,
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: (redirect as "/account") ?? "/account" });
    });
  }, [nav, redirect]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        nav({ to: (redirect as "/account") ?? "/account" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setBusy(false); }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (r.error) toast.error(r.error.message);
      if (!r.redirected && !r.error) nav({ to: (redirect as "/account") ?? "/account" });
    } finally { setBusy(false); }
  }

  return (
    <SiteShell>
      <section className="container-site py-16 md:py-24">
        <div className="mx-auto max-w-md">
          <p className="eyebrow mb-3 text-center">Account</p>
          <h1 className="mb-2 text-center font-display text-4xl">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to your Rosado Gems account" : "Join the Rosado Gems family"}
          </p>

          <button onClick={handleGoogle} disabled={busy}
            className="mb-4 w-full h-11 rounded-sm border border-foreground/20 bg-background text-sm font-medium hover:bg-header-top transition-colors">
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
                className="w-full h-11 border border-foreground/20 bg-background px-4 text-sm rounded-sm" />
            )}
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="w-full h-11 border border-foreground/20 bg-background px-4 text-sm rounded-sm" />
            <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
              className="w-full h-11 border border-foreground/20 bg-background px-4 text-sm rounded-sm" />
            <button disabled={busy} className="w-full h-11 rounded-sm bg-foreground text-background text-sm font-medium hover:opacity-90">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="underline hover:text-foreground">
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">← Back home</Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
