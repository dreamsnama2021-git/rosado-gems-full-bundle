import { useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin, Clock, Twitter, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { mergeFooter } from "@/lib/footer-config";
import { CurrencySelector } from "./CurrencyPrompt";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.6 6.9a5.3 5.3 0 0 1-3.2-1.1 5.3 5.3 0 0 1-2-3.3h-3.2v13.1a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5 0 .8.1V9.9a5.7 5.7 0 1 0 5 5.7V9.2a8.6 8.6 0 0 0 5.1 1.6z" />
    </svg>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  const cls = "text-foreground/70 transition-colors hover:text-primary";
  const router = useRouter();
  const external = /^(https?:|mailto:|tel:)/.test(to);
  if (external) return <a href={to} className={cls} target="_blank" rel="noreferrer">{children}</a>;
  return (
    <a
      href={to}
      className={cls}
      onClick={(e) => { e.preventDefault(); router.navigate({ to, replace: false } as never); }}
    >
      {children}
    </a>
  );
}

export function Footer() {
  const settingsQ = useQuery({ queryKey: ["site-settings"], queryFn: () => getSiteSettings() });
  const f = mergeFooter(settingsQ.data?.footer_menu);
  const socials: Array<[string, string, React.ComponentType<{ className?: string }>]> = [
    ["Facebook", f.socials.facebook, Facebook],
    ["Instagram", f.socials.instagram, Instagram],
    ["X", f.socials.twitter, Twitter],
    ["YouTube", f.socials.youtube, Youtube],
    ["TikTok", f.socials.tiktok, TikTokIcon],
  ];

  return (
    <footer className="bg-[#F2F2F2]">
      <div className="container-site py-20">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Left: Brand */}
          <div className="lg:col-span-4">
            <Logo className="h-[54.72px]" />
            <h3 className="mt-8 text-xl font-medium tracking-tight text-foreground">{f.heading}</h3>
            <p className="mt-4 max-w-md text-[14.3px] leading-[1.85] text-muted-foreground">{f.blurb}</p>

            <div className="mt-10">
              <p className="mb-4 text-sm text-foreground/80">{f.follow_label}</p>
              <div className="flex items-center gap-6 text-foreground/70">
                {socials.map(([name, url, Icon]) => (
                  <a key={name} href={url || "#"} target={url ? "_blank" : undefined} rel="noreferrer" aria-label={name} className="transition-colors hover:text-primary">
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Contact + Link columns */}
          <div className="lg:col-span-8 lg:border-l lg:border-[#dcdcdc] lg:pl-10">
            <h3 className="text-lg font-medium text-foreground">{f.contact_title}</h3>

            <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3 text-[13px] text-foreground/80">
                <Phone className="mt-0.5 h-[18px] w-[18px] shrink-0 text-foreground/60" />
                <span>{f.contact.phone}</span>
              </div>
              <div className="flex items-start gap-3 text-[13px] text-foreground/80">
                <MapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-foreground/60" />
                <span>{f.contact.address}</span>
              </div>
              <div className="flex items-start gap-3 text-[13px] text-foreground/80">
                <Mail className="mt-0.5 h-[18px] w-[18px] shrink-0 text-foreground/60" />
                <span className="break-all">{f.contact.email}</span>
              </div>
              <div className="flex items-start gap-3 text-[13px] text-foreground/80">
                <Clock className="mt-0.5 h-[18px] w-[18px] shrink-0 text-foreground/60" />
                <span>{f.contact.hours}</span>
              </div>
            </div>

            <div className="my-10 border-t border-[#dcdcdc]" />

            <div className="grid gap-10 sm:grid-cols-3">
              {f.columns.map((col) => (
                <div key={col.title}>
                  <p className="mb-6 text-base font-medium text-foreground">{col.title}</p>
                  <ul className="space-y-4 text-[13px]">
                    {col.links.map((l) => (
                      <li key={`${col.title}-${l.label}-${l.to}`}>
                        <FooterLink to={l.to}>{l.label}</FooterLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#dcdcdc]">
        <div className="container-site grid grid-cols-1 items-center gap-4 py-6 text-xs text-muted-foreground md:grid-cols-3">
          <div className="flex items-center gap-6 md:justify-self-start">
            <CurrencySelector className="transition-colors hover:text-foreground" />
            <button className="flex items-center gap-2 transition-colors hover:text-foreground">
              {f.language_label} <ChevronDown className="h-3 w-3" />
            </button>
          </div>
          <span className="text-center">{f.copyright.replace("{year}", String(new Date().getFullYear()))}</span>
          <div className="flex items-center gap-2 md:justify-self-end">
            {f.badges.map((b) => (
              <span key={b} className="rounded bg-background px-2 py-1 text-[10px] font-semibold tracking-[0.15em] text-foreground/70 border border-border">{b}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
