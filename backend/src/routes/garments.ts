import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const garmentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  active: z.boolean().optional(),
});

router.get("/", asyncHandler(async (_req, res) => {
  const garments = await prisma.garment.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  res.json({ data: garments });
}));

router.post("/", asyncHandler(async (req, res) => {
  const input = garmentSchema.parse(req.body);
  const name = input.name.replace(/\s+/g, " ");
  const garment = await prisma.garment.create({
    data: { name, active: input.active ?? true },
  }).catch(error => {
    if (error?.code === "P2002") throw new AppError("Garment already exists", 409, "GARMENT_EXISTS");
    throw error;
  });
  res.status(201).json({ data: garment });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const input = garmentSchema.partial().parse(req.body);
  const garment = await prisma.garment.update({
    where: { id: req.params.id },
    data: input,
  }).catch(error => {
    if (error?.code === "P2002") throw new AppError("Garment already exists", 409, "GARMENT_EXISTS");
    return null;
  });
  if (!garment) throw new AppError("Garment not found", 404, "GARMENT_NOT_FOUND");
  res.json({ data: garment });
}));

export { router as garmentsRouter };
