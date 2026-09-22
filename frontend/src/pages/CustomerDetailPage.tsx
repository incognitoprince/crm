import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { getCustomer } from "../services/api";
import type { CustomerDetail } from "../types";

const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);
const label = (v: string) => v.replaceAll("_", " ");

export function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { if (id) getCustomer(id).then(r => setCustomer(r.data)).catch(e => setError(e.message)); }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!customer) return <LoadingState label="Loading customer…" />;

  return <div className="mx-auto max-w-6xl space-y-5">
    <Link to="/customers" className="text-sm text-slate-500 hover:underline">← Back to customers</Link>
    <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="text-xs font-medium text-slate-500">{customer.customerNo}</p><h3 className="mt-1 text-2xl font-semibold text-navy-900">{customer.name}</h3><p className="mt-1 text-sm text-slate-600">{customer.phone} · {customer.shop?.name ?? "No shop"}</p></div><div className="rounded-lg bg-sand-50 px-4 py-3 text-sm"><span className="text-slate-500">Orders</span><strong className="ml-2 text-navy-900">{customer.orders.length}</strong></div></div>
    </section>
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm"><h4 className="font-semibold text-navy-900">Measurements</h4><div className="mt-4 space-y-3">
        {customer.measurements.map(m => <div key={m.id} className="rounded-lg bg-slate-50 p-4"><div className="flex justify-between"><strong>{label(m.garment)}</strong><span className="text-xs text-slate-500">{m.profileName}</span></div><div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">{Object.entries(m.values).map(([k,v]) => <div key={k}><span className="text-slate-500">{k}: </span>{v}</div>)}</div></div>)}
        {!customer.measurements.length && <p className="text-sm text-slate-500">No measurements yet.</p>}
      </div></section>
      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm"><h4 className="font-semibold text-navy-900">Order history</h4><div className="mt-4 space-y-3">
        {customer.orders.map(o => <div key={o.id} className="rounded-lg border border-slate-100 p-4"><div className="flex justify-between gap-3"><div><strong>{o.orderNo}</strong><p className="mt-1 text-sm text-slate-600">{o.description}</p></div><span className="text-xs font-medium text-navy-900">{label(o.status)}</span></div><div className="mt-2 flex justify-between text-xs text-slate-500"><span>{o.quantity} item(s)</span><span>{money(o.totalAmountFils)}</span></div></div>)}
      </div></section>
    </div>
  </div>;
}
