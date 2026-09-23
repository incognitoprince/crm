import type { Customer, CustomerDetail, DashboardSummary, HealthResponse, Measurement, Order, Shop, GarmentType, Master, Design, ProductionOrder, OrderDesign, MasterAssignment, Garment } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!(options?.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(API_BASE + path, { ...options, headers });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? "Request failed (" + response.status + ")");
  return body as T;
}

export function getHealth() { return request<HealthResponse>("/api/health"); }
export function getDashboardSummary() { return request<{ data: DashboardSummary }>("/api/dashboard/summary"); }
export function getCustomers(q = "") { return request<{ data: Customer[] }>("/api/customers" + (q ? "?q=" + encodeURIComponent(q) : "")); }
export function getCustomer(id: string) { return request<{ data: CustomerDetail }>("/api/customers/" + id); }
export function createCustomer(data: { name: string; phone: string; email?: string; address?: string; notes?: string; shopId?: string | null }) { return request<{ data: Customer }>("/api/customers", { method: "POST", body: JSON.stringify(data) }); }
export function updateCustomer(id: string, data: { name?: string; phone?: string; email?: string; address?: string; notes?: string; shopId?: string | null }) { return request<{ data: Customer }>("/api/customers/" + id, { method: "PATCH", body: JSON.stringify(data) }); }

export function getShops() { return request<{ data: Shop[] }>("/api/shops"); }
export function createShop(data: { name: string; area: string; phone?: string }) { return request<{ data: Shop }>("/api/shops", { method: "POST", body: JSON.stringify(data) }); }

export function getGarments() { return request<{ data: Garment[] }>("/api/garments"); }
export function createGarment(data: { name: string }) { return request<{ data: Garment }>("/api/garments", { method: "POST", body: JSON.stringify(data) }); }

export function getOrders() { return request<{ data: Order[] }>("/api/orders"); }
export function getOrder(id: string) { return request<{ data: Order }>("/api/orders/" + id); }
export function createOrder(data: { customerId: string; shopId?: string | null; garment: GarmentType; description: string; quantity: number; totalAmountFils: number; paidAmountFils: number; deliveryDate?: string | null; notes?: string | null; sizeBreakdowns: Array<{ size: string; quantity: number }> }) { return request<{ data: Order }>("/api/orders", { method: "POST", body: JSON.stringify(data) }); }
export function updateOrderStatus(id: string, status: Order["status"]) { return request<{ data: Order }>("/api/orders/" + id + "/status", { method: "PATCH", body: JSON.stringify({ status }) }); }

export function uploadOrderReferenceImage(orderId: string, file: File) {
  const body = new FormData();
  body.append("image", file);
  return request<{ data: Order["referenceImages"][number] }>("/api/orders/" + orderId + "/reference-images", { method: "POST", body });
}

export function saveMeasurement(data: { customerId: string; garment: GarmentType; profileName: string; values: Record<string, number>; notes?: string | null }) { return request<{ data: Measurement }>("/api/measurements", { method: "POST", body: JSON.stringify(data) }); }
export function deleteMeasurement(id: string) { return request<void>("/api/measurements/" + id, { method: "DELETE" }); }

export function getMasters(shopId = "") { return request<{ data: Master[] }>("/api/masters" + (shopId ? "?shopId=" + encodeURIComponent(shopId) : "")); }
export function createMaster(data: { name: string; phone?: string; shopId: string }) { return request<{ data: Master }>("/api/masters", { method: "POST", body: JSON.stringify(data) }); }
export function updateMaster(id: string, data: { name?: string; phone?: string | null; shopId?: string; active?: boolean }) { return request<{ data: Master }>("/api/masters/" + id, { method: "PATCH", body: JSON.stringify(data) }); }

export function getDesigns(garment = "") { return request<{ data: Design[] }>("/api/designs" + (garment ? "?garment=" + encodeURIComponent(garment) : "")); }
export function createDesign(data: { designNo: string; name: string; garment: GarmentType; description?: string }) { return request<{ data: Design }>("/api/designs", { method: "POST", body: JSON.stringify(data) }); }
export function updateDesign(id: string, data: { designNo?: string; name?: string; garment?: GarmentType; description?: string | null; active?: boolean }) { return request<{ data: Design }>("/api/designs/" + id, { method: "PATCH", body: JSON.stringify(data) }); }
export function uploadDesignImage(id: string, file: File) { const body = new FormData(); body.append("image", file); return request<{ data: Design }>("/api/designs/" + id + "/image", { method: "POST", body }); }

export function getProductionOrder(orderId: string) { return request<{ data: ProductionOrder }>("/api/production/orders/" + orderId); }
export function linkDesignToOrder(orderId: string, designId: string, notes?: string) {
  return request<{ data: OrderDesign }>("/api/production/orders/" + orderId + "/designs", { method: "POST", body: JSON.stringify({ designId, notes }) });
}
export function createOrderDesign(orderId: string, data: { designId?: string; file?: File; notes?: string }) {
  const body = new FormData();
  if (data.designId) body.append("designId", data.designId);
  if (data.notes) body.append("notes", data.notes);
  if (data.file) body.append("image", data.file);
  return request<{ data: OrderDesign }>("/api/production/orders/" + orderId + "/designs", { method: "POST", body });
}
export function updateOrderDesign(orderId: string, orderDesignId: string, data: { designId?: string; file?: File; notes?: string }) {
  const body = new FormData();
  if (data.designId) body.append("designId", data.designId);
  if (data.notes) body.append("notes", data.notes);
  if (data.file) body.append("image", data.file);
  return request<{ data: OrderDesign }>("/api/production/orders/" + orderId + "/designs/" + orderDesignId, { method: "PATCH", body });
}
export function deleteOrderDesign(orderId: string, orderDesignId: string) {
  return request<void>("/api/production/orders/" + orderId + "/designs/" + orderDesignId, { method: "DELETE" });
}
export function createOrderAssignment(orderId: string, data: { masterId: string; size: string; quantity: number; notes?: string }) { return request<{ data: MasterAssignment }>("/api/production/orders/" + orderId + "/assignments", { method: "POST", body: JSON.stringify(data) }); }
export function createMasterAssignment(orderDesignId: string, data: { masterId: string; size: string; quantity: number; notes?: string }) { return request<{ data: MasterAssignment }>("/api/production/order-designs/" + orderDesignId + "/assignments", { method: "POST", body: JSON.stringify(data) }); }
export function updateMasterAssignment(id: string, data: { masterId?: string; quantity?: number; notes?: string | null }) { return request<{ data: MasterAssignment }>("/api/production/assignments/" + id, { method: "PATCH", body: JSON.stringify(data) }); }
export function startMasterAssignment(id: string) { return request<{ data: MasterAssignment }>("/api/production/assignments/" + id + "/start", { method: "PATCH" }); }
export function completeMasterAssignment(id: string) { return request<{ data: MasterAssignment }>("/api/production/assignments/" + id + "/complete", { method: "PATCH" }); }
export function deleteMasterAssignment(id: string) { return request<void>("/api/production/assignments/" + id, { method: "DELETE" }); }
