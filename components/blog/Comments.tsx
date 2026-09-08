import { useState } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listApprovedComments, submitComment } from "@/lib/blog-comments.functions";

export function Comments({ postId, moderated }: { postId: string; moderated: boolean }) {
  const qc = useQueryClient();
  const q = queryOptions({
    queryKey: ["blog-comments", postId],
    queryFn: () => listApprovedComments({ data: { postId } }),
  });
  const { data: comments = [] } = useQuery(q);
  const submit = useServerFn(submitComment);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || body.trim().length < 2) {
      toast.error("Please enter your name and a comment");
      return;
    }
    setSending(true);
    try {
      const r = await submit({ data: { postId, authorName: name.trim(), authorEmail: email.trim(), body: body.trim() } });
      setName(""); setEmail(""); setBody("");
      if (r.approved) {
        toast.success("Comment posted");
        qc.invalidateQueries({ queryKey: ["blog-comments", postId] });
      } else {
        toast.success("Thanks — your comment is awaiting review");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setSending(false);
    }
  }

  const inp = "w-full h-11 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:border-foreground";

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="font-display text-3xl mb-2">Comments</h2>
      <p className="text-sm text-muted-foreground mb-8">
        {comments.length === 0 ? "Be the first to share your thoughts." : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
      </p>

      <ul className="space-y-6 mb-12">
        {comments.map((c) => (
          <li key={c.id} className="border border-border rounded-sm p-5 bg-background/60">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-sm">{c.author_name}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{c.body}</p>
          </li>
        ))}
      </ul>

      <form onSubmit={onSubmit} className="space-y-4 max-w-2xl">
        <h3 className="font-display text-xl">Leave a comment</h3>
        {moderated && <p className="text-xs text-muted-foreground">Comments are reviewed before appearing.</p>}
        <div className="grid sm:grid-cols-2 gap-4">
          <input className={inp} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
          <input className={inp} type="email" placeholder="Email (optional, not shown)" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} />
        </div>
        <textarea
          className="w-full rounded-sm border border-border bg-background p-3 text-sm outline-none focus:border-foreground min-h-[120px]"
          placeholder="Share your thoughts…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          required
        />
        <button
          type="submit"
          disabled={sending}
          className="h-11 px-8 rounded-sm bg-foreground text-background text-xs uppercase tracking-[0.2em] disabled:opacity-50"
        >
          {sending ? "Posting…" : "Post comment"}
        </button>
      </form>
    </section>
  );
}
