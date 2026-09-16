import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageCircle,
  X,
  Send,
  Share2,
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Gem,
} from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

function renderMarkdown(text: string) {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((\/[^\s)]+)\)/g, '<a href="$2" class="underline text-primary">$1</a>')
    .replace(/\n/g, "<br/>");
}

type ChatPanelProps = {
  className?: string;
  onClose: () => void;
  messages: Msg[];
  input: string;
  setInput: (v: string) => void;
  sending: boolean;
  sendMessage: () => void;
};

function ChatPanel({
  className,
  onClose,
  messages,
  input,
  setInput,
  sending,
  sendMessage,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e6, behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-background border border-border shadow-2xl",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-header-top border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Gem className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-medium">Rose · Rosado Gems</div>
            <div className="text-[10px] text-muted-foreground">Online now</div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
              dangerouslySetInnerHTML={
                m.role === "assistant" ? { __html: renderMarkdown(m.content) } : undefined
              }
            >
              {m.role === "user" ? m.content : null}
            </div>
          </div>
        ))}
        {sending && <div className="text-xs text-muted-foreground italic">Rose is typing…</div>}
      </div>
      <form
        className="flex items-center gap-2 border-t border-border p-2"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a piece…"
          className="flex-1 h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="h-10 w-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export function FloatingWidgets() {
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings(),
    staleTime: 60_000,
  });

  const [open, setOpen] = useState(false);
  const [pane, setPane] = useState<"menu" | "chat" | "share">("menu");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Rose from Rosado Gems ✨ Ask me about our jewelry, or tell me what you're looking for.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<{ pane: "chat" | "share" | "menu" }>).detail;
      setOpen(true);
      setPane(detail?.pane ?? "menu");
    }
    window.addEventListener("floating-widget:open", onOpen);
    return () => window.removeEventListener("floating-widget:open", onOpen);
  }, []);

  if (!settings) return null;

  const s = settings;
  const anySocial =
    s.social_share_enabled &&
    (s.share_instagram || s.share_facebook || s.share_twitter || s.share_email);
  const showAny = s.ai_chat_enabled || s.whatsapp_enabled || anySocial;
  if (!showAny) return null;

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const pageTitle = typeof document !== "undefined" ? document.title : "Rosado Gems";
  const waHref = `https://wa.me/${s.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(s.whatsapp_message)}`;

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Chat failed");
      setMessages((m) => [...m, { role: "assistant", content: j.text || "…" }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: (e as Error).message }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Mobile chat overlay */}
      {open && pane === "chat" && s.ai_chat_enabled && (
        <ChatPanel
          className="fixed bottom-0 left-0 right-0 z-50 h-[80dvh] rounded-t-2xl border-t lg:hidden"
          onClose={() => {
            setOpen(false);
            setPane("menu");
          }}
          messages={messages}
          input={input}
          setInput={setInput}
          sending={sending}
          sendMessage={sendMessage}
        />
      )}

      {/* Desktop floating menu + panels */}
      <div className="fixed bottom-24 right-4 z-40 hidden lg:bottom-6 lg:right-6 lg:flex lg:flex-col lg:items-end lg:gap-3">
        {open && pane === "chat" && s.ai_chat_enabled && (
          <ChatPanel
            className="w-[92vw] max-w-[380px] h-[70vh] max-h-[560px] rounded-lg"
            onClose={() => setPane("menu")}
            messages={messages}
            input={input}
            setInput={setInput}
            sending={sending}
            sendMessage={sendMessage}
          />
        )}

        {open && pane === "share" && anySocial && (
          <div className="w-[240px] bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-header-top border-b border-border">
              <span className="text-xs uppercase tracking-[0.15em]">Share this page</span>
              <button onClick={() => setPane("menu")} className="p-1">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-2 grid grid-cols-4 gap-1">
              {s.share_instagram && (
                <a
                  href={s.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  title="Instagram"
                  className="flex flex-col items-center gap-1 p-2 rounded hover:bg-muted"
                >
                  <Instagram className="h-5 w-5" />
                  <span className="text-[9px]">Instagram</span>
                </a>
              )}
              {s.share_facebook && (
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Facebook"
                  className="flex flex-col items-center gap-1 p-2 rounded hover:bg-muted"
                >
                  <Facebook className="h-5 w-5" />
                  <span className="text-[9px]">Facebook</span>
                </a>
              )}
              {s.share_twitter && (
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(pageTitle)}`}
                  target="_blank"
                  rel="noreferrer"
                  title="X"
                  className="flex flex-col items-center gap-1 p-2 rounded hover:bg-muted"
                >
                  <Twitter className="h-5 w-5" />
                  <span className="text-[9px]">X</span>
                </a>
              )}
              {s.share_email && (
                <a
                  href={`mailto:?subject=${encodeURIComponent(pageTitle)}&body=${encodeURIComponent(pageUrl)}`}
                  title="Email"
                  className="flex flex-col items-center gap-1 p-2 rounded hover:bg-muted"
                >
                  <Mail className="h-5 w-5" />
                  <span className="text-[9px]">Email</span>
                </a>
              )}
            </div>
          </div>
        )}

        {open && pane === "menu" && (
          <div className="flex flex-col items-end gap-2">
            {s.ai_chat_enabled && (
              <button
                onClick={() => setPane("chat")}
                className="flex items-center gap-2 bg-background border border-border rounded-full pl-4 pr-3 h-11 shadow-lg hover:border-foreground"
              >
                <span className="text-xs">Chat with Rose</span>
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Gem className="h-4 w-4" />
                </div>
              </button>
            )}
            {s.whatsapp_enabled && s.whatsapp_number && (
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-background border border-border rounded-full pl-4 pr-3 h-11 shadow-lg hover:border-foreground"
              >
                <span className="text-xs">WhatsApp us</span>
                <div className="h-8 w-8 rounded-full bg-[#25D366] text-white flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M20.52 3.48A11.9 11.9 0 0012.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.83 11.83 0 005.64 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.17-1.23-6.14-3.37-8.44zM12.04 21.5h-.01a9.65 9.65 0 01-4.92-1.35l-.35-.21-3.8 1 1.02-3.7-.23-.38a9.66 9.66 0 01-1.48-5.02c0-5.34 4.35-9.68 9.7-9.68 2.59 0 5.02 1.01 6.85 2.84a9.62 9.62 0 012.84 6.85c0 5.34-4.35 9.68-9.62 9.65zm5.3-7.24c-.29-.15-1.72-.85-1.98-.94-.27-.1-.46-.15-.66.14-.19.29-.75.94-.92 1.13-.17.19-.34.22-.63.07-.29-.14-1.22-.45-2.32-1.43-.86-.77-1.44-1.72-1.6-2.01-.17-.29-.02-.44.13-.59.13-.13.29-.34.44-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.66-1.58-.9-2.17-.24-.57-.48-.49-.66-.5l-.56-.01a1.08 1.08 0 00-.78.36c-.27.29-1.03 1.01-1.03 2.46 0 1.45 1.05 2.86 1.2 3.06.14.19 2.07 3.16 5.02 4.44.7.3 1.25.48 1.68.62.7.22 1.34.19 1.85.12.56-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.26-.19-.55-.34z" />
                  </svg>
                </div>
              </a>
            )}
            {anySocial && (
              <button
                onClick={() => setPane("share")}
                className="flex items-center gap-2 bg-background border border-border rounded-full pl-4 pr-3 h-11 shadow-lg hover:border-foreground"
              >
                <span className="text-xs">Share</span>
                <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center">
                  <Share2 className="h-4 w-4" />
                </div>
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => {
            setOpen((o) => !o);
            setPane("menu");
          }}
          aria-label={open ? "Close chat menu" : "Open chat menu"}
          className={cn(
            "hidden lg:flex h-14 w-14 rounded-full shadow-xl items-center justify-center transition-transform",
            open
              ? "bg-foreground text-background rotate-90"
              : "bg-primary text-primary-foreground hover:scale-105",
          )}
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
}
