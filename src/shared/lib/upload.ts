const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const ALLOWED_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

type ValidationResult =
  | { valid: true; file: File }
  | { valid: false; error: string };

export function validateImage(file: File): ValidationResult {
  if (!ALLOWED_MIME.has(file.type)) {
    return {
      valid: false,
      error: `Formato não suportado (${file.type || "desconhecido"}). Use PNG, JPEG, WebP ou GIF.`,
    };
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXT.has(ext)) {
    return {
      valid: false,
      error: `Extensão .${ext} não permitida. Use .png, .jpg, .webp ou .gif.`,
    };
  }

  if (file.size > MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `Arquivo muito grande (${mb} MB). Máximo permitido: 5 MB.`,
    };
  }

  return { valid: true, file };
}
