/** Shared, client-safe footer configuration model + defaults. */

export type FooterLink = { label: string; to: string };
export type FooterColumn = { title: string; links: FooterLink[] };

export type FooterConfig = {
  heading: string;
  blurb: string;
  follow_label: string;
  socials: { facebook: string; instagram: string; twitter: string; youtube: string; tiktok: string };
  contact_title: string;
  contact: { phone: string; address: string; email: string; hours: string };
  columns: FooterColumn[];
  copyright: string;
  locale_label: string;
  language_label: string;
  badges: string[];
};

export const DEFAULT_FOOTER: FooterConfig = {
  heading: "Thank You For Choosing Us!",
  blurb:
    "We appreciate your support and are dedicated to providing you with the finest jewelry and certified gemstones. Your trust is our highest honor, and we look forward to crafting more heirlooms with you.",
  follow_label: "Follow Us:",
  socials: { facebook: "", instagram: "", twitter: "", youtube: "", tiktok: "" },
  contact_title: "Contact Us",
  contact: {
    phone: "+91 93721 45040",
    address: "Lower Parel, Mumbai",
    email: "info.rosadogems@gmail.com",
    hours: "Mon–Sat: 11:00AM – 19:00PM",
  },
  columns: [
    {
      title: "My Account",
      links: [
        { label: "Login/Register", to: "/auth" },
        { label: "Wishlist", to: "/account" },
        { label: "Track Your Orders", to: "/account" },
        { label: "Checkout", to: "/checkout" },
      ],
    },
    {
      title: "Our Policies",
      links: [
        { label: "Shipping & Delivery", to: "/shipping" },
        { label: "Returns Policy", to: "/shipping" },
        { label: "Terms & Conditions", to: "/terms" },
        { label: "Privacy Policy", to: "/privacy" },
      ],
    },
    {
      title: "Customer Care",
      links: [
        { label: "FAQs", to: "/contact" },
        { label: "Terms of Service", to: "/terms" },
        { label: "Privacy Policy", to: "/privacy" },
        { label: "Gift Card", to: "/contact" },
      ],
    },
  ],
  copyright: "Copyright © {year} Rosado Gems. All Rights Reserved.",
  locale_label: "🇮🇳 India | INR ₹",
  language_label: "🌐 English",
  badges: ["VISA", "PAY", "AMEX", "UPI", "PAYPAL"],
};

export const DEFAULT_HEADER_MENU = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "My Shop", to: "/collections", mega: true },
  { label: "Our Blog", to: "/blog" },
  { label: "Contact Us", to: "/contact" },
];

/** Merge a stored (possibly partial) config over the defaults. */
export function mergeFooter(raw: unknown): FooterConfig {
  const v = (raw ?? {}) as Partial<FooterConfig>;
  return {
    ...DEFAULT_FOOTER,
    ...v,
    socials: { ...DEFAULT_FOOTER.socials, ...(v.socials ?? {}) },
    contact: { ...DEFAULT_FOOTER.contact, ...(v.contact ?? {}) },
    columns: v.columns && v.columns.length > 0 ? v.columns : DEFAULT_FOOTER.columns,
    badges: v.badges && v.badges.length > 0 ? v.badges : DEFAULT_FOOTER.badges,
  };
}
