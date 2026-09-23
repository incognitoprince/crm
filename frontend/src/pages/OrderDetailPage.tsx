import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { getOrder, updateOrderStatus } from "../services/api";
import type { Order, OrderStatus } from "../types";

const statuses: OrderStatus[] = ["PENDING","MEASUREMENT","CUTTING","STITCHING","QUALITY_CHECK","READY","DELIVERED","CANCELLED"];
const label = (v: string) => v.replaceAll("_", " ");
const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) getOrder(id).then(r => setOrder(r.data)).catch(e => setError(e.message));
  }, [id]);

  async function change(status: OrderStatus) {
    if (!order) return;
    try { setOrder((await updateOrderStatus(order.id, status)).data); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to update order"); }
  }

  if (error) return <ErrorState message={error} />;
  if (!order) return <LoadingState label="Loading order…" />;
  const balance = order.totalAmountFils - order.paidAmountFils;

  return <div className="mx-auto max-w-5xl space-y-5">
    <Link to="/orders" className="text-sm text-slate-500 hover:underline">← Back to orders</Link>

    <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs text-slate-500">{order.orderNo}</p><h3 className="mt-1 text-2xl font-semibold text-navy-900">{order.customer.name}</h3><p className="mt-1 text-sm text-slate-600">{order.description}</p></div>
        <div className="flex items-center gap-2"><Link to={"/production?orderId=" + order.id} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium">Manage masters</Link><select value={order.status} onChange={e => change(e.target.value as OrderStatus)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">{statuses.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></div>
      </div>
    </section>

    <div className="grid gap-5 lg:grid-cols-3">
      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between gap-3"><h4 className="font-semibold text-navy-900">Design image</h4><span className="text-xs text-slate-500">Customer supplied</span></div>
        {order.designs.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{order.designs.map(design => <figure key={design.id} className="overflow-hidden rounded-lg border border-slate-200">
          {design.imagePath || design.design?.imagePath ? <img src={design.imagePath || design.design?.imagePath || ""} alt={design.design?.name ?? design.designName ?? "Customer design"} className="max-h-96 w-full object-contain bg-slate-50" /> : <div className="flex h-64 items-center justify-center bg-slate-50 text-sm text-slate-400">No image uploaded</div>}
          <figcaption className="p-3"><p className="font-medium text-slate-800">{design.design?.name ?? design.designName ?? "Customer design"}</p><p className="text-xs text-slate-500">{design.design?.designNo ?? "Order-specific design"}</p></figcaption>
        </figure>)}</div> : <p className="mt-3 text-sm text-slate-500">No design image attached.</p>}
      </section>

      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Stitching shop</p><p className="mt-1 text-xl font-semibold text-navy-900">{order.shop?.name ?? "Unassigned"}</p><p className="mt-1 text-sm text-slate-600">{order.shop?.area ?? ""}</p><p className="mt-5 text-xs text-slate-500">Production status</p><p className="mt-1 font-medium">{label(order.status)}</p></section>
    </div>

    <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3"><h4 className="font-semibold text-navy-900">Production quantity</h4><Link to={"/production?orderId=" + order.id} className="text-sm font-medium text-navy-900 hover:underline">Assign / edit master work →</Link></div>
      <div className="mt-4 flex flex-wrap gap-3">{order.sizeBreakdowns.length ? order.sizeBreakdowns.map(item => <div key={item.id} className="rounded-lg bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">Size</p><p className="text-lg font-semibold">{item.size}</p><p className="text-sm text-slate-600">{item.quantity} piece(s)</p></div>) : <p className="text-sm text-slate-500">No size breakdown recorded.</p>}</div>
      <p className="mt-4 text-sm font-medium text-slate-700">Total: {order.quantity} piece(s)</p>
    </section>

    <div className="grid gap-5 md:grid-cols-3">
      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Customer</p><Link to={"/customers/" + order.customer.id} className="mt-1 block font-semibold text-navy-900 hover:underline">{order.customer.name}</Link><p className="text-sm text-slate-600">{order.customer.phone}</p></section>
      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Garment</p><p className="mt-1 font-semibold">{label(order.garmentMaster?.name ?? order.garment)}</p><p className="text-sm text-slate-600">{order.quantity} item(s)</p></section>
      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Delivery</p><p className="mt-1 font-semibold">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "Not scheduled"}</p></section>
    </div>

    <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm"><h4 className="font-semibold text-navy-900">Payment</h4><div className="mt-4 grid gap-4 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Order value</p><p className="mt-1 text-lg font-semibold">{money(order.totalAmountFils)}</p></div><div><p className="text-xs text-slate-500">Paid</p><p className="mt-1 text-lg font-semibold">{money(order.paidAmountFils)}</p></div><div><p className="text-xs text-slate-500">Balance</p><p className="mt-1 text-lg font-semibold">{money(balance)}</p></div></div></section>
    <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm"><h4 className="font-semibold text-navy-900">Notes</h4><p className="mt-3 text-sm text-slate-600">{order.notes || "No notes added."}</p></section>
  </div>;
}
