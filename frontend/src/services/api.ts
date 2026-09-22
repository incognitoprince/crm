import type { Customer, CustomerDetail, DashboardSummary, HealthResponse, Measurement, Order, Shop, GarmentType } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? "Request failed (" + response.status + ")");
  return body as T;
}

export function getHealth() { return request<HealthResponse>("/api/health"); }
export function getDashboardSummary() { return request<{ data: DashboardSummary }>("/api/dashboard/summary"); }
export function getCustomers(q = "") { return request<{ data: Customer[] }>("/api/customers" + (q ? "?q=" + encodeURIComponent(q) : "")); }
export function getCustomer(id: string) { return request<{ data: CustomerDetail }>("/api/customers/" + id); }
export function createCustomer(data: { name: string; phone: string; email?: string; address?: string; notes?: string; shopId?: string | null }) {
  return request<{ data: Customer }>("/api/customers", { method: "POST", body: JSON.stringify(data) });
}
export function updateCustomer(id: string, data: { name?: string; phone?: string; email?: string; address?: string; notes?: string; shopId?: string | null }) {
  return request<{ data: Customer }>("/api/customers/" + id, { method: "PATCH", body: JSON.stringify(data) });
}
export function getShops() { return request<{ data: Shop[] }>("/api/shops"); }
export function createShop(data: { name: string; area: string; phone?: string }) {
  return request<{ data: Shop }>("/api/shops", { method: "POST", body: JSON.stringify(data) });
}
export function getOrders() { return request<{ data: Order[] }>("/api/orders"); }
export function getOrder(id: string) { return request<{ data: Order }>("/api/orders/" + id); }
export function createOrder(data: { customerId: string; shopId?: string | null; garment: GarmentType; description: string; quantity: number; totalAmountFils: number; paidAmountFils: number; deliveryDate?: string | null; notes?: string | null }) {
  return request<{ data: Order }>("/api/orders", { method: "POST", body: JSON.stringify(data) });
}
export function updateOrderStatus(id: string, status: Order["status"]) {
  return request<{ data: Order }>("/api/orders/" + id + "/status", { method: "PATCH", body: JSON.stringify({ status }) });
}
export function saveMeasurement(data: { customerId: string; garment: GarmentType; profileName: string; values: Record<string, number>; notes?: string | null }) {
  return request<{ data: Measurement }>("/api/measurements", { method: "POST", body: JSON.stringify(data) });
}
export function deleteMeasurement(id: string) {
  return request<void>("/api/measurements/" + id, { method: "DELETE" });
}
