import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminUser } from "@/lib/admin-role";
import { ALLOWED_IMAGE_EXTENSIONS, ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/media-constants";

const BUCKET = "admin-media";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 20; // ~20 years

export const adminUploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { filename: string; contentType: string; dataBase64: string }) =>
    z.object({
      filename: z
        .string()
        .min(1, "Filename is required")
        .max(200, "Filename is too long")
        .refine(
          (n) => ALLOWED_IMAGE_EXTENSIONS.includes((n.split(".").pop() ?? "").toLowerCase()),
          `Unsupported file extension. Allowed: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}`,
        ),
      contentType: z
        .string()
        .min(1)
        .max(120)
        .refine(
          (t) => (ALLOWED_IMAGE_TYPES as readonly string[]).includes(t.split(";")[0].trim().toLowerCase()),
          `Unsupported file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
        ),
      dataBase64: z
        .string()
        .min(1, "File is empty")
        // base64 expands bytes by ~4/3; guard early before decoding
        .refine((s) => s.length * 0.75 <= MAX_UPLOAD_BYTES + 1024, "Image is larger than 8 MB"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdminUser(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // strip data: prefix if present
    const commaIdx = data.dataBase64.indexOf(",");
    const b64 = commaIdx >= 0 ? data.dataBase64.slice(commaIdx + 1) : data.dataBase64;
    const buffer = Buffer.from(b64, "base64");
    if (buffer.byteLength === 0) throw new Error("The file appears to be empty.");
    if (buffer.byteLength > MAX_UPLOAD_BYTES) throw new Error("Image is larger than 8 MB.");

    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const key = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safe}`;

    const { error: upErr } = await supabaseAdmin.storage.from(BUCKET).upload(key, buffer, {
      contentType: data.contentType,
      upsert: false,
    });
    if (upErr) throw upErr;

    const { data: signed, error: sErr } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(key, SIGNED_URL_TTL);
    if (sErr) throw sErr;

    return { url: signed.signedUrl, path: key };
  });
