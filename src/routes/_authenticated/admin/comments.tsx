import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListComments, adminSetCommentApproval, adminDeleteComment } from "@/lib/blog-comments.functions";
import { toast } from "sonner";
import { Check, X, Trash2 } from "lucide-react";

const q = queryOptions({ queryKey: ["admin", "blog-comments"], queryFn: () => adminListComments() });

export const Route = createFileRoute("/_authenticated/admin/comments")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  errorComponent: ({ error }) => <p className="text-sm text-red-600">{error.message}</p>,
  notFoundComponent: () => <p>Not found</p>,
  component: CommentsAdmin,
});

function CommentsAdmin() {
  const data = useSuspenseQuery(q).data;
  const qc = useQueryClient();
  const approve = useServerFn(adminSetCommentApproval);
  const del = useServerFn(adminDeleteComment);

  async function setApproval(id: string, approved: boolean) {
    try { await approve({ data: { id, approved } }); toast.success(approved ? "Approved" : "Unapproved"); qc.invalidateQueries({ queryKey: ["admin", "blog-comments"] }); qc.invalidateQueries({ queryKey: ["blog-comments"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  async function remove(id: string) {
    if (!confirm("Delete this comment?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "blog-comments"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  const pending = data.filter((c) => !c.approved);
  const published = data.filter((c) => c.approved);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl mb-6">Blog Comments</h1>

      <Section title={`Pending (${pending.length})`} items={pending} onApprove={(id) => setApproval(id, true)} onDelete={remove} approveIcon={<Check className="h-4 w-4" />} />
      <div className="h-8" />
      <Section title={`Published (${published.length})`} items={published} onApprove={(id) => setApproval(id, false)} onDelete={remove} approveLabel="Unapprove" approveIcon={<X className="h-4 w-4" />} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Section({ title, items, onApprove, onDelete, approveLabel = "Approve", approveIcon }: { title: string; items: any[]; onApprove: (id: string) => void; onDelete: (id: string) => void; approveLabel?: string; approveIcon: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl mb-3">{title}</h2>
      {items.length === 0 && <p className="text-sm text-muted-foreground">Nothing here.</p>}
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.id} className="border border-border rounded-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-sm">{c.author_name} {c.author_email && <span className="text-muted-foreground font-normal">· {c.author_email}</span>}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
                  {c.blog_posts?.title ?? "—"} · {new Date(c.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onApprove(c.id)} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] border border-border rounded-sm px-3 h-8 hover:bg-foreground hover:text-background">{approveIcon} {approveLabel}</button>
                <button onClick={() => onDelete(c.id)} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] border border-border rounded-sm px-3 h-8 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600"><Trash2 className="h-4 w-4" /> Delete</button>
              </div>
            </div>
            <p className="text-sm text-foreground/85 whitespace-pre-line">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
