/** Shared upload rules used by both the browser UI and the server function. */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "avif", "svg"];

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

export const ACCEPT_ATTR = ALLOWED_IMAGE_TYPES.join(",");

export const ALLOWED_LABEL = "JPG, PNG, WEBP, GIF, AVIF or SVG";

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns an error message when the file is not an allowed image, otherwise null. */
export function validateImageFile(file: File): string | null {
  const type = (file.type || "").split(";")[0].trim().toLowerCase();
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!type && !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return `${file.name}: unsupported file. Allowed types: ${ALLOWED_LABEL}.`;
  }
  if (type && !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)) {
    return `${file.name}: "${type}" files aren't supported. Allowed types: ${ALLOWED_LABEL}.`;
  }
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return `${file.name}: unsupported file extension ".${ext}". Allowed: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}.`;
  }
  if (file.size === 0) return `${file.name}: the file is empty.`;
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${file.name}: ${formatBytes(file.size)} exceeds the 8 MB limit.`;
  }
  return null;
}
