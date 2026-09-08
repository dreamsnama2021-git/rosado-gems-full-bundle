import { useEffect, useState } from "react";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminGetBlog, adminUpsertBlog } from "@/lib/admin.functions";
import { adminListBlogCategories } from "@/lib/categories.functions";
import { aiGenerate } from "@/lib/ai-content.functions";
import { toast } from "sonner";
import { RichEditor } from "@/components/admin/RichEditor";
import { SingleImageUpload } from "@/components/admin/ImageUpload";
import { AIFieldSwitch } from "@/components/admin/AIFieldSwitch";
import {
  AdminFormDialog,
  AdminFormCol,
  adminField,
} from "@/components/admin/AdminFormDialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Post = any;

export function BlogFormDialog({
  id,
  open,
  onOpenChange,
}: {
  id: string | null; // "new" or existing id
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const isNew = id === "new" || id === null;
  const qc = useQueryClient();
  const upsert = useServerFn(adminUpsertBlog);
  const gen = useServerFn(aiGenerate);

  const postQ = useQuery(
    queryOptions({
      queryKey: ["admin", "blog", id],
      queryFn: () => adminGetBlog({ data: { id: id! } }),
      enabled: open && !isNew && !!id,
    }),
  );

  const catsQ = useQuery(queryOptions({
    queryKey: ["admin", "blog-categories"],
    queryFn: () => adminListBlogCategories(),
    enabled: open,
  }));

  const [b, setB] = useState<Post>(emptyPost());
  const [saving, setSaving] = useState(false);

  // Reset when opening for a new item / different id.
  useEffect(() => {
    if (!open) return;
    if (isNew) setB(emptyPost());
    else if (postQ.data) setB(postQ.data);
  }, [open, isNew, postQ.data]);

  function upd<K extends keyof Post>(k: K, v: Post[K]) {
    setB((s: Post) => ({ ...s, [k]: v }));
  }

  async function save() {
    if (!b.title) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      await upsert({ data: { ...b, id: isNew ? undefined : b.id } });
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  const { label, input, textarea } = adminField;

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isNew ? "New blog post" : `Edit: ${b.title || "Untitled"}`}
      subtitle="Write, illustrate, and optimize your story."
      onSave={save}
      saving={saving}
    >
      {/* Column 1 — Main content */}
      <AdminFormCol span={8} title="Content">
        <div>
          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
            <label className={label}>Title</label>
            <AIFieldSwitch
              label="Title"
              onGenerate={async () => {
                const seed = b.title || b.excerpt || "story about fine jewelry from Rosado Gems";
                const r = await gen({ data: { kind: "blog-title", context: seed } });
                upd("title", r.text ?? "");
              }}
            />
          </div>
          <input className={input} value={b.title} onChange={(e) => upd("title", e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
            <label className={label}>Excerpt</label>
            <AIFieldSwitch
              label="Excerpt"
              onGenerate={async () => {
                if (!b.title) throw new Error("Enter a title first");
                const r = await gen({
                  data: {
                    kind: "blog-excerpt",
                    context: `${b.title}. ${(b.body ?? "").replace(/<[^>]+>/g, "").slice(0, 300)}`,
                  },
                });
                upd("excerpt", r.text ?? "");
              }}
            />
          </div>
          <textarea
            rows={3}
            className={textarea}
            value={b.excerpt ?? ""}
            onChange={(e) => upd("excerpt", e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
            <label className={label}>Body</label>
            <AIFieldSwitch
              label="Body"
              onGenerate={async () => {
                if (!b.title) throw new Error("Enter a title first");
                const r = await gen({ data: { kind: "blog-body", context: b.title } });
                const html = r.text
                  .trim()
                  .split(/\n{2,}/)
                  .map((p) => `<p>${p.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")}</p>`)
                  .join("");
                upd("body", html);
              }}
            />
          </div>
          <RichEditor
            value={b.body ?? ""}
            onChange={(html) => upd("body", html)}
            placeholder="Write your story…"
            minHeight={320}
          />
        </div>
      </AdminFormCol>

      {/* Column 2 — Sidebar: Media, details, SEO */}
      <AdminFormCol span={4} title="Media & details">
        <div>
          <label className={label}>Featured image</label>
          <SingleImageUpload
            value={b.cover_image ?? ""}
            onChange={(url) => upd("cover_image", url)}
          />
        </div>
        <div>
          <label className={label}>Slug</label>
          <input className={input} value={b.slug} onChange={(e) => upd("slug", e.target.value)} />
        </div>
        <div>
          <label className={label}>Author</label>
          <input
            className={input}
            value={b.author}
            onChange={(e) => upd("author", e.target.value)}
          />
        </div>
        <div>
          <label className={label}>Category</label>
          <select
            className={input}
            value={b.category_id ?? ""}
            onChange={(e) => upd("category_id", e.target.value || null)}
          >
            <option value="">— Uncategorised —</option>
            {(catsQ.data ?? []).map((c: { id: string; name: string }) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>


        <div className="pt-4 mt-2 border-t border-border">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h3 className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">SEO</h3>
            <AIFieldSwitch
              label="SEO"
              onGenerate={async () => {
                if (!b.title) throw new Error("Enter a title first");
                const r = await gen({
                  data: {
                    kind: "blog-seo",
                    context: `${b.title}. ${(b.body ?? "").slice(0, 500)}`,
                  },
                });
                if (r.json) {
                  upd("meta_title", r.json.meta_title ?? "");
                  upd("meta_description", r.json.meta_description ?? "");
                  if (r.json.excerpt) upd("excerpt", r.json.excerpt);
                }
              }}
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className={label}>Meta title</label>
              <input
                className={input}
                value={b.meta_title ?? ""}
                onChange={(e) => upd("meta_title", e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Meta description</label>
              <textarea
                rows={4}
                className={textarea}
                value={b.meta_description ?? ""}
                onChange={(e) => upd("meta_description", e.target.value)}
              />
            </div>
          </div>
        </div>
      </AdminFormCol>
    </AdminFormDialog>
  );
}

function emptyPost(): Post {
  return {
    slug: "",
    title: "",
    excerpt: "",
    cover_image: "",
    body: "",
    author: "Rosado Gems",
    category_id: null,
    meta_title: "",
    meta_description: "",
  };
}
