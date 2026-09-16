import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import CharacterCount from "@tiptap/extension-character-count";
import Youtube from "@tiptap/extension-youtube";
import FontFamily from "@tiptap/extension-font-family";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Quote,
  Heading1, Heading2, Heading3, List, ListOrdered, ListChecks,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Link2, Link2Off,
  Image as ImageIcon, Table as TableIcon, Youtube as YoutubeIcon,
  Undo2, Redo2, Eraser, Trash2, Minus, ChevronDown,
  Superscript as SuperscriptIcon, Subscript as SubscriptIcon, Palette, Highlighter, Maximize2, Minimize2,
  Rows3, Columns3, SquareSplitHorizontal, Merge,
} from "lucide-react";
import { ImageCropDialog } from "./ImageCropDialog";
import { adminUploadMedia } from "@/lib/media.functions";
import { toast } from "sonner";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

const SWATCHES = ["#111827", "#374151", "#6B7280", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#B45309", "#0F766E", "#1D4ED8"];
const HIGHLIGHTS = ["#FEF3C7", "#FCE7F3", "#DBEAFE", "#DCFCE7", "#EDE9FE", "#FFE4E6"];
const FONTS = [
  { label: "Default", value: "" },
  { label: "Sans", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "ui-serif, Georgia, serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, monospace" },
  { label: "Display", value: "var(--font-display)" },
];

function Btn({ active, onClick, title, children, disabled }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`grid h-8 min-w-8 place-items-center rounded-md border px-1.5 text-xs text-foreground transition ${active ? "bg-foreground text-background border-foreground" : "border-transparent hover:bg-muted"} disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function Divider() { return <span className="mx-1 h-6 w-px bg-border" />; }

function Popover({ label, icon, children, title }: { label?: string; icon?: React.ReactNode; children: React.ReactNode; title: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) { if (!ref.current?.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className="grid h-8 place-items-center rounded-md border border-transparent px-2 text-xs hover:bg-muted"
      >
        {icon}
        {label && <span className="ml-1 max-w-[90px] truncate">{label}</span>}
        <ChevronDown className="ml-1 h-3 w-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-1 min-w-[180px] rounded-md border border-border bg-popover p-2 shadow-lg" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

function Toolbar({ editor, onPickImage, fullscreen, onFullscreen }: { editor: Editor; onPickImage: () => void; fullscreen: boolean; onFullscreen: () => void }) {
  const canTable = editor.isActive("table");
  const currentBlock = editor.isActive("heading", { level: 1 }) ? "H1"
    : editor.isActive("heading", { level: 2 }) ? "H2"
    : editor.isActive("heading", { level: 3 }) ? "H3"
    : editor.isActive("heading", { level: 4 }) ? "H4"
    : "Paragraph";

  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank", rel: "noopener noreferrer" }).run();
  }

  function insertYoutube() {
    const url = window.prompt("YouTube URL");
    if (!url) return;
    editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run();
  }

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 border-b border-border bg-background/95 p-2 backdrop-blur">
      <Popover label={currentBlock} title="Text style">
        <div className="flex flex-col gap-0.5 text-sm">
          <button type="button" className="rounded px-2 py-1 text-left hover:bg-muted" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setParagraph().run()}>Paragraph</button>
          <button type="button" className="rounded px-2 py-1 text-left text-2xl font-semibold hover:bg-muted" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>Heading 1</button>
          <button type="button" className="rounded px-2 py-1 text-left text-xl font-semibold hover:bg-muted" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>Heading 2</button>
          <button type="button" className="rounded px-2 py-1 text-left text-lg font-semibold hover:bg-muted" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>Heading 3</button>
          <button type="button" className="rounded px-2 py-1 text-left font-semibold hover:bg-muted" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>Heading 4</button>
        </div>
      </Popover>

      <Popover label="Font" title="Font family">
        <div className="flex flex-col gap-0.5 text-sm">
          {FONTS.map((f) => (
            <button key={f.label} type="button" className="rounded px-2 py-1 text-left hover:bg-muted" style={f.value ? { fontFamily: f.value } : undefined}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => f.value ? editor.chain().focus().setFontFamily(f.value).run() : editor.chain().focus().unsetFontFamily().run()}>
              {f.label}
            </button>
          ))}
        </div>
      </Popover>

      <Divider />

      <Btn title="Bold (⌘B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Btn>
      <Btn title="Italic (⌘I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
      <Btn title="Underline (⌘U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Btn>
      <Btn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Btn>
      <Btn title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="h-4 w-4" /></Btn>
      <Btn title="Superscript" active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()}><SuperscriptIcon className="h-4 w-4" /></Btn>
      <Btn title="Subscript" active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()}><SubscriptIcon className="h-4 w-4" /></Btn>

      <Popover title="Text color" icon={<Palette className="h-4 w-4" />}>
        <div className="grid grid-cols-6 gap-1.5">
          {SWATCHES.map((c) => (
            <button key={c} type="button" className="h-6 w-6 rounded-sm border border-border" style={{ background: c }}
              onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setColor(c).run()} />
          ))}
        </div>
        <button type="button" className="mt-2 w-full rounded px-2 py-1 text-xs hover:bg-muted"
          onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().unsetColor().run()}>Clear color</button>
      </Popover>
      <Popover title="Highlight" icon={<Highlighter className="h-4 w-4" />}>
        <div className="grid grid-cols-6 gap-1.5">
          {HIGHLIGHTS.map((c) => (
            <button key={c} type="button" className="h-6 w-6 rounded-sm border border-border" style={{ background: c }}
              onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()} />
          ))}
        </div>
        <button type="button" className="mt-2 w-full rounded px-2 py-1 text-xs hover:bg-muted"
          onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().unsetHighlight().run()}>Clear highlight</button>
      </Popover>

      <Divider />

      <Btn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></Btn>
      <Btn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Btn>
      <Btn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Btn>
      <Btn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Btn>
      <Btn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></Btn>

      <Divider />

      <Btn title="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Btn>
      <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Btn>
      <Btn title="Task list" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks className="h-4 w-4" /></Btn>

      <Divider />

      <Btn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></Btn>
      <Btn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></Btn>
      <Btn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-4 w-4" /></Btn>
      <Btn title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify className="h-4 w-4" /></Btn>

      <Divider />

      <Btn title="Link" active={editor.isActive("link")} onClick={setLink}><Link2 className="h-4 w-4" /></Btn>
      <Btn title="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}><Link2Off className="h-4 w-4" /></Btn>
      <Btn title="Insert image" onClick={onPickImage}><ImageIcon className="h-4 w-4" /></Btn>
      <Btn title="Embed YouTube" onClick={insertYoutube}><YoutubeIcon className="h-4 w-4" /></Btn>

      <Divider />

      <Popover title="Table" icon={<TableIcon className="h-4 w-4" />}>
        <div className="flex flex-col gap-0.5 text-sm">
          <button type="button" className="rounded px-2 py-1 text-left hover:bg-muted" onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Insert 3×3 table</button>
          <button type="button" className="rounded px-2 py-1 text-left hover:bg-muted" onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()}>Insert 2×2 table</button>
          <div className="my-1 h-px bg-border" />
          <button type="button" disabled={!canTable} className="rounded px-2 py-1 text-left disabled:opacity-40 hover:bg-muted" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addRowAfter().run()}><Rows3 className="mr-1 inline h-3.5 w-3.5" /> Add row</button>
          <button type="button" disabled={!canTable} className="rounded px-2 py-1 text-left disabled:opacity-40 hover:bg-muted" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addColumnAfter().run()}><Columns3 className="mr-1 inline h-3.5 w-3.5" /> Add column</button>
          <button type="button" disabled={!canTable} className="rounded px-2 py-1 text-left disabled:opacity-40 hover:bg-muted" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteRow().run()}>Delete row</button>
          <button type="button" disabled={!canTable} className="rounded px-2 py-1 text-left disabled:opacity-40 hover:bg-muted" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteColumn().run()}>Delete column</button>
          <button type="button" disabled={!canTable} className="rounded px-2 py-1 text-left disabled:opacity-40 hover:bg-muted" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeaderRow().run()}>Toggle header row</button>
          <button type="button" disabled={!canTable} className="rounded px-2 py-1 text-left disabled:opacity-40 hover:bg-muted" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().mergeCells().run()}><Merge className="mr-1 inline h-3.5 w-3.5" /> Merge cells</button>
          <button type="button" disabled={!canTable} className="rounded px-2 py-1 text-left disabled:opacity-40 hover:bg-muted" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().splitCell().run()}><SquareSplitHorizontal className="mr-1 inline h-3.5 w-3.5" /> Split cell</button>
          <button type="button" disabled={!canTable} className="rounded px-2 py-1 text-left text-destructive disabled:opacity-40 hover:bg-muted" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteTable().run()}><Trash2 className="mr-1 inline h-3.5 w-3.5" /> Delete table</button>
        </div>
      </Popover>

      <Divider />

      <Btn title="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}><Eraser className="h-4 w-4" /></Btn>
      <Btn title="Undo (⌘Z)" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></Btn>
      <Btn title="Redo (⇧⌘Z)" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></Btn>

      <div className="ml-auto">
        <Btn title={fullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={onFullscreen}>
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Btn>
      </div>
    </div>
  );
}

export function RichEditor({ value, onChange, placeholder = "Start writing…", minHeight = 320 }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropMime, setCropMime] = useState("image/jpeg");
  const [cropName, setCropName] = useState("image.jpg");
  const [uploading, setUploading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const upload = useServerFn(adminUploadMedia);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" } }),
      Image.configure({ inline: false, allowBase64: false, HTMLAttributes: { class: "rich-img" } }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit.configure({ table: { resizable: true, HTMLAttributes: { class: "rich-table" } } }),
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Subscript,
      Superscript,
      CharacterCount.configure({}),
      Youtube.configure({ controls: true, nocookie: true, HTMLAttributes: { class: "rich-embed" } }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class: `rich-content focus:outline-none px-4 py-4`,
        style: `min-height: ${minHeight}px;`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [fullscreen]);

  if (!editor) return null;

  function pickImage() { fileRef.current?.click(); }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCropName(file.name || "image.jpg");
    setCropMime(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => setCropSrc(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function onCropConfirmed(file: File) {
    setCropSrc(null);
    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.5, maxWidthOrHeight: 2000, useWebWorker: true, initialQuality: 0.9,
      });
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsDataURL(compressed);
      });
      const ext = (compressed.type.split("/")[1] || "jpg").split("+")[0];
      const result = await upload({
        data: { filename: `image.${ext}`, contentType: compressed.type, dataBase64: dataUrl },
      });
      editor?.chain().focus().setImage({ src: result.url }).run();
      toast.success("Image inserted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const chars = editor.storage.characterCount?.characters?.() ?? 0;
  const words = editor.storage.characterCount?.words?.() ?? 0;

  const containerCls = fullscreen
    ? "fixed inset-0 z-[100] flex flex-col rounded-none border-0 bg-background"
    : "rounded-md border border-border bg-background";

  return (
    <div className={containerCls}>
      <Toolbar editor={editor} onPickImage={pickImage} fullscreen={fullscreen} onFullscreen={() => setFullscreen((v) => !v)} />
      <div className={fullscreen ? "flex-1 overflow-auto" : ""}>
        {/* BubbleMenu removed in tiptap v3 core — using toolbar only */}

        <EditorContent editor={editor} />
      </div>
      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
        <span>{uploading ? "Uploading image…" : "Tip: select text to see quick formatting"}</span>
        <span>{words} words · {chars} chars</span>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChosen} />
      <ImageCropDialog open={!!cropSrc} imageUrl={cropSrc || ""} contentType={cropMime} fileName={cropName} onClose={() => setCropSrc(null)} onConfirm={onCropConfirmed} />
    </div>
  );
}
