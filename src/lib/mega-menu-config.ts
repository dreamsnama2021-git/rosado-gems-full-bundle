/** Shared, client-safe mega-menu configuration model + defaults. */

export type MegaLink = { label: string; to: string; badge?: string };
export type MegaColumn = { title: string; links: MegaLink[] };
export type MegaPromo = { img: string; eyebrow: string; title: string; href: string };

export type MegaMenuConfig = {
  enabled: boolean;
  columns: MegaColumn[];
  promos: MegaPromo[];
  promo_rotate: boolean;
  promo_interval: number; // ms
  footer_note: string;
  footer_link_label: string;
  footer_link_to: string;
};

export const DEFAULT_MEGA_MENU: MegaMenuConfig = {
  enabled: true,
  promo_rotate: true,
  promo_interval: 3500,
  footer_note: "Complimentary shipping & certified gemstones on every order.",
  footer_link_label: "View all jewelry",
  footer_link_to: "/collections",
  columns: [
    {
      title: "Best Sellers",
      links: [
        { label: "Diamond Rings", to: "/collections/rings" },
        { label: "Tennis Bracelets", to: "/collections/bracelets" },
        { label: "Charm Necklaces", to: "/collections/necklaces" },
        { label: "Emerald Studs", to: "/collections/earrings" },
        { label: "Statement Brooches", to: "/collections/brooches" },
      ],
    },
    {
      title: "New Arrival",
      links: [
        { label: "Rose-Gold Bangles", to: "/collections/bracelets" },
        { label: "Sapphire Halo Studs", to: "/collections/earrings" },
        { label: "Marquise Anklets", to: "/collections/anklets" },
        { label: "Layered Chains", to: "/collections/necklaces" },
        { label: "Vintage Rings", to: "/collections/rings" },
      ],
    },
    {
      title: "Top Trending",
      links: [
        { label: "Vintage Rose Rings", to: "/collections/rings" },
        { label: "Layered Chains", to: "/collections/necklaces" },
        { label: "Ruby Chandeliers", to: "/collections/earrings" },
        { label: "Charm Anklets", to: "/collections/anklets" },
        { label: "Floral Brooches", to: "/collections/brooches" },
      ],
    },
    {
      title: "Signature Edit",
      links: [
        { label: "Ring Solitaires", to: "/collections/rings" },
        { label: "Everyday Earrings", to: "/collections/earrings" },
        { label: "Silver Anklets", to: "/collections/anklets" },
        { label: "Sculpted Brooches", to: "/collections/brooches" },
        { label: "Bracelet Bangles", to: "/collections/bracelets" },
      ],
    },
  ],
  promos: [
    {
      img: "https://cdn.shopify.com/s/files/1/0657/4099/6662/files/Rings12.jpg?v=1740106372",
      eyebrow: "New in",
      title: "The Ring Edit",
      href: "/collections/rings",
    },
    {
      img: "https://cdn.shopify.com/s/files/1/0657/4099/6662/files/Necklace10.jpg?v=1740105670",
      eyebrow: "Limited",
      title: "Layered Necklaces",
      href: "/collections/necklaces",
    },
  ],
};

/** Merge a stored (possibly partial) config over the defaults. */
export function mergeMegaMenu(raw: unknown): MegaMenuConfig {
  const v = (raw ?? {}) as Partial<MegaMenuConfig>;
  return {
    ...DEFAULT_MEGA_MENU,
    ...v,
    columns: Array.isArray(v.columns) && v.columns.length > 0 ? v.columns : DEFAULT_MEGA_MENU.columns,
    promos: Array.isArray(v.promos) ? v.promos : DEFAULT_MEGA_MENU.promos,
  };
}
