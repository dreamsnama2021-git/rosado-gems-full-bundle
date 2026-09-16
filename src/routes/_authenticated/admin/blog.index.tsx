import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminListBlog, adminDeleteBlog } from "@/lib/admin.functions";
import { toast } from "sonner";
import { BlogFormDialog } from "@/components/admin/BlogFormDialog";

const q = queryOptions({ queryKey: ["admin", "blog"], queryFn: () => adminListBlog() });

export const Route = createFileRoute("/_authenticated/admin/blog/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  errorComponent: ({ error }) => <p className="text-sm text-red-600">{error.message}</p>,
  notFoundComponent: () => <p>Not found</p>,
  component: List,
});

function List() {
  const data = useSuspenseQuery(q).data;
  const qc = useQueryClient();
  const del = useServerFn(adminDeleteBlog);
  const [editId, setEditId] = useState<string | null>(null);

  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "blog"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl">Blog posts</h1>
        <button onClick={() => setEditId("new")} className="h-10 px-4 rounded-sm bg-foreground text-background text-xs uppercase tracking-[0.2em]">+ New post</button>
      </div>
      <div className="grid gap-3">
        {data.map((b) => (
          <div key={b.id} className="flex items-center gap-4 border border-border p-3 rounded-sm">
            {b.cover_image && <img src={b.cover_image} alt="" className="h-16 w-24 object-cover rounded-sm" />}
            <div className="flex-1">
              <p className="font-medium">{b.title}</p>
              <p className="text-xs text-muted-foreground">{b.slug} · {new Date(b.published_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => setEditId(b.id)} className="text-xs uppercase tracking-[0.2em] hover:text-primary">Edit</button>
            <button onClick={() => remove(b.id)} className="text-xs uppercase tracking-[0.2em] text-red-600 hover:text-red-800">Delete</button>
          </div>
        ))}
      </div>

      <BlogFormDialog
        id={editId}
        open={editId !== null}
        onOpenChange={(v) => { if (!v) setEditId(null); }}
      />
    </div>
  );
}

