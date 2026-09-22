export type HealthStatus = "ok" | "degraded" | "error";
export interface DatabaseCheck { status: HealthStatus | "error"; latencyMs: number; }
export interface HealthResponse { status: HealthStatus; service: string; version?: string; timestamp: string; uptimeSeconds: number; checks?: { database: DatabaseCheck }; }
export type AsyncState = "idle" | "loading" | "success" | "error";
export type OrderStatus = "PENDING" | "MEASUREMENT" | "CUTTING" | "STITCHING" | "QUALITY_CHECK" | "READY" | "DELIVERED" | "CANCELLED";
export type GarmentType = "THOBE" | "SHIRT" | "TROUSER" | "SUIT" | "OTHER";
export interface Shop { id: string; name: string; area: string; phone?: string | null; _count?: { customers: number; orders: number }; }
export interface Customer { id: string; customerNo: string; name: string; phone: string; email?: string | null; address?: string | null; notes?: string | null; status?: "ACTIVE" | "INACTIVE"; shop?: Shop | null; _count?: { orders: number }; }
export interface Measurement { id: string; garment: GarmentType; profileName: string; values: Record<string, number>; notes?: string | null; }
export interface OrderSizeBreakdown { id: string; size: string; quantity: number; }
export interface OrderReferenceImage { id: string; fileName: string; storagePath: string; mimeType: string; sortOrder: number; createdAt: string; }
export interface Order { id: string; orderNo: string; status: OrderStatus; garment: GarmentType; description: string; quantity: number; totalAmountFils: number; paidAmountFils: number; paymentStatus: "UNPAID" | "PARTIAL" | "PAID"; orderDate: string; deliveryDate?: string | null; notes?: string | null; customer: Customer; shop?: Shop | null; sizeBreakdowns: OrderSizeBreakdown[]; referenceImages: OrderReferenceImage[]; }
export interface CustomerDetail extends Customer { measurements: Measurement[]; orders: Order[]; }
export interface DashboardSummary { customers: number; orders: number; pending: number; production: number; quality: number; ready: number; delivered: number; revenueFils: number; shops: Array<{ id: string; name: string; area: string; customers: number; orders: number }>; }
