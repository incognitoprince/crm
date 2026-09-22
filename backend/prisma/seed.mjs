import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const shops = [
  { id: "demo-shop-kuwait-city", name: "Shop1", area: "Area 1", phone: "+965 2200 1001" },
  { id: "demo-shop-hawally", name: "Shop2", area: "Area 2", phone: "+965 2200 1002" },
  { id: "demo-shop-salmiya", name: "Shop3", area: "Area 3", phone: "+965 2200 1003" },
  { id: "demo-shop-farwaniya", name: "Shop4", area: "Area 4", phone: "+965 2200 1004" },
];

const customers = [
  ["demo-cust-001","CUST-1001","Ahmed Al-Mutairi","+965 5000 1001","Shop1"],
  ["demo-cust-002","CUST-1002","Mohammed Al-Hajri","+965 5000 1002","Shop2"],
  ["demo-cust-003","CUST-1003","Abdullah Al-Rashid","+965 5000 1003","Shop3"],
  ["demo-cust-004","CUST-1004","Yousef Al-Dosari","+965 5000 1004","Shop4"],
  ["demo-cust-005","CUST-1005","Khaled Al-Sabah","+965 5000 1005","Shop1"],
  ["demo-cust-006","CUST-1006","Fahad Al-Otaibi","+965 5000 1006","Shop2"],
  ["demo-cust-007","CUST-1007","Salem Al-Ajmi","+965 5000 1007","Shop3"],
  ["demo-cust-008","CUST-1008","Nasser Al-Enezi","+965 5000 1008","Shop4"],
  ["demo-cust-009","CUST-1009","Omar Al-Qahtani","+965 5000 1009","Shop1"],
  ["demo-cust-010","CUST-1010","Bader Al-Fahad","+965 5000 1010","Shop2"],
  ["demo-cust-011","CUST-1011","Saad Al-Marri","+965 5000 1011","Shop3"],
  ["demo-cust-012","CUST-1012","Turki Al-Shammari","+965 5000 1012","Shop4"],
];

const masters = [
  ["demo-master-001","Ahmed Hassan","+965 6000 2001","demo-shop-kuwait-city"],
  ["demo-master-002","Hassan Ali","+965 6000 2002","demo-shop-kuwait-city"],
  ["demo-master-003","Mohammed Salem","+965 6000 2003","demo-shop-kuwait-city"],
  ["demo-master-004","Yousef Karim","+965 6000 2004","demo-shop-hawally"],
  ["demo-master-005","Khaled Nasser","+965 6000 2005","demo-shop-hawally"],
  ["demo-master-006","Omar Faisal","+965 6000 2006","demo-shop-salmiya"],
  ["demo-master-007","Bader Mahmoud","+965 6000 2007","demo-shop-farwaniya"],
  ["demo-master-008","Salem Ibrahim","+965 6000 2008","demo-shop-farwaniya"],
];

const designs = [
  ["demo-design-001","DES-0041","Classic Arabic Collar","THOBE","Traditional white thobe collar"],
  ["demo-design-002","DES-0042","Modern French Collar","THOBE","Clean modern collar profile"],
  ["demo-design-003","DES-0043","Executive Shirt","SHIRT","Formal business shirt"],
  ["demo-design-004","DES-0044","Straight Fit Trouser","TROUSER","Classic straight fit"],
  ["demo-design-005","DES-0045","Two Button Suit","SUIT","Two-piece business suit"],
];

const measurements = [
  ["demo-cust-001","THOBE",{length:58,shoulder:18,chest:42,waist:40,sleeve:24,neck:16}],
  ["demo-cust-002","THOBE",{length:57,shoulder:17.5,chest:41,waist:39,sleeve:23.5,neck:16}],
  ["demo-cust-003","SHIRT",{length:30,shoulder:18,chest:42,waist:40,sleeve:24,neck:16}],
  ["demo-cust-004","TROUSER",{length:42,waist:36,hip:40,thigh:23,bottom:15}],
  ["demo-cust-005","THOBE",{length:59,shoulder:18.5,chest:43,waist:41,sleeve:24.5,neck:16.5}],
  ["demo-cust-006","SUIT",{length:30,shoulder:18,chest:42,waist:38,sleeve:24,trouserWaist:36}],
];

const orders = [
  ["demo-order-001","ORD-2026-001","demo-cust-001","demo-shop-kuwait-city","THOBE","White premium cotton thobe",2,42000,21000,"STITCHING",2],
  ["demo-order-002","ORD-2026-002","demo-cust-002","demo-shop-hawally","THOBE","Classic white thobe",3,57000,57000,"QUALITY_CHECK",3],
  ["demo-order-003","ORD-2026-003","demo-cust-003","demo-shop-salmiya","SHIRT","Formal cotton shirts",4,36000,18000,"CUTTING",5],
  ["demo-order-004","ORD-2026-004","demo-cust-004","demo-shop-farwaniya","TROUSER","Tailored trousers",2,30000,0,"PENDING",6],
  ["demo-order-005","ORD-2026-005","demo-cust-005","demo-shop-kuwait-city","THOBE","Summer linen thobe",3,69000,69000,"READY",1],
  ["demo-order-006","ORD-2026-006","demo-cust-006","demo-shop-hawally","SUIT","Two-piece business suit",1,85000,42500,"MEASUREMENT",7],
  ["demo-order-007","ORD-2026-007","demo-cust-007","demo-shop-salmiya","THOBE","Premium white thobes",5,110000,55000,"STITCHING",4],
  ["demo-order-008","ORD-2026-008","demo-cust-008","demo-shop-farwaniya","SHIRT","Office shirts",3,33000,33000,"DELIVERED",-2],
  ["demo-order-009","ORD-2026-009","demo-cust-009","demo-shop-kuwait-city","THOBE","Custom collar thobe",2,46000,0,"QUALITY_CHECK",2],
  ["demo-order-010","ORD-2026-010","demo-cust-010","demo-shop-hawally","TROUSER","Formal trousers",2,28000,14000,"CUTTING",3],
  ["demo-order-011","ORD-2026-011","demo-cust-011","demo-shop-salmiya","THOBE","Daily wear thobe",2,40000,40000,"READY",2],
  ["demo-order-012","ORD-2026-012","demo-cust-012","demo-shop-farwaniya","SUIT","Executive suit alteration",1,60000,0,"PENDING",8],
];

function dateFromOffset(days) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  if (process.env.SEED_DEMO_DATA !== "true") return;

  for (const shop of shops) {
    await prisma.shop.upsert({ where: { id: shop.id }, update: shop, create: shop });
  }

  for (const [id, customerNo, name, phone, shopName] of customers) {
    const shop = shops.find(s => s.name === shopName);
    await prisma.customer.upsert({
      where: { id },
      update: { customerNo, name, phone, shopId: shop?.id },
      create: { id, customerNo, name, phone, shopId: shop?.id },
    });
  }

  for (const [id, name, phone, shopId] of masters) {
    await prisma.master.upsert({
      where: { id },
      update: { name, phone, shopId, active: true },
      create: { id, name, phone, shopId, active: true },
    });
  }

  for (const [id, designNo, name, garment, description] of designs) {
    await prisma.design.upsert({
      where: { id },
      update: { designNo, name, garment, description, active: true },
      create: { id, designNo, name, garment, description, active: true },
    });
  }

  for (const [customerId, garment, values] of measurements) {
    await prisma.measurement.upsert({
      where: { customerId_garment_profileName: { customerId, garment, profileName: "Standard" } },
      update: { values },
      create: { customerId, garment, profileName: "Standard", values },
    });
  }

  for (const [id, orderNo, customerId, shopId, garment, description, quantity, total, paid, status, deliveryOffset] of orders) {
    const paymentStatus = paid === 0 ? "UNPAID" : paid >= total ? "PAID" : "PARTIAL";
    await prisma.order.upsert({
      where: { id },
      update: { orderNo, customerId, shopId, garment, description, quantity, totalAmountFils: total, paidAmountFils: paid, paymentStatus, status, deliveryDate: dateFromOffset(deliveryOffset) },
      create: { id, orderNo, customerId, shopId, garment, description, quantity, totalAmountFils: total, paidAmountFils: paid, paymentStatus, status, deliveryDate: dateFromOffset(deliveryOffset) },
    });
  }

  const sizeRows = [
    ["demo-order-001", [["M",1],["L",1]]],
    ["demo-order-002", [["M",2],["L",1]]],
    ["demo-order-003", [["M",2],["L",2]]],
    ["demo-order-004", [["M",1],["L",1]]],
    ["demo-order-005", [["M",2],["L",1]]],
    ["demo-order-006", [["L",1]]],
    ["demo-order-007", [["M",2],["L",2],["XL",1]]],
    ["demo-order-008", [["M",2],["L",1]]],
    ["demo-order-009", [["M",1],["L",1]]],
    ["demo-order-010", [["M",1],["L",1]]],
    ["demo-order-011", [["M",1],["L",1]]],
    ["demo-order-012", [["L",1]]],
  ];
  for (const [orderId, rows] of sizeRows) {
    for (const [size, quantity] of rows) {
      await prisma.orderSizeBreakdown.upsert({
        where: { orderId_size: { orderId, size } },
        update: { quantity },
        create: { orderId, size, quantity },
      });
    }
  }

  const orderDesigns = [
    ["demo-od-001","demo-order-001","demo-design-001"],
    ["demo-od-002","demo-order-002","demo-design-001"],
    ["demo-od-003","demo-order-005","demo-design-002"],
    ["demo-od-004","demo-order-007","demo-design-001"],
  ];
  for (const [id, orderId, designId] of orderDesigns) {
    await prisma.orderDesign.upsert({
      where: { id },
      update: { orderId, designId },
      create: { id, orderId, designId },
    });
  }

  const assignments = [
    ["demo-assignment-001","demo-od-001","demo-master-001","M",1],
    ["demo-assignment-002","demo-od-001","demo-master-002","L",1],
    ["demo-assignment-003","demo-od-002","demo-master-004","M",2],
    ["demo-assignment-004","demo-od-002","demo-master-005","L",1],
    ["demo-assignment-005","demo-od-003","demo-master-001","M",2],
    ["demo-assignment-006","demo-od-004","demo-master-006","M",2],
    ["demo-assignment-007","demo-od-004","demo-master-006","L",1],
    ["demo-assignment-008","demo-od-004","demo-master-005","L",1],
  ];
  for (const [id, orderDesignId, masterId, size, quantity] of assignments) {
    await prisma.masterAssignment.upsert({
      where: { id },
      update: { orderDesignId, masterId, size, quantity },
      create: { id, orderDesignId, masterId, size, quantity },
    });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
