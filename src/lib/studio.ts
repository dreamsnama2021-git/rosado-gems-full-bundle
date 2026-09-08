/**
 * Studio editor — section model, registry of editable section types,
 * and the postMessage protocol used between the admin studio and the
 * live preview iframe.
 */
import slide1 from "@/assets/s-5-1.webp.asset.json";
import slide2 from "@/assets/s-5-2.webp.asset.json";
import slide3 from "@/assets/s-5-3.webp.asset.json";
import ringsImg from "@/assets/cat-rings.jpg.asset.json";
import necklacesImg from "@/assets/cat-necklaces.jpg.asset.json";
import earringsImg from "@/assets/cat-earrings.jpg.asset.json";
import braceletsImg from "@/assets/cat-bracelets.jpg.asset.json";
import img8 from "@/assets/img-5-8.webp.asset.json";
import img9 from "@/assets/img-5-9.jpg.asset.json";
import img10 from "@/assets/img-5-10.webp.asset.json";
import img11 from "@/assets/img-5-11.webp.asset.json";
import img12 from "@/assets/img-5-12.webp.asset.json";
import editorialBackground from "@/assets/editorial-background.jpg.asset.json";
import ig2 from "@/assets/lookbook/ig-2.webp.asset.json";
import ig3 from "@/assets/lookbook/ig-3.webp.asset.json";
import ig4 from "@/assets/lookbook/ig-4.webp.asset.json";
import ig5 from "@/assets/lookbook/ig-5.webp.asset.json";
import ig6 from "@/assets/lookbook/ig-6.webp.asset.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Props = Record<string, any>;

export type StudioSection = {
  id: string;
  type: string;
  visible: boolean;
  props: Props;
};

export type Field =
  | { key: string; label: string; kind: "text" | "textarea" | "image" | "html" | "link" }
  | { key: string; label: string; kind: "select"; options: Array<{ value: string; label: string }> }
  | { key: string; label: string; kind: "products" }
  | { key: string; label: string; kind: "images" }
  | { key: string; label: string; kind: "list"; itemLabel: string; fields: Field[]; itemDefaults: Props };

export type SectionDef = {
  type: string;
  label: string;
  description: string;
  fields: Field[];
  defaults: Props;
};

const heading: Field[] = [
  { key: "eyebrow", label: "Eyebrow", kind: "text" },
  { key: "title", label: "Title", kind: "text" },
  { key: "subtitle", label: "Subtitle", kind: "textarea" },
];

export const SECTION_DEFS: SectionDef[] = [
  {
    type: "hero",
    label: "Hero slider",
    description: "Full-width rotating hero with headline and call to action.",
    fields: [
      {
        key: "slides",
        label: "Slides",
        kind: "list",
        itemLabel: "Slide",
        itemDefaults: { img: slide1.url, eyebrow: "New", title: "Headline", copy: "", cta: "Shop now", href: "/collections", position: "center center" },
        fields: [
          { key: "img", label: "Image", kind: "image" },
          { key: "eyebrow", label: "Eyebrow", kind: "text" },
          { key: "title", label: "Title (use line breaks)", kind: "textarea" },
          { key: "copy", label: "Copy", kind: "textarea" },
          { key: "cta", label: "Button label", kind: "text" },
          { key: "href", label: "Button link", kind: "link" },
          { key: "position", label: "Image focus (CSS object-position)", kind: "text" },
        ],
      },
    ],
    defaults: {
      slides: [
        { img: slide1.url, position: "center 30%", eyebrow: "The New Season", title: "Where light is\ncaught in gold", copy: "Hand-set pendants from the rosado — luminous forms on delicate chains.", cta: "Explore necklaces", href: "/collections/necklaces" },
        { img: slide2.url, position: "center center", eyebrow: "Signature Rings", title: "A quiet promise\nin every band", copy: "Sculpted solitaires and heirloom silhouettes, made to be worn every day.", cta: "Shop rings", href: "/collections/rings" },
        { img: slide3.url, position: "center 30%", eyebrow: "Statement", title: "Colour that\ncatches the sun", copy: "Gemstone earrings and rings in cool blues — refined drops for every hour.", cta: "Shop earrings", href: "/collections/earrings" },
      ],
    },
  },
  {
    type: "gemstones",
    label: "Gemstone shapes",
    description: "Illustrated row of gemstone cuts.",
    fields: [
      ...heading,
      { key: "body", label: "Intro paragraph", kind: "textarea" },
      {
        key: "items",
        label: "Shapes",
        kind: "list",
        itemLabel: "Shape",
        itemDefaults: { shape: "Round", label: "Round", href: "", image: "" },
        fields: [
          { key: "image", label: "Image (optional — replaces the artwork)", kind: "image" },
          {
            key: "shape",
            label: "Shape artwork",
            kind: "select",
            options: [
              { value: "Round", label: "Round" },
              { value: "Emerald", label: "Emerald" },
              { value: "Oval", label: "Oval" },
              { value: "Pear", label: "Pear" },
              { value: "Marquise", label: "Marquise" },
              { value: "Cushion", label: "Cushion" },
            ],
          },
          { key: "label", label: "Label", kind: "text" },
          { key: "href", label: "Link (optional)", kind: "link" },
        ],
      },
    ],
    defaults: {
      eyebrow: "Shape Of Gemstone",
      title: "Every cut tells a story",
      subtitle: "",
      body: "From the classic round brilliant to the emerald's architectural calm — the shape of a stone is the first mark of its character. Choose the one that mirrors yours.",
      items: [
        { shape: "Round", label: "Round", href: "" },
        { shape: "Emerald", label: "Emerald", href: "" },
        { shape: "Oval", label: "Oval", href: "" },
        { shape: "Pear", label: "Pear", href: "" },
        { shape: "Marquise", label: "Marquise", href: "" },
        { shape: "Cushion", label: "Cushion", href: "" },
      ],
    },
  },

  {
    type: "categories",
    label: "Category cards",
    description: "Grid of shop-by-category image cards.",
    fields: [
      ...heading,
      {
        key: "cards",
        label: "Cards",
        kind: "list",
        itemLabel: "Card",
        itemDefaults: { slug: "rings", label: "Rings", img: ringsImg.url },
        fields: [
          { key: "img", label: "Image", kind: "image" },
          { key: "label", label: "Label", kind: "text" },
          { key: "slug", label: "Category slug", kind: "text" },
        ],
      },
    ],
    defaults: {
      eyebrow: "Shop by category",
      title: "Adorned in every way",
      subtitle: "Find the piece that speaks your story.",
      cards: [
        { slug: "rings", label: "Rings", img: ringsImg.url },
        { slug: "necklaces", label: "Necklaces", img: necklacesImg.url },
        { slug: "earrings", label: "Earrings", img: earringsImg.url },
        { slug: "bracelets", label: "Bracelets", img: braceletsImg.url },
      ],
    },
  },
  {
    type: "product_rail",
    label: "Product rail (scrolling)",
    description: "Horizontal scroller of hand-picked products.",
    fields: [
      ...heading,
      { key: "product_ids", label: "Products", kind: "products" },
      { key: "fallback", label: "Fallback when empty", kind: "select", options: [{ value: "new", label: "Products flagged New" }, { value: "bestseller", label: "Products flagged Best seller" }, { value: "none", label: "Nothing" }] },
    ],
    defaults: { eyebrow: "Just In", title: "New Arrival", subtitle: "", product_ids: [], fallback: "new" },
  },
  {
    type: "product_grid",
    label: "Product grid",
    description: "Four-column grid of hand-picked products.",
    fields: [
      ...heading,
      { key: "product_ids", label: "Products", kind: "products" },
      { key: "fallback", label: "Fallback when empty", kind: "select", options: [{ value: "bestseller", label: "Products flagged Best seller" }, { value: "new", label: "Products flagged New" }, { value: "none", label: "Nothing" }] },
    ],
    defaults: { eyebrow: "Beloved", title: "Best Sellers", subtitle: "", product_ids: [], fallback: "bestseller" },
  },
  {
    type: "editorial",
    label: "Editorial banner",
    description: "Split banner with copy and an image mosaic.",
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      { key: "copy", label: "Copy", kind: "textarea" },
      { key: "cta", label: "Button label", kind: "text" },
      { key: "href", label: "Button link", kind: "link" },
      { key: "background", label: "Background image", kind: "image" },
      { key: "images", label: "Mosaic images (5)", kind: "images" },
    ],
    defaults: {
      eyebrow: "GRAM GALLERY",
      title: "Artistry And Inspiration",
      copy: "Discover a selection that blends the latest trends with timeless styles. Our collection offers versatile pieces that elevate your wardrobe.",
      cta: "View All Gallery",
      href: "/collections",
      background: editorialBackground.url,
      images: [img8.url, img9.url, img11.url, img12.url, img10.url],
    },
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Customer review cards with star ratings.",
    fields: [
      ...heading,
      {
        key: "reviews",
        label: "Reviews",
        kind: "list",
        itemLabel: "Review",
        itemDefaults: { quote: "", name: "", location: "", initials: "", tone: "bg-[#e8d5c4] text-[#7a4a2b]" },
        fields: [
          { key: "quote", label: "Quote", kind: "textarea" },
          { key: "name", label: "Name", kind: "text" },
          { key: "location", label: "Location", kind: "text" },
          { key: "initials", label: "Initials", kind: "text" },
        ],
      },
    ],
    defaults: {
      eyebrow: "Testimonials",
      title: "Loved & Worn Everywhere",
      subtitle: "Real words from the people who wear Rosadogems every day — from first heirlooms to bridal moments and everyday little luxuries.",
      reviews: [
        { quote: "I absolutely love my new ring! The craftsmanship is stunning, and it fits perfectly. I've received so many compliments. Thank you for such a beautiful piece!", name: "Candace V. Miller", location: "From Florida", initials: "CM", tone: "bg-[#e8d5c4] text-[#7a4a2b]" },
        { quote: "I was thrilled with my recent purchase! The quality of the jewelry is top-notch, and the shipping was super fast. I'll definitely be a returning customer for sure!", name: "Margaret B. Dobbins", location: "From Louisiana", initials: "MD", tone: "bg-[#f2c9c2] text-[#8a3a3a]" },
        { quote: "I ordered a pair of earrings for a wedding, and they were a huge hit! They complemented my dress beautifully, I felt so confident wearing them that day.", name: "Thersa T. Marston", location: "From California", initials: "TM", tone: "bg-[#f0d1b5] text-[#8a4a1f]" },
        { quote: "This is my go-to place for all gifts! The jewelry is unique, and the recipients always love their beautiful pieces. Great service and fast delivery every time!", name: "Latoya M. White", location: "From Florida", initials: "LW", tone: "bg-[#cddccb] text-[#3d5a3f]" },
      ],
    },
  },
  {
    type: "blog",
    label: "Journal / blog rail",
    description: "Latest blog stories in a horizontal rail.",
    fields: [...heading, { key: "background", label: "Background colour (hex)", kind: "text" }],
    defaults: { eyebrow: "Journal", title: "Stories from the Rosadogems", subtitle: "Field notes on craft, provenance and the quiet rituals behind every piece.", background: "#E8D6C8" },
  },
  {
    type: "lookbook",
    label: "Instagram / lookbook",
    description: "Edge-to-edge image strip linking to social.",
    fields: [...heading, { key: "handle", label: "Instagram handle", kind: "text" }, { key: "tiles", label: "Images", kind: "images" }],
    defaults: {
      eyebrow: "You Would Love You On Social",
      title: "Follow Us @rosado_gemsofficial",
      handle: "rosado_gemsofficial",
      subtitle: "Discover daily sparkle, exclusive drops, and behind-the-scenes moments just for you.",
      tiles: [ig2.url, ig5.url, ig3.url, ig4.url, ig6.url],
    },
  },
  {
    type: "rich_text",
    label: "Rich text block",
    description: "Free-form content block.",
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "html", label: "Content", kind: "html" },
    ],
    defaults: { title: "", html: "<p>Write something…</p>" },
  },
  {
    type: "page_header",
    label: "Page header",
    description: "Page title with eyebrow, intro copy and optional cover image.",
    fields: [
      ...heading,
      { key: "cover", label: "Cover image (optional)", kind: "image" },
      { key: "align", label: "Alignment", kind: "select", options: [{ value: "center", label: "Centered" }, { value: "left", label: "Left" }] },
    ],
    defaults: { eyebrow: "", title: "Page title", subtitle: "", cover: "", align: "center" },
  },
  {
    type: "image_text",
    label: "Image + text",
    description: "Split block with an image on one side and copy on the other.",
    fields: [
      { key: "image", label: "Image", kind: "image" },
      { key: "side", label: "Image side", kind: "select", options: [{ value: "left", label: "Left" }, { value: "right", label: "Right" }] },
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      { key: "html", label: "Copy", kind: "html" },
      { key: "cta", label: "Button label", kind: "text" },
      { key: "href", label: "Button link", kind: "link" },
    ],
    defaults: { image: "", side: "left", eyebrow: "", title: "A section title", html: "<p>Tell the story here.</p>", cta: "", href: "" },
  },
  {
    type: "feature_cards",
    label: "Feature cards",
    description: "Grid of short value / feature cards.",
    fields: [
      ...heading,
      {
        key: "cards",
        label: "Cards",
        kind: "list",
        itemLabel: "Card",
        itemDefaults: { title: "Title", body: "Short description", image: "" },
        fields: [
          { key: "image", label: "Image (optional)", kind: "image" },
          { key: "title", label: "Title", kind: "text" },
          { key: "body", label: "Description", kind: "textarea" },
        ],
      },
    ],
    defaults: {
      eyebrow: "",
      title: "What we stand for",
      subtitle: "",
      cards: [
        { title: "Provenance", body: "Every stone traced from mine to setting.", image: "" },
        { title: "Craft", body: "Hand-set stones, hand-polished finishes.", image: "" },
        { title: "Materials", body: "Recycled 18K gold and ethically sourced gems.", image: "" },
      ],
    },
  },
  {
    type: "contact_info",
    label: "Contact details",
    description: "Row of contact detail cards (visit, call, write, hours).",
    fields: [
      {
        key: "items",
        label: "Details",
        kind: "list",
        itemLabel: "Detail",
        itemDefaults: { icon: "map", title: "Visit", body: "" },
        fields: [
          { key: "icon", label: "Icon", kind: "select", options: [{ value: "map", label: "Location" }, { value: "phone", label: "Phone" }, { value: "mail", label: "Email" }, { value: "clock", label: "Hours" }] },
          { key: "title", label: "Title", kind: "text" },
          { key: "body", label: "Text (line breaks allowed)", kind: "textarea" },
        ],
      },
    ],
    defaults: {
      items: [
        { icon: "map", title: "Visit", body: "Lower Parel\nMumbai 400013" },
        { icon: "phone", title: "Call", body: "+91 93721 45040" },
        { icon: "mail", title: "Write", body: "info.rosadogems@gmail.com" },
        { icon: "clock", title: "Hours", body: "Mon – Sat\n11:00 – 19:00 IST" },
      ],
    },
  },
  {
    type: "contact_form",
    label: "Contact form",
    description: "Working enquiry form that saves messages to the admin inbox.",
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "subtitle", label: "Subtitle", kind: "textarea" },
      { key: "cta", label: "Button label", kind: "text" },
    ],
    defaults: { title: "Send a message", subtitle: "We reply within one business day.", cta: "Send message" },
  },
  {
    type: "cta_banner",
    label: "Call-to-action banner",
    description: "Full-width banner with a headline and a button.",
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "copy", label: "Copy", kind: "textarea" },
      { key: "cta", label: "Button label", kind: "text" },
      { key: "href", label: "Button link", kind: "link" },
      { key: "background", label: "Background image (optional)", kind: "image" },
    ],
    defaults: { title: "Book a private viewing", copy: "Visit the rosado in Lower Parel, Mumbai.", cta: "Contact us", href: "/contact", background: "" },
  },
];


export const SECTION_MAP: Record<string, SectionDef> = Object.fromEntries(
  SECTION_DEFS.map((d) => [d.type, d]),
);

export function sectionLabel(s: StudioSection) {
  const def = SECTION_MAP[s.type];
  const title = typeof s.props?.title === "string" && s.props.title ? s.props.title : def?.label;
  return { title: title ?? s.type, kind: def?.label ?? s.type };
}

export function makeSection(type: string): StudioSection {
  const def = SECTION_MAP[type];
  return {
    id: `${type}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    visible: true,
    props: structuredClone(def?.defaults ?? {}),
  };
}

export function defaultHomeSections(): StudioSection[] {
  const order = ["hero", "gemstones", "categories", "product_rail", "editorial", "product_grid", "testimonials", "blog", "lookbook"];
  return order.map((t) => ({ ...makeSection(t), id: t }));
}

/** Starting layout for a brand-new CMS page. */
export function defaultPageSections(title = "New page"): StudioSection[] {
  const header = makeSection("page_header");
  header.props.title = title;
  const body = makeSection("rich_text");
  return [header, body];
}

/** Convert legacy HTML page bodies into an editable section layout. */
export function sectionsFromLegacyPage(page: { title?: string; excerpt?: string | null; cover_image?: string | null; body?: string | null }): StudioSection[] {
  const header = makeSection("page_header");
  header.props = { ...header.props, title: page.title ?? "Page", subtitle: page.excerpt ?? "", cover: page.cover_image ?? "" };
  const body = makeSection("rich_text");
  body.props = { title: "", html: page.body ?? "" };
  return [header, body];
}



/* ---------------- preview <-> studio messaging ---------------- */

export const STUDIO_PARAM = "studio";

export type StudioMessage =
  | { source: "rosado-studio"; kind: "sections"; sections: StudioSection[]; products: Props[] }
  | { source: "rosado-studio"; kind: "select"; id: string | null };

export type PreviewMessage =
  | { source: "rosado-preview"; kind: "ready" }
  | { source: "rosado-preview"; kind: "select"; id: string }
  | { source: "rosado-preview"; kind: "action"; id: string; action: "up" | "down" | "toggle" | "duplicate" | "delete" }
  | { source: "rosado-preview"; kind: "edit-product"; id: string };
