import type { Customer, CustomerDetail, DashboardSummary, HealthResponse, Order, Shop } from "../types";

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
export function createCustomer(data: { name: string; phone: string; email?: string; shopId?: string | null }) {
  return request<{ data: Customer }>("/api/customers", { method: "POST", body: JSON.stringify(data) });
}
export function getShops() { return request<{ data: Shop[] }>("/api/shops"); }
export function getOrders() { return request<{ data: Order[] }>("/api/orders"); }
export function updateOrderStatus(id: string, status: Order["status"]) {
  return request<{ data: Order }>("/api/orders/" + id + "/status", { method: "PATCH", body: JSON.stringify({ status }) });
}
