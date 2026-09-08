import { Facebook, Twitter, Link as LinkIcon, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ShareBar({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const shareUrl = typeof window !== "undefined" ? window.location.href : url;

  const links = [
    { key: "fb", label: "Facebook", Icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}` },
    { key: "tw", label: "X (Twitter)", Icon: Twitter, href: `https://twitter.com/intent/tweet?url=${enc(shareUrl)}&text=${enc(title)}` },
    { key: "email", label: "Email", Icon: Mail, href: `mailto:?subject=${enc(title)}&body=${enc(shareUrl)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div className="flex items-center gap-3 border-t border-b border-border py-4 my-8">
      <span className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground mr-2">Share</span>
      {links.map(({ key, label, Icon, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          className="grid h-9 w-9 place-items-center rounded-full border border-foreground/20 text-foreground/70 transition-all hover:bg-foreground hover:text-background hover:border-foreground"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        className="grid h-9 w-9 place-items-center rounded-full border border-foreground/20 text-foreground/70 transition-all hover:bg-foreground hover:text-background hover:border-foreground"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      {copied && <span className="text-xs text-muted-foreground">Copied</span>}
    </div>
  );
}
