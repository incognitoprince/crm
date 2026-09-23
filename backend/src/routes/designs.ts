import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const garmentTypes = ["THOBE", "SHIRT", "TROUSER", "SUIT", "OTHER"] as const;
const upload = multer({
  dest: path.resolve(process.cwd(), "uploads"),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)),
});

const designSchema = z.object({
  designNo: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(120),
  garment: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).nullable().optional(),
  active: z.boolean().optional(),
});

router.get("/", asyncHandler(async (req, res) => {
  const garment = typeof req.query.garment === "string" ? req.query.garment : undefined;
  let where: any = { active: true };
  if (garment) {
    const garmentRecord = await prisma.garment.findFirst({ where: { name: garment, active: true } });
    if (!garmentRecord) return res.json({ data: [] });
    const standard = (garmentTypes as readonly string[]).includes(garment);
    where = {
      active: true,
      OR: [
        { garmentId: garmentRecord.id },
        ...(standard ? [{ garment: garment as typeof garmentTypes[number] }] : []),
      ],
    };
  }
  const designs = await prisma.design.findMany({ where, include: { garmentMaster: true }, orderBy: { createdAt: "desc" } });
  res.json({ data: designs });
}));

router.post("/", asyncHandler(async (req, res) => {
  const input = designSchema.parse(req.body);
  const garment = await prisma.garment.findFirst({ where: { name: input.garment, active: true } });
  if (!garment) throw new AppError("Garment not found or inactive", 400, "GARMENT_NOT_FOUND");

  const design = await prisma.design.create({
    data: {
      designNo: input.designNo,
      name: input.name,
      garment: (garmentTypes as readonly string[]).includes(garment.name) ? garment.name as typeof garmentTypes[number] : "OTHER",
      garmentId: garment.id,
      description: input.description ?? null,
      active: input.active ?? true,
    },
  }).catch(error => {
    if (error?.code === "P2002") throw new AppError("Design number already exists", 409, "DESIGN_EXISTS");
    throw error;
  });
  res.status(201).json({ data: design });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const input = designSchema.partial().parse(req.body);
  if (input.garment) {
    const garment = await prisma.garment.findFirst({ where: { name: input.garment, active: true } });
    if (!garment) throw new AppError("Garment not found or inactive", 400, "GARMENT_NOT_FOUND");
  }

  const design = await prisma.design.update({
    where: { id: req.params.id },
    data: input.garment ? { ...input, garment: (garmentTypes as readonly string[]).includes(input.garment) ? input.garment as typeof garmentTypes[number] : "OTHER", garmentId: (await prisma.garment.findFirst({ where: { name: input.garment, active: true } }))?.id } : input,
  }).catch(error => {
    if (error?.code === "P2002") throw new AppError("Design number already exists", 409, "DESIGN_EXISTS");
    return null;
  });
  if (!design) throw new AppError("Design not found", 404, "DESIGN_NOT_FOUND");
  res.json({ data: design });
}));

router.post("/:id/image", upload.single("image"), asyncHandler(async (req, res) => {
  const design = await prisma.design.findUnique({ where: { id: req.params.id } });
  if (!design) throw new AppError("Design not found", 404, "DESIGN_NOT_FOUND");
  if (!req.file) throw new AppError("A JPG, PNG, or WEBP image is required", 400, "IMAGE_REQUIRED");

  const ext = path.extname(req.file.originalname).toLowerCase() || ".img";
  const finalName = "design-" + crypto.randomUUID() + ext;
  const finalPath = path.resolve(process.cwd(), "uploads", finalName);
  await fs.rename(req.file.path, finalPath);

  const updated = await prisma.design.update({
    where: { id: design.id },
    data: { imagePath: "/uploads/" + finalName },
  });
  res.status(201).json({ data: updated });
}));

export { router as designsRouter };
