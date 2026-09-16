import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getMyOrderMessages, replyToOrderMessage } from "@/lib/account.functions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function OrderConversation({ orderId }: { orderId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(getMyOrderMessages);
  const reply = useServerFn(replyToOrderMessage);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const q = useQuery({
    queryKey: ["me", "order-messages", orderId],
    queryFn: () => list({ data: { order_id: orderId } }),
  });
  const messages = q.data ?? [];

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    try {
      await reply({ data: { order_id: orderId, body } });
      setBody("");
      toast.success("Message sent");
      qc.invalidateQueries({ queryKey: ["me", "order-messages", orderId] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not send"); }
    finally { setSending(false); }
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <p className="eyebrow">Updates from Rosado Gems</p>
      {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!q.isLoading && messages.length === 0 && (
        <p className="text-sm text-muted-foreground">No updates yet. We will write here as your order progresses.</p>
      )}
      {messages.map((m) => (
        <div key={m.id} className={`rounded-sm border border-border p-3 text-sm ${m.direction === "inbound" ? "bg-muted/40" : ""}`}>
          <p className="mb-1 text-xs text-muted-foreground">
            {m.direction === "inbound" ? "You" : m.author_name} · {new Date(m.created_at).toLocaleString()}
          </p>
          {m.subject && <p className="mb-1 font-medium">{m.subject}</p>}
          <p className="whitespace-pre-wrap">{m.body}</p>
        </div>
      ))}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Reply to our team about this order…" />
        <Button onClick={send} disabled={sending} className="sm:self-end">{sending ? "Sending…" : "Send"}</Button>
      </div>
    </div>
  );
}
