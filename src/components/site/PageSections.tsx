import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { submitContact } from "@/lib/products.functions";
import { RichContent } from "@/components/site/RichContent";
import type { Props } from "@/lib/studio";

const ICONS = { map: MapPin, phone: Phone, mail: Mail, clock: Clock } as const;

export function PageHeaderSection({ eyebrow, title, subtitle, cover, align = "center" }: Props) {
  return (
    <>
      {cover ? (
        <div className="h-[42vh] min-h-[280px] overflow-hidden">
          <img src={cover} alt={title ?? ""} className="h-full w-full object-cover" />
        </div>
      ) : null}
      <section className="py-14 md:py-16">
        <div className={`container-site ${align === "left" ? "text-left" : "text-center"}`}>
          {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
          {title ? <h1 className="font-display text-4xl leading-tight md:text-6xl">{title}</h1> : null}
          {subtitle ? (
            <p className={`mt-4 max-w-2xl text-muted-foreground ${align === "left" ? "" : "mx-auto"}`}>{subtitle}</p>
          ) : null}
        </div>
      </section>
    </>
  );
}

export function ImageTextSection({ image, side = "left", eyebrow, title, html, cta, href }: Props) {
  return (
    <section className="py-12 md:py-16">
      <div className="container-site grid items-center gap-8 md:grid-cols-2">
        {image ? (
          <div className={`overflow-hidden rounded-sm ${side === "right" ? "md:order-2" : ""}`}>
            <img src={image} alt={title ?? ""} className="h-full w-full object-cover" loading="lazy" />
          </div>
        ) : null}
        <div>
          {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
          {title ? <h2 className="mb-4 font-display text-3xl md:text-4xl">{title}</h2> : null}
          <RichContent html={html ?? ""} />
          {cta && href ? (
            <a href={href} className="mt-6 inline-flex h-11 items-center border border-foreground px-6 text-xs uppercase tracking-[0.2em]">
              {cta}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function FeatureCardsSection({ eyebrow, title, subtitle, cards = [] }: Props) {
  return (
    <section className="py-12 md:py-16">
      <div className="container-site">
        <div className="mb-8 text-center">
          {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
          {title ? <h2 className="font-display text-3xl md:text-4xl">{title}</h2> : null}
          {subtitle ? <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(cards as Props[]).map((c, i) => (
            <div key={i} className="border border-border p-6">
              {c.image ? <img src={c.image} alt="" className="mb-4 h-40 w-full object-cover" loading="lazy" /> : null}
              <h3 className="font-display text-xl">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactInfoSection({ items = [] }: Props) {
  return (
    <section className="pb-8">
      <div className="container-site grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {(items as Props[]).map((it, i) => {
          const Icon = ICONS[(it.icon as keyof typeof ICONS) ?? "map"] ?? MapPin;
          return (
            <div key={i} className="border border-border p-6 text-center">
              <Icon className="mx-auto mb-3 h-5 w-5 text-primary" />
              <p className="text-xs uppercase tracking-[0.2em]">{it.title}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{it.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ContactFormSection({ title, subtitle, cta = "Send message" }: Props) {
  const submit = useServerFn(submitContact);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setPending(true);
    try {
      await submit({
        data: {
          name: String(f.get("name")),
          email: String(f.get("email")),
          phone: String(f.get("phone") || ""),
          subject: String(f.get("subject") || ""),
          message: String(f.get("message")),
        },
      });
      toast.success("Message received — we will be in touch.");
      form.reset();
    } catch {
      toast.error("Could not send message");
    } finally {
      setPending(false);
    }
  }

  const input = "h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-foreground";

  return (
    <section className="py-12 md:py-16">
      <div className="container-site max-w-3xl">
        {title ? <h2 className="mb-2 font-display text-3xl md:text-4xl">{title}</h2> : null}
        {subtitle ? <p className="mb-8 text-muted-foreground">{subtitle}</p> : null}
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <input name="name" required placeholder="Name" className={input} />
          <input name="email" type="email" required placeholder="Email" className={input} />
          <input name="phone" placeholder="Phone (optional)" className={input} />
          <input name="subject" placeholder="Subject" className={input} />
          <textarea name="message" required rows={5} placeholder="Message" className="sm:col-span-2 w-full border border-border bg-background p-3 text-sm outline-none focus:border-foreground" />
          <div className="sm:col-span-2">
            <button disabled={pending} className="h-11 border border-foreground px-8 text-xs uppercase tracking-[0.2em] disabled:opacity-50">
              {pending ? "Sending…" : cta}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export function CtaBannerSection({ title, copy, cta, href, background }: Props) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {background ? (
        <>
          <img src={background} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-background/70" />
        </>
      ) : null}
      <div className="container-site relative text-center">
        {title ? <h2 className="font-display text-3xl md:text-5xl">{title}</h2> : null}
        {copy ? <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{copy}</p> : null}
        {cta && href ? (
          <a href={href} className="mt-8 inline-flex h-11 items-center border border-foreground px-8 text-xs uppercase tracking-[0.2em]">
            {cta}
          </a>
        ) : null}
      </div>
    </section>
  );
}
