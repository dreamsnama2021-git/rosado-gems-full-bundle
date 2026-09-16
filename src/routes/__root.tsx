import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteShell } from "@/components/site/SiteShell";
import { AuthProvider } from "@/lib/auth-hooks";
import { CustomScripts } from "@/components/site/CustomScripts";
import { CurrencyBoot } from "@/components/site/CurrencyBoot";
import { refreshStorefront, subscribeStorefrontRefresh } from "@/lib/storefront-refresh";

function NotFoundComponent() {
  return (
    <SiteShell>
      <section className="container-site grid min-h-[60vh] place-items-center py-20 text-center">
        <div>
          <p className="eyebrow mb-4">404</p>
          <h1 className="mb-3 font-display text-5xl">This page has slipped away</h1>
          <p className="mb-8 text-muted-foreground">The page you're looking for isn't here. Return to the rosado.</p>
          <a href="/" className="btn-primary"><span>Return home</span></a>
        </div>
      </section>
    </SiteShell>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please try again — the rosado is here.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => { router.invalidate(); reset(); }} className="btn-primary"><span>Try again</span></button>
          <a href="/" className="btn-ghost"><span>Go home</span></a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Rosado Gems — Fine Jewelry & Certified Gemstones · Mumbai" },
      { name: "description", content: "Discover heritage rings, necklaces, earrings, bracelets and bridal collections from the Rosado Gems in Lower Parel, Mumbai." },
      { name: "author", content: "Rosado Gems" },
      { property: "og:title", content: "Rosado Gems — Fine Jewelry & Certified Gemstones · Mumbai" },
      { property: "og:description", content: "Discover heritage rings, necklaces, earrings, bracelets and bridal collections from the Rosado Gems in Lower Parel, Mumbai." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Rosado Gems — Fine Jewelry & Certified Gemstones · Mumbai" },
      { name: "twitter:description", content: "Discover heritage rings, necklaces, earrings, bracelets and bridal collections from the Rosado Gems in Lower Parel, Mumbai." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/4ae6e882-b988-49dc-b479-7e9b4394cc1d" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/4ae6e882-b988-49dc-b479-7e9b4394cc1d" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Jost:wght@300;400;500&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Rosado Gems",
          url: "https://rosado.techberries.com",
          logo: "https://rosado.techberries.com/apple-touch-icon.png",
          email: "info.rosadogems@gmail.com",
          telephone: "+91-93721-45040",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Lower Parel",
            addressLocality: "Mumbai",
            postalCode: "400013",
            addressRegion: "Maharashtra",
            addressCountry: "IN",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Rosado Gems",
          url: "https://rosado.techberries.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://rosado.techberries.com/collections?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (cancelled) return;
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      });
      return () => sub.subscription.unsubscribe();
    })();
    return () => { cancelled = true; };
  }, [queryClient, router]);

  // Refetch storefront data when an admin save happens in another tab/frame.
  useEffect(
    () => subscribeStorefrontRefresh(() => { void refreshStorefront(queryClient, router); }),
    [queryClient, router],
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyBoot>
          <CustomScripts />
          <Outlet />
        </CurrencyBoot>
      </AuthProvider>
    </QueryClientProvider>
  );
}
