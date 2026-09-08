import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { getPageBySlug } from "@/lib/pages.functions";
import { StudioSections, pageSections } from "@/components/site/StudioSections";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitContact } from "@/lib/products.functions";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const contactQ = queryOptions({ queryKey: ["page", "contact"], queryFn: () => getPageBySlug({ data: { slug: "contact" } }) });

export const Route = createFileRoute("/contact")({
  loader: ({ context }) => context.queryClient.ensureQueryData(contactQ),
  head: () => ({
    meta: [
      { title: "Contact Us — Rosado Gems, Lower Parel Mumbai" },
      { name: "description", content: "Book a private viewing at the Rosado Gems in Lower Parel, Mumbai." },
      { property: "og:title", content: "Contact Rosado Gems" },
      { property: "og:description", content: "Visit the rosado in Lower Parel, Mumbai by appointment." },
      { property: "og:url", content: "https://rosado.techberries.com/contact" },
    ],
    links: [{ rel: "canonical", href: "https://rosado.techberries.com/contact" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "JewelryStore",
        name: "Rosado Gems",
        url: "https://rosado.techberries.com/contact",
        telephone: "+91-93721-45040",
        email: "info.rosadogems@gmail.com",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Lower Parel",
          addressLocality: "Mumbai",
          postalCode: "400013",
          addressRegion: "Maharashtra",
          addressCountry: "IN",
        },
        openingHoursSpecification: [{
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          opens: "11:00",
          closes: "19:00",
        }],
      }),
    }],
  }),
  component: Contact,
});

function Contact() {
  const page = useSuspenseQuery(contactQ).data;
  const secs = pageSections(page);
  const submit = useServerFn(submitContact);
  const [pending, setPending] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setPending(true);
    try {
      await submit({ data: {
        name: String(f.get("name")),
        email: String(f.get("email")),
        phone: String(f.get("phone") || ""),
        subject: String(f.get("subject") || ""),
        message: String(f.get("message")),
      }});
      toast.success("Message received — the rosado will be in touch.");
      e.currentTarget.reset();
    } catch { toast.error("Could not send message"); }
    finally { setPending(false); }
  }

  return (
    <SiteShell>
      <StudioSections
        sections={secs}
        fallback={
      <>
      <section className="py-16 md:py-20">
        <div className="container-site text-center">
          <p className="eyebrow mb-3">Get In Touch</p>
          <h1 className="font-display text-5xl md:text-6xl">Contact Us</h1>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Book a private viewing or write to the rosado. We reply within one business day.</p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-site grid gap-4 md:grid-cols-4">
          {[
            { i: MapPin, t: "Visit", d: "Lower Parel\nMumbai 400013" },
            { i: Phone, t: "Call", d: "+91 93721 45040" },
            { i: Mail, t: "Write", d: "info.rosadogems@gmail.com" },
            { i: Clock, t: "Hours", d: "Mon – Sat\n11:00 – 19:00 IST" },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="border border-border p-6 text-center">
              <Icon className="mx-auto mb-3 h-5 w-5 text-primary" />
              <p className="eyebrow mb-2">{t}</p>
              <p className="whitespace-pre-line text-sm">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-24">
        <div className="container-site grid gap-12 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Message the rosado</p>
            <h2 className="mb-6 font-display text-3xl md:text-4xl">We would love to hear from you</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input name="name" label="Full name" required />
                <Input name="email" label="Email" type="email" required />
                <Input name="phone" label="Phone" />
                <Input name="subject" label="Subject" />
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">Message *</span>
                <textarea name="message" rows={5} required className="border border-border bg-transparent p-3 text-sm outline-none focus:border-primary" />
              </label>
              <button disabled={pending} className="btn-primary disabled:opacity-60"><span>{pending ? "Sending…" : "Send message"}</span></button>
            </form>
          </div>
          <div>
            <div className="aspect-square overflow-hidden">
              <iframe title="Rosado Gems Location" src="https://www.google.com/maps?q=Lower+Parel,+Mumbai&output=embed" className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </div>
        </div>
      </section>
      </>
        }
      />
    </SiteShell>
  );
}

function Input({ name, label, type="text", required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">{label}{required && " *"}</span>
      <input name={name} type={type} required={required} className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-primary" />
    </label>
  );
}
