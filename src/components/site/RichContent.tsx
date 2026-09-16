import DOMPurify from "dompurify";

type Props = {
  html: string;
  className?: string;
};

export function RichContent({ html, className = "" }: Props) {
  const clean = typeof window === "undefined"
    ? html // server-side: skip; hydration replaces with client-sanitized markup
    : DOMPurify.sanitize(html, {
        ADD_ATTR: ["target", "rel"],
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
        FORBID_ATTR: ["onerror", "onload", "onclick"],
      });
  return <div className={`rich-content ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}
