import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const garmentTypes = ["THOBE", "SHIRT", "TROUSER", "SUIT", "OTHER"] as const;

const measurementSchema = z.object({
  customerId: z.string().trim().min(1).max(100),
  garment: z.string().trim().min(2).max(80),
  profileName: z.string().trim().min(1).max(60).default("Standard"),
  values: z.record(z.string(), z.coerce.number().min(0).max(300)),
  notes: z.string().trim().max(1000).optional().nullable(),
});

router.post("/", asyncHandler(async (req, res) => {
  const input = measurementSchema.parse(req.body);
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");

  const garment = await prisma.garment.findFirst({ where: { name: input.garment, active: true } });
  if (!garment) throw new AppError("Garment not found or inactive", 400, "GARMENT_NOT_FOUND");

  const garmentEnum = (garmentTypes as readonly string[]).includes(garment.name)
    ? garment.name as typeof garmentTypes[number]
    : "OTHER";

  const measurement = await prisma.measurement.upsert({
    where: {
      customerId_garment_profileName: {
        customerId: input.customerId,
        garment: garmentEnum,
        profileName: input.profileName,
      },
    },
    update: { values: input.values, notes: input.notes ?? null, garmentId: garment.id },
    create: { customerId: input.customerId, garment: garmentEnum, garmentId: garment.id, profileName: input.profileName, values: input.values, notes: input.notes ?? null },
  });

  res.status(201).json({ data: measurement });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const input = measurementSchema.omit({ customerId: true }).partial().parse(req.body);
  let data: any = input;
  if (input.garment) {
    const garment = await prisma.garment.findFirst({ where: { name: input.garment, active: true } });
    if (!garment) throw new AppError("Garment not found or inactive", 400, "GARMENT_NOT_FOUND");
    const garmentEnum = (garmentTypes as readonly string[]).includes(garment.name)
      ? garment.name as typeof garmentTypes[number]
      : "OTHER";
    data = { ...input, garment: garmentEnum, garmentId: garment.id };
  }
  const measurement = await prisma.measurement.update({
    where: { id: req.params.id },
    data,
  }).catch(() => null);
  if (!measurement) throw new AppError("Measurement not found", 404, "MEASUREMENT_NOT_FOUND");
  res.json({ data: measurement });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const measurement = await prisma.measurement.delete({ where: { id: req.params.id } }).catch(() => null);
  if (!measurement) throw new AppError("Measurement not found", 404, "MEASUREMENT_NOT_FOUND");
  res.status(204).send();
}));

export { router as measurementsRouter };
