import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { createCustomer, getCustomers, getShops } from "../services/api";
import type { Customer, Shop } from "../types";

export function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shopId, setShopId] = useState("");
  const [error, setError] = useState("");

  const load = () => getCustomers(q).then(r => setCustomers(r.data)).catch(e => setError(e.message));
  useEffect(() => { load(); getShops().then(r => setShops(r.data)).catch(e => setError(e.message)); }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await createCustomer({ name, phone, shopId: shopId || null });
      setName(""); setPhone(""); setShopId(""); setShowForm(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create customer"); }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="text-2xl font-semibold text-navy-900">Customers</h3><p className="text-sm text-slate-600">Search customers and open their complete tailoring history.</p></div>
        <button onClick={() => setShowForm(v => !v)} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white">{showForm ? "Close" : "+ Add customer"}</button>
      </div>
      {error && <ErrorState message={error} />}
      {showForm && (
        <form onSubmit={submit} className="grid gap-3 rounded-xl border border-sand-100 bg-white p-5 shadow-sm sm:grid-cols-4">
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Customer name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <select value={shopId} onChange={e => setShopId(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select shop</option>{shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white">Save customer</button>
        </form>
      )}
      <div className="rounded-xl border border-sand-100 bg-white p-4 shadow-sm">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, phone or customer number…" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      {!customers.length ? <LoadingState label="No customers found." /> : (
        <div className="overflow-hidden rounded-xl border border-sand-100 bg-white shadow-sm">
          <div className="overflow-x-auto"><table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Shop</th><th className="px-4 py-3">Orders</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{customers.map(c => <tr key={c.id} onClick={() => navigate("/customers/" + c.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigate("/customers/" + c.id); }} role="button" tabIndex={0} className="cursor-pointer hover:bg-slate-50">
              <td className="px-4 py-3"><p className="font-medium text-navy-900">{c.name}</p><p className="text-xs text-slate-500">{c.customerNo}</p></td>
              <td className="px-4 py-3 text-slate-600">{c.phone}</td><td className="px-4 py-3 text-slate-600">{c.shop?.name ?? "—"}</td><td className="px-4 py-3 text-slate-600">{c._count?.orders ?? 0}</td>
            </tr>)}</tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}
