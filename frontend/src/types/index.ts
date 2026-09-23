export type HealthStatus = "ok" | "degraded" | "error";
export interface DatabaseCheck { status: HealthStatus | "error"; latencyMs: number; }
export interface HealthResponse { status: HealthStatus; service: string; version?: string; timestamp: string; uptimeSeconds: number; checks?: { database: DatabaseCheck }; }
export type AsyncState = "idle" | "loading" | "success" | "error";
export type OrderStatus = "PENDING" | "MEASUREMENT" | "CUTTING" | "STITCHING" | "QUALITY_CHECK" | "READY" | "DELIVERED" | "CANCELLED";
export type GarmentType = string;

export interface Garment { id: string; name: string; active: boolean; sortOrder: number; }
export interface Shop { id: string; name: string; area: string; phone?: string | null; _count?: { customers: number; orders: number }; }
export interface Customer { id: string; customerNo: string; name: string; phone: string; email?: string | null; address?: string | null; notes?: string | null; status?: "ACTIVE" | "INACTIVE"; shop?: Shop | null; _count?: { orders: number }; }
export interface Measurement { id: string; garment: GarmentType; profileName: string; values: Record<string, number>; notes?: string | null; }
export interface OrderSizeBreakdown { id: string; size: string; quantity: number; }
export interface OrderReferenceImage { id: string; fileName: string; storagePath: string; mimeType: string; sortOrder: number; createdAt: string; }
export interface Design { id: string; designNo: string; name: string; garment: GarmentType; garmentId?: string | null; garmentMaster?: Garment | null; description?: string | null; imagePath?: string | null; active: boolean; createdAt?: string; }
export interface Master { id: string; name: string; phone?: string | null; shopId: string; active: boolean; shop: Shop; _count?: { assignments: number }; currentAssignments?: MasterAssignment[]; completedAssignments?: MasterAssignment[]; assignments?: MasterAssignment[]; }
export interface MasterAssignment { id: string; masterId: string; orderId?: string | null; size: string; quantity: number; notes?: string | null; startedAt?: string | null; completedAt?: string | null; master: Master; order?: { id: string; orderNo: string; customer: { name: string }; garment: GarmentType; quantity: number; status?: OrderStatus } | null; orderDesignId?: string | null; orderDesign?: { order: { id: string; orderNo: string; customer: { name: string }; garment: GarmentType; quantity: number }; design?: Design | null; designName?: string | null } | null; }
export interface OrderDesign { id: string; orderId: string; designId?: string | null; designName?: string | null; imagePath?: string | null; design?: Design | null; notes?: string | null; assignments: MasterAssignment[]; }
export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "OTHER";
export interface Payment { id: string; orderId: string; amountFils: number; method: PaymentMethod; reference?: string | null; notes?: string | null; receivedAt: string; createdAt: string; order: { id: string; orderNo: string; customer: Customer; shop?: Shop | null }; }
export interface Order {
  id: string;
  orderNo: string;
  status: OrderStatus;
  garment: GarmentType;
  garmentId?: string | null;
  garmentMaster?: Garment | null;
  description: string;
  quantity: number;
  totalAmountFils: number;
  paidAmountFils: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  orderDate: string;
  deliveryDate?: string | null;
  notes?: string | null;
  customer: Customer;
  shop?: Shop | null;
  sizeBreakdowns: OrderSizeBreakdown[];
  referenceImages: OrderReferenceImage[];
  designs: OrderDesign[];
  masterAssignments?: MasterAssignment[];
  payments?: Payment[];
}
export interface CustomerDetail extends Customer { measurements: Measurement[]; orders: Order[]; }
export interface DashboardSummary {
  customers: number;
  orders: number;
  pending: number;
  production: number;
  quality: number;
  ready: number;
  delivered: number;
  revenueFils: number;
  paidFils: number;
  outstandingFils: number;
  delayed: number;
  shops: Array<{ id: string; name: string; area: string; customers: number; orders: number; completed: number; pending: number; inProgress: number; revenueFils: number }>;
  orderStatus: Record<OrderStatus, number>;
  upcomingDeliveries: Array<{ id: string; orderNo: string; customerName: string; garment: string; deliveryDate: string | null; status: OrderStatus }>;
  pendingPayments: Array<{ id: string; orderNo: string; customerName: string; totalAmountFils: number; paidAmountFils: number; outstandingFils: number }>;
  activity: Array<{ id: string; type: "ORDER_CREATED" | "ORDER_UPDATED"; orderId: string; orderNo: string; customerName: string; status: OrderStatus; amountFils: number; paidAmountFils: number; timestamp: string }>;
  topDesigns: Array<{ id: string; designNo: string; name: string; imagePath?: string | null; garment: string; orders: number }>;
}
export interface ProductionOrder extends Order {}
