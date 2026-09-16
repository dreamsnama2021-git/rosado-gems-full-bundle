import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { adminListBlogCategories, adminDeleteBlogCategory } from "@/lib/categories.functions";
import { CategoryFormDialog } from "@/components/admin/CategoryFormDialog";

const q = queryOptions({ queryKey: ["admin", "blog-categories"], queryFn: () => adminListBlogCategories() });

export const Route = createFileRoute("/_authenticated/admin/blog-categories")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  errorComponent: ({ error }) => <p className="text-sm text-red-600">{error.message}</p>,
  notFoundComponent: () => <p>Not found</p>,
  component: List,
});

function List() {
  const data = useSuspenseQuery(q).data;
  const qc = useQueryClient();
  const del = useServerFn(adminDeleteBlogCategory);
  const [editId, setEditId] = useState<string | null>(null);

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "blog-categories"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl">Blog categories</h1>
        <button onClick={() => setEditId("new")} className="h-10 px-4 rounded-sm bg-foreground text-background text-xs uppercase tracking-[0.2em]">+ New category</button>
      </div>
      <div className="grid gap-3">
        {data.map((c) => (
          <div key={c.id} className="flex items-center gap-4 border border-border p-3 rounded-sm">
            {c.hero_image && <img src={c.hero_image} alt="" className="h-16 w-24 object-cover rounded-sm" />}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{c.name}</p>
              <p className="text-xs text-muted-foreground truncate">/{c.slug} · sort {c.sort_order ?? 0}</p>
            </div>
            <button onClick={() => setEditId(c.id)} className="text-xs uppercase tracking-[0.2em] hover:text-primary">Edit</button>
            <button onClick={() => remove(c.id)} className="text-xs uppercase tracking-[0.2em] text-red-600 hover:text-red-800">Delete</button>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">No categories yet. Create one to organize your blog posts.</p>}
      </div>
      <CategoryFormDialog kind="blog" id={editId} open={editId !== null} onOpenChange={(v) => { if (!v) setEditId(null); }} />
    </div>
  );
}
