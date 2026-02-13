import sharp from "sharp";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_WIDTH = 1200;
const THUMB_WIDTH = 400;
const QUALITY = 80;

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function processImage(
  buffer: Buffer,
  filename: string
): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  ensureUploadDir();

  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);
  const timestamp = Date.now();
  const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");

  const imageName = `${safeName}_${timestamp}.webp`;
  const thumbName = `${safeName}_${timestamp}_thumb.webp`;

  // Full-size optimized image
  await sharp(buffer)
    .resize(MAX_WIDTH, undefined, { withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(path.join(UPLOAD_DIR, imageName));

  // Thumbnail
  await sharp(buffer)
    .resize(THUMB_WIDTH, undefined, { withoutEnlargement: true })
    .webp({ quality: QUALITY - 10 })
    .toFile(path.join(UPLOAD_DIR, thumbName));

  return {
    imageUrl: `/api/uploads/${imageName}`,
    thumbnailUrl: `/api/uploads/${thumbName}`,
  };
}

export async function deleteImage(imageUrl: string) {
  const filePath = path.join(process.cwd(), "public", imageUrl);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
