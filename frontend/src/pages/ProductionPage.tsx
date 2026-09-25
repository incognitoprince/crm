import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  startMasterAssignment,
  completeMasterAssignment,
  createOrderAssignment,
  deleteMasterAssignment,
  getDesigns,
  getMasters,
  getOrders,
  getProductionOrder,
  linkDesignToOrder,
  updateMasterAssignment,
} from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import type { Design, Master, MasterAssignment, Order, ProductionOrder } from "../types";

const label = (v: string) => v.replaceAll("_", " ");

export function ProductionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState(searchParams.get("orderId") ?? "");
  const [production, setProduction] = useState<ProductionOrder | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [selectedDesign, setSelectedDesign] = useState("");
  const [form, setForm] = useState({ size: "", masterId: searchParams.get("masterId") ?? "", quantity: "", notes: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ masterId: "", quantity: "", notes: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadOrders() {
    try {
      const [o, d] = await Promise.all([getOrders(), getDesigns()]);
      setOrders(o.data);
      setDesigns(d.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load production data");
    }
  }

  async function loadOrder(id: string) {
    if (!id) { setProduction(null); return; }
    try {
      const p = (await getProductionOrder(id)).data;
      setProduction(p);
      if (p.shop?.id) setMasters((await getMasters(p.shop.id)).data);
      else setMasters([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load order production");
    }
  }

  useEffect(() => { loadOrders(); }, []);
  useEffect(() => { loadOrder(orderId); }, [orderId]);

  const availableDesigns = useMemo(
    () => production ? designs.filter(d => (production.garmentMaster?.id ? d.garmentId === production.garmentMaster.id : d.garment === production.garment) && !production.designs.some(x => x.designId === d.id)) : [],
    [designs, production]
  );

  async function addDesign() {
    if (!orderId || !selectedDesign) return;
    setSaving(true); setError("");
    try {
      await linkDesignToOrder(orderId, selectedDesign);
      setSelectedDesign("");
      await loadOrder(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to link design");
    } finally { setSaving(false); }
  }

  async function assignWithoutDesign() {
    if (!orderId || !form.size || !form.masterId || !form.quantity) return;
    setSaving(true); setError("");
    try {
      await createOrderAssignment(orderId, { masterId: form.masterId, size: form.size, quantity: Number(form.quantity), notes: form.notes || undefined });
      setForm(f => ({ ...f, quantity: "", notes: "" }));
      await loadOrder(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to assign master");
    } finally { setSaving(false); }
  }

  function beginEdit(a: MasterAssignment) {
    setEditing(a.id);
    setEditForm({ masterId: a.masterId, quantity: String(a.quantity), notes: a.notes ?? "" });
  }

  async function saveEdit(id: string) {
    setSaving(true); setError("");
    try {
      await updateMasterAssignment(id, { masterId: editForm.masterId, quantity: Number(editForm.quantity), notes: editForm.notes || null });
      setEditing(null);
      await loadOrder(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update assignment");
    } finally { setSaving(false); }
  }

  async function start(id: string) {
    setSaving(true); setError("");
    try {
      await startMasterAssignment(id);
      await loadOrder(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start assignment");
    } finally { setSaving(false); }
  }

  async function complete(id: string) {
    if (!window.confirm("Mark this master assignment as completed?")) return;
    setSaving(true); setError("");
    try {
      await completeMasterAssignment(id);
      await loadOrder(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to complete assignment");
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this master assignment?")) return;
    setSaving(true); setError("");
    try {
      await deleteMasterAssignment(id);
      await loadOrder(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to remove assignment");
    } finally { setSaving(false); }
  }

  if (!orders.length && !error) return <LoadingState label="Loading production board…" />;

  return <div className="mx-auto max-w-6xl space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Production</p><h3 className="text-2xl font-semibold text-navy-900">Master assignments</h3><p className="text-sm text-slate-600">Assign, change, complete, or remove work by size. The same size can be split across multiple masters.</p></div>
      <button onClick={() => navigate("/orders")} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white">Done</button>
    </div>

    {error && <ErrorState message={error} />}

    <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Select order</label>
      <select value={orderId} onChange={e => setOrderId(e.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="">Choose an order…</option>
        {orders.map(o => <option key={o.id} value={o.id}>{o.orderNo} · {o.customer.name} · {label(o.garmentMaster?.name ?? o.garment)} · {o.quantity} pcs</option>)}
      </select>
    </section>

    {production && <>
      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><p className="text-xs text-slate-500">{production.orderNo} · {production.shop?.name || "No shop"}</p><h4 className="mt-1 text-xl font-semibold text-navy-900">{production.customer.name}</h4><p className="text-sm text-slate-600">{production.description}</p></div>
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-right"><p className="text-xs text-slate-500">Total pieces</p><p className="text-lg font-semibold">{production.quantity}</p></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">{production.sizeBreakdowns.map(s => <span key={s.id} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium">{s.size}: {s.quantity}</span>)}</div>
      </section>

      {production.designs.length > 0 && <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm"><div><h4 className="font-semibold text-navy-900">Attached designs</h4><p className="mt-1 text-xs text-slate-500">Designs are reference material only. Master assignments are managed below by order size and quantity.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{production.designs.map(od => <div key={od.id} className="overflow-hidden rounded-lg border border-slate-200">{od.imagePath || od.design?.imagePath ? <img src={od.imagePath || od.design?.imagePath || ""} alt="" className="h-36 w-full object-cover bg-slate-50" /> : <div className="flex h-36 items-center justify-center bg-slate-50 text-xs text-slate-400">No image</div>}<div className="p-3"><p className="font-medium text-slate-800">{od.design?.name ?? od.designName ?? "Customer design"}</p><p className="mt-1 text-xs text-slate-500">{od.design?.designNo ?? "Order reference"}</p></div></div>)}</div></section>}

      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div><h4 className="font-semibold text-navy-900">General production assignments</h4><p className="mt-1 text-xs text-slate-500">Master work can be assigned using the order's garment, size, and production quantity even when no design image is attached.</p></div>
        </div>
        <div className="mt-4 space-y-3">
          {production.sizeBreakdowns.map(s => {
            const rows = (production.masterAssignments ?? []).filter(a => a.size === s.size);
            const assigned = rows.reduce((n, a) => n + a.quantity, 0);
            const remaining = s.quantity - assigned;
            return <div key={s.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><span className="font-semibold">{s.size}</span><span className="ml-2 text-sm text-slate-500">{s.quantity} required</span></div><span className={"rounded-full px-2.5 py-1 text-xs font-medium " + (remaining === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{assigned} assigned overall · {remaining} remaining</span></div>
              {rows.length > 0 && <div className="mt-3 space-y-2">{rows.map(a => <div key={a.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><span className="font-medium">{a.master.name}</span><span className="ml-2 text-slate-500">{a.quantity} pcs</span></div><div className="flex gap-3"><button onClick={() => beginEdit(a)} disabled={!!a.completedAt} className="text-xs font-medium text-navy-900 disabled:opacity-40">Edit</button>{!a.startedAt && !a.completedAt && <button onClick={() => start(a.id)} disabled={saving} className="text-xs font-medium text-emerald-700">Start</button>}{a.startedAt && !a.completedAt && <button onClick={() => complete(a.id)} className="text-xs font-medium text-emerald-700">Done</button>}{!a.startedAt && !a.completedAt && <button onClick={() => remove(a.id)} className="text-xs font-medium text-red-700">Remove</button>}</div></div><p className="mt-1 text-[11px] text-slate-500">{a.completedAt ? "Completed" : a.startedAt ? "Currently working — master is locked" : "Assigned, not started"}{a.notes ? " · " + a.notes : ""}</p></div>)}</div>}
              {remaining > 0 && !["DELIVERED","CANCELLED"].includes(production.status) && <div className="mt-3 grid gap-2 sm:grid-cols-4">
                <select value={form.size === s.size ? form.masterId : ""} onChange={e => setForm(f => ({ ...f, size: s.size, masterId: e.target.value }))} className="rounded-md border border-slate-300 px-3 py-2 text-sm"><option value="">Master…</option>{masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                <input type="number" min="1" max={remaining} value={form.size === s.size ? form.quantity : ""} onChange={e => setForm(f => ({ ...f, size: s.size, quantity: e.target.value }))} placeholder={"Qty (max " + remaining + ")"} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input value={form.size === s.size ? form.notes : ""} onChange={e => setForm(f => ({ ...f, size: s.size, notes: e.target.value }))} placeholder="Note (optional)" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <button disabled={saving || form.size !== s.size || !form.masterId || !form.quantity || !production.shop} onClick={assignWithoutDesign} className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white">Assign</button>
              </div>}
            </div>;
          })}
        </div>
      </section>

      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
        <h4 className="font-semibold text-navy-900">Attach existing design</h4>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select value={selectedDesign} onChange={e => setSelectedDesign(e.target.value)} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Choose design from library…</option>
            {availableDesigns.map(d => <option key={d.id} value={d.id}>{d.designNo} · {d.name}</option>)}
          </select>
          <button disabled={!selectedDesign || saving} onClick={addDesign} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white">Attach design</button>
        </div>
      </section>

      {!production.designs.length && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No design is attached to this order yet. You can attach an existing design above or add a customer-specific design from the order page.</div>}
      {!production.shop && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Assign a stitching shop to this order before assigning a master.</div>}
      {["DELIVERED","CANCELLED"].includes(production.status) && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">This order is completed/closed. Its master assignments are kept as completed history and are no longer shown as current work.</div>}
    </>}
  </div>;
}

function DesignAssignmentCard({ od, production, masters, form, setForm, saving, editing, editForm, setEditForm, onAssign, onEdit, onSaveEdit, onStart, onComplete, onRemove, onCancelEdit }: any) {
  return <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
    <div className="flex items-start gap-4">
      {od.imagePath || od.design?.imagePath ? <img src={od.imagePath || od.design?.imagePath} alt="" className="h-20 w-20 rounded-lg object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-300">SP</div>}
      <div><p className="text-xs text-slate-500">{od.design?.designNo ?? "Customer design"}</p><h4 className="font-semibold text-navy-900">{od.design?.name ?? od.designName ?? "Customer design"}</h4><p className="text-sm text-slate-600">{od.design?.description || "Design attached to this order"}</p></div>
    </div>

    <div className="mt-5 space-y-4">
      {production.sizeBreakdowns.map((s: any) => {
        const rows = od.assignments.filter((a: any) => a.size === s.size);
        const assigned = (production.masterAssignments ?? []).filter((a: any) => a.size === s.size).reduce((n: number, a: any) => n + a.quantity, 0);
        const remaining = s.quantity - assigned;
        return <div key={s.id} className="rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><span className="font-semibold">{s.size}</span><span className="ml-2 text-sm text-slate-500">{s.quantity} required</span></div><span className={"rounded-full px-2.5 py-1 text-xs font-medium " + (remaining === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{assigned} assigned · {remaining} remaining</span></div>

          {rows.length > 0 && <div className="mt-3 space-y-2">{rows.map((a: any) => editing === a.id ? <div key={a.id} className="grid gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-4">
            <select value={editForm.masterId} disabled={!!a.startedAt} onChange={e => setEditForm((f: any) => ({ ...f, masterId: e.target.value }))} className="rounded-md border border-slate-300 px-3 py-2 text-sm">{masters.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
            <input type="number" min="1" value={editForm.quantity} onChange={e => setEditForm((f: any) => ({ ...f, quantity: e.target.value }))} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input value={editForm.notes} onChange={e => setEditForm((f: any) => ({ ...f, notes: e.target.value }))} placeholder="Note" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <div className="flex gap-2"><button disabled={saving} onClick={() => onSaveEdit(a.id)} className="rounded-md bg-navy-900 px-3 py-2 text-xs text-white">Save</button><button onClick={onCancelEdit} className="rounded-md border px-3 py-2 text-xs">Cancel</button></div>
          </div> : <div key={a.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><span className="font-medium">{a.master.name}</span><span className="ml-2 text-slate-500">{a.quantity} pcs</span></div><div className="flex gap-3"><button onClick={() => onEdit(a)} disabled={!!a.completedAt} className="text-xs font-medium text-navy-900 disabled:opacity-40">Edit</button>{!a.startedAt && !a.completedAt && <button onClick={() => onStart(a.id)} disabled={saving} className="text-xs font-medium text-emerald-700">Start</button>}{a.startedAt && !a.completedAt && <button onClick={() => onComplete(a.id)} className="text-xs font-medium text-emerald-700">Done</button>}{!a.startedAt && !a.completedAt && <button onClick={() => onRemove(a.id)} className="text-xs font-medium text-red-700">Remove</button>}</div></div>
            <p className="mt-1 text-[11px] text-slate-500">{a.completedAt ? "Completed" : a.startedAt ? "Currently working — master is locked" : "Assigned, not started"}{a.notes ? " · " + a.notes : ""}</p>
          </div>)}</div>}

          {remaining > 0 && !["DELIVERED","CANCELLED"].includes(production.status) && <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <select value={form.size === s.size ? form.masterId : ""} onChange={e => setForm((f: any) => ({ ...f, size: s.size, masterId: e.target.value }))} className="rounded-md border border-slate-300 px-3 py-2 text-sm"><option value="">Master…</option>{masters.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
            <input type="number" min="1" max={remaining} value={form.size === s.size ? form.quantity : ""} onChange={e => setForm((f: any) => ({ ...f, size: s.size, quantity: e.target.value }))} placeholder={"Qty (max " + remaining + ")"} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input value={form.size === s.size ? form.notes : ""} onChange={e => setForm((f: any) => ({ ...f, size: s.size, notes: e.target.value }))} placeholder="Note (optional)" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <button disabled={saving || form.size !== s.size || !form.masterId || !form.quantity} onClick={() => onAssign(od.id)} className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white">Assign</button>
          </div>}
        </div>;
      })}
    </div>
  </section>;
}
