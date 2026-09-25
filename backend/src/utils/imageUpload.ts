import crypto from "node:crypto";
import path from "node:path";
import { promises as fs } from "node:fs";
import multer from "multer";
import { AppError } from "../middleware/errorHandler.js";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

const signatures = [
  { mime: "image/jpeg", ext: ".jpg", matches: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  { mime: "image/png", ext: ".png", matches: (buffer: Buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])) },
  { mime: "image/webp", ext: ".webp", matches: (buffer: Buffer) => buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP" },
] as const;

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
    fields: 12,
    fieldSize: 64 * 1024,
    fieldNameSize: 100,
    parts: 14,
    headerPairs: 200,
  },
  fileFilter: (_req, file, cb) => cb(null, signatures.some(item => item.mime === file.mimetype)),
});

export async function saveValidatedImage(file: Express.Multer.File, prefix: string) {
  const detected = signatures.find(item => item.matches(file.buffer));
  if (!detected || detected.mime !== file.mimetype) {
    throw new AppError("Invalid image content. Only JPG, PNG, or WEBP images are allowed.", 400, "INVALID_IMAGE");
  }

  const safeName = prefix.replace(/[^a-z0-9-]/gi, "-").slice(0, 40);
  const finalName = safeName + "-" + crypto.randomUUID() + detected.ext;
  const finalPath = path.resolve(process.cwd(), "uploads", finalName);

  await fs.writeFile(finalPath, file.buffer, { flag: "wx", mode: 0o600 });
  return { path: "/uploads/" + finalName, mimeType: detected.mime, fileName: file.originalname.slice(0, 255) };
}

export async function deleteStoredImage(imagePath?: string | null) {
  if (!imagePath?.startsWith("/uploads/")) return;
  const relative = imagePath.replace(/^\/uploads\//, "uploads/");
  const absolute = path.resolve(process.cwd(), relative);
  const uploadsRoot = path.resolve(process.cwd(), "uploads") + path.sep;
  if (!absolute.startsWith(uploadsRoot)) return;
  await fs.unlink(absolute).catch(() => undefined);
}
