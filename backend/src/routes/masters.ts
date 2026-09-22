import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const id = z.string().trim().min(1).max(100);
const masterSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).nullable().optional(),
  shopId: id,
  active: z.boolean().optional(),
});
router.get("/", asyncHandler(async (req,res) => {
  const shopId = typeof req.query.shopId === "string" ? req.query.shopId : undefined;
  const masters = await prisma.master.findMany({ where: { ...(shopId ? {shopId} : {}), active: true }, include: {shop:true,_count:{select:{assignments:true}}}, orderBy:[{shopId:"asc"},{name:"asc"}] });
  res.json({data:masters});
}));
router.post("/", asyncHandler(async(req,res)=>{
  const input=masterSchema.parse(req.body); const shop=await prisma.shop.findUnique({where:{id:input.shopId}});
  if(!shop) throw new AppError("Shop not found",404,"SHOP_NOT_FOUND");
  const master=await prisma.master.create({data:{name:input.name,phone:input.phone??null,shopId:input.shopId,active:input.active??true},include:{shop:true}});
  res.status(201).json({data:master});
}));
router.patch("/:id", asyncHandler(async(req,res)=>{
  const input=masterSchema.partial().parse(req.body);
  if(input.shopId && !await prisma.shop.findUnique({where:{id:input.shopId}})) throw new AppError("Shop not found",404,"SHOP_NOT_FOUND");
  const master=await prisma.master.update({where:{id:req.params.id},data:input,include:{shop:true}}).catch(()=>null);
  if(!master) throw new AppError("Master not found",404,"MASTER_NOT_FOUND");
  res.json({data:master});
}));
export {router as mastersRouter};