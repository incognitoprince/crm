import { useEffect, useState, type FormEvent } from "react";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { createShop, getShops } from "../services/api";
import type { Shop } from "../types";

export function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try { setShops((await getShops()).data); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load shops"); }
  }

  useEffect(() => { load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await createShop({ name, area, phone: phone || undefined });
      setName(""); setArea(""); setPhone(""); setShowForm(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create shop"); }
  }

  return <div className="mx-auto max-w-6xl space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h3 className="text-2xl font-semibold text-navy-900">Shops</h3><p className="text-sm text-slate-600">Manage the tailoring branches used by your CRM.</p></div>
      <button onClick={() => setShowForm(v => !v)} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white">{showForm ? "Close" : "+ Add shop"}</button>
    </div>
    {error && <ErrorState message={error} />}
    {showForm && <form onSubmit={submit} className="grid gap-3 rounded-xl border border-sand-100 bg-white p-5 shadow-sm sm:grid-cols-4">
      <input required value={name} onChange={e => setName(e.target.value)} placeholder="Shop name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input required value={area} onChange={e => setArea(e.target.value)} placeholder="Area" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white">Save shop</button>
    </form>}
    {!shops.length ? <LoadingState label="No active shops found." /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {shops.map(shop => <article key={shop.id} className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">Branch</p>
        <h4 className="mt-1 text-lg font-semibold text-navy-900">{shop.name}</h4>
        <p className="mt-1 text-sm text-slate-600">{shop.area}</p>
        {shop.phone && <p className="mt-3 text-sm text-slate-500">{shop.phone}</p>}
      </article>)}
    </div>}
  </div>;
}
