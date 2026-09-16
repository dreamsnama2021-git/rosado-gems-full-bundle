import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState, Link } from "@tanstack/react-router";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { useAuth } from "@/lib/auth-hooks";
import { Logo } from "@/components/site/Logo";

const ALLOWED_PREFIXES = ["/auth", "/admin", "/api"];

/**
 * Shows the "under construction" screen to visitors when the admin has enabled
 * maintenance mode. Signed-in administrators keep full access to the site.
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { roles, loading } = useAuth();
  const { data } = useQuery({
    queryKey: ["site-settings", "public", "maintenance"],
    queryFn: () => getSiteSettings(),
    staleTime: 60 * 1000,
  });

  const enabled = Boolean((data as unknown as { maintenance_enabled?: boolean } | null)?.maintenance_enabled);
  const bypass = ALLOWED_PREFIXES.some((p) => pathname.startsWith(p)) || roles.includes("admin") || loading;
  if (!enabled || bypass) return <>{children}</>;

  const s = data as unknown as {
    maintenance_title?: string;
    maintenance_message?: string;
    maintenance_eta?: string;
    maintenance_image?: string;
  };

  return (
    <UnderConstruction
      title={s.maintenance_title || "We are polishing something beautiful"}
      message={s.maintenance_message || "Our rosado is being refreshed. We will be back very shortly."}
      eta={s.maintenance_eta || ""}
      image={s.maintenance_image || ""}
    />
  );
}

function UnderConstruction({ title, message, eta, image }: { title: string; message: string; eta: string; image: string }) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-6 py-16 text-center">
      {image ? (
        <img src={image} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-25" />
      ) : null}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 50% at 50% 20%, color-mix(in oklab, var(--header-top, #E8D6C8) 70%, transparent) 0%, transparent 70%)" }}
      />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl" aria-hidden />

      <div className="relative z-10 mx-auto max-w-2xl">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <p className="eyebrow mb-5">Under construction</p>

        <h1 className="font-display text-4xl leading-tight sm:text-6xl">{title}</h1>

        <div className="mx-auto my-8 flex items-center justify-center gap-3" aria-hidden>
          <span className="h-px w-16 bg-border" />
          <span className="h-2 w-2 rotate-45 border border-foreground/40" />
          <span className="h-px w-16 bg-border" />
        </div>

        <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">{message}</p>

        {eta ? (
          <p className="mt-8 inline-block rounded-full border border-border px-5 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {eta}
          </p>
        ) : null}

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <a href="mailto:info.rosadogems@gmail.com" className="btn-primary"><span>Email us</span></a>
          <a href="https://instagram.com/rosado_gemsofficial" target="_blank" rel="noreferrer" className="btn-ghost"><span>Follow @rosado_gemsofficial</span></a>
        </div>

        <p className="mt-14 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Administrator? <Link to="/auth" className="underline underline-offset-4">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
