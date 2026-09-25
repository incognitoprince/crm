import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { createGarment, getCustomer, getGarments, getShops, saveMeasurement, updateCustomer } from "../services/api";
import type { CustomerDetail, Garment, GarmentType, Shop } from "../types";

const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);
const label = (v: string) => v.replaceAll("_", " ");
const fields: Record<GarmentType, string[]> = {
  THOBE: ["length", "shoulder", "chest", "waist", "sleeve", "neck"],
  SHIRT: ["length", "shoulder", "chest", "waist", "sleeve", "neck"],
  TROUSER: ["length", "waist", "hip", "thigh", "bottom"],
  SUIT: ["jacketLength", "shoulder", "chest", "sleeve", "trouserLength", "waist"],
  OTHER: ["length", "shoulder", "chest", "waist", "sleeve"],
};

export function CustomerDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [measurementOpen, setMeasurementOpen] = useState(false);
  const [garment, setGarment] = useState<GarmentType>("");
  const [showGarmentForm, setShowGarmentForm] = useState(false);
  const [newGarmentName, setNewGarmentName] = useState("");
  const [profileName, setProfileName] = useState("Standard");
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  async function load() {
    if (!id) return;
    try { setCustomer((await getCustomer(id)).data); setShops((await getShops()).data); setGarments((await getGarments()).data); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load customer"); }
  }
  useEffect(() => { load(); }, [id]);

  const measurementFields = useMemo(() => garment ? (fields[garment] ?? fields.OTHER) : [], [garment]);

  function startMeasurement() {
    setGarment("");
    setValues({});
    setProfileName("Standard");
    setNotes("");
    setMeasurementOpen(true);
  }

  function selectMeasurementGarment(value: string) {
    const g = value as GarmentType;
    const existing = customer?.measurements.find(m => m.garment === g);
    const nextFields = fields[g] ?? fields.OTHER;
    setGarment(g);
    setValues(Object.fromEntries(nextFields.map(f => [f, existing?.values[f]?.toString() ?? ""])));
    setProfileName(existing?.profileName ?? "Standard");
    setNotes(existing?.notes ?? "");
  }

  async function addGarment() {
    const name = newGarmentName.trim();
    if (!name) return;
    setError("");
    try {
      const result = await createGarment({ name });
      setGarments(current => [...current, result.data].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
      setNewGarmentName("");
      setShowGarmentForm(false);
      setGarment("");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to add garment"); }
  }

  async function submitMeasurement() {
    try {
      if (!garment) { setError("Choose a garment before saving the measurement."); return; }
      const parsed = Object.fromEntries(Object.entries(values).filter(([,v]) => v !== "").map(([k,v]) => [k, Number(v)]));
      await saveMeasurement({ customerId: id!, garment, profileName, values: parsed, notes: notes || null });
      setMeasurementOpen(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save measurement"); }
  }

  async function saveCustomer(form: HTMLFormElement) {
    const data = new FormData(form);
    try {
      await updateCustomer(id!, { name: String(data.get("name")), phone: String(data.get("phone")), email: String(data.get("email") || ""), address: String(data.get("address") || ""), notes: String(data.get("notes") || ""), shopId: String(data.get("shopId") || "") || null });
      setEditing(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update customer"); }
  }

  if (error && !customer) return <ErrorState message={error} />;
  if (!customer) return <LoadingState label="Loading customer…" />;

  return <div className="mx-auto max-w-6xl space-y-5">
    <Link to="/customers" className="text-sm text-slate-500 hover:underline">← Back to customers</Link>
    <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
      {!editing ? <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div><p className="text-xs font-medium text-slate-500">{customer.customerNo}</p><h3 className="mt-1 text-2xl font-semibold text-navy-900">{customer.name}</h3><p className="mt-1 text-sm text-slate-600">{customer.phone} · {customer.shop?.name ?? "No shop"}</p><p className="mt-1 text-sm text-slate-500">{customer.email || "No email"} · {customer.address || "No address"}</p></div>
        <div className="flex gap-2"><Link to="/orders/new" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white">+ New order</Link><button onClick={() => setEditing(true)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Edit customer</button></div>
      </div> : <form onSubmit={e => { e.preventDefault(); void saveCustomer(e.currentTarget); }} className="grid gap-3 sm:grid-cols-2">
        <input name="name" required defaultValue={customer.name} placeholder="Name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input name="phone" required defaultValue={customer.phone} placeholder="Phone" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input name="email" defaultValue={customer.email ?? ""} placeholder="Email" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select name="shopId" defaultValue={customer.shop?.id ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm"><option value="">No shop</option>{shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <input name="address" defaultValue={customer.address ?? ""} placeholder="Address" className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
        <textarea name="notes" defaultValue={customer.notes ?? ""} placeholder="Customer notes" rows={3} className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
        <div className="flex gap-2 sm:col-span-2"><button className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white">Save changes</button><button type="button" onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button></div>
      </form>}
    </section>

    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><div><h4 className="font-semibold text-navy-900">Measurements</h4><p className="text-xs text-slate-500">Store garment measurements in cm.</p></div><button onClick={startMeasurement} className="rounded-md bg-navy-900 px-3 py-2 text-xs font-medium text-white">+ Measurement</button></div>
        {measurementOpen && <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="text-sm">
              <div className="flex items-center justify-between gap-2"><span>Garment</span><button type="button" onClick={() => setShowGarmentForm(v => !v)} className="text-xs font-medium text-navy-900 hover:underline">+ Add garment</button></div>
              <select value={garment} onChange={e => selectMeasurementGarment(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">Choose garment…</option>{garments.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}</select>
              {showGarmentForm && <div className="mt-2 flex gap-2 rounded-lg bg-white p-2"><input autoFocus value={newGarmentName} onChange={e => setNewGarmentName(e.target.value)} placeholder="New garment name" className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm" /><button type="button" onClick={addGarment} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white">Add</button></div>}
            </div>
            <input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Profile name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            {measurementFields.map(field => <label key={field} className="text-xs font-medium text-slate-600">{label(field)} (cm)<input type="number" min="0" step="0.1" value={values[field] ?? ""} onChange={e => setValues(v => ({...v, [field]: e.target.value}))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" /></label>)}
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Measurement notes" rows={2} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm sm:col-span-2" />
          </div>
          <div className="mt-3 flex gap-2"><button onClick={() => void submitMeasurement()} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white">Save measurement</button><button onClick={() => setMeasurementOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button></div>
        </div>}
        <div className="mt-4 space-y-3">{customer.measurements.map(m => <div key={m.id} className="rounded-lg bg-slate-50 p-4"><div className="flex justify-between"><strong>{label(m.garment)}</strong><span className="text-xs text-slate-500">{m.profileName}</span></div><div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">{Object.entries(m.values).map(([k,v]) => <div key={k}><span className="text-slate-500">{label(k)}: </span>{v} cm</div>)}</div>{m.notes && <p className="mt-2 text-xs text-slate-500">{m.notes}</p>}</div>)}{!customer.measurements.length && <p className="text-sm text-slate-500">No measurements yet.</p>}</div>
      </section>

      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><div><h4 className="font-semibold text-navy-900">Order history</h4><p className="text-xs text-slate-500">{customer.orders.length} recent order(s)</p></div><Link to="/orders/new" className="text-sm font-medium text-navy-900 hover:underline">New order</Link></div>
        <div className="mt-4 space-y-3">{customer.orders.map(o => <Link to={"/orders/" + o.id} key={o.id} className="block rounded-lg border border-slate-100 p-4 hover:bg-slate-50"><div className="flex justify-between gap-3"><div><strong>{o.orderNo}</strong><p className="mt-1 text-sm text-slate-600">{o.description}</p></div><span className="text-xs font-medium text-navy-900">{label(o.status)}</span></div><div className="mt-2 flex justify-between text-xs text-slate-500"><span>{o.quantity} item(s)</span>{user?.role === "OWNER" && <span>{money(o.totalAmountFils)}</span>}</div></Link>)}</div>
      </section>
    </div>
  </div>;
}
