import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createGarment,
  createMasterAssignment,
  createOrderAssignment,
  createOrder,
  createOrderDesign,
  getCustomers,
  getDesigns,
  getGarments,
  getMasters,
  getShops,
} from "../services/api";
import type { Customer, Design, Garment, GarmentType, Master, Shop, PaymentMethod } from "../types";

const defaultSizes = ["XS", "S", "M", "L", "XL", "XXL"];

type AssignmentDraft = { id: number; size: string; masterId: string; quantity: string; notes: string };

export function NewOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [customerId, setCustomerId] = useState(searchParams.get("customerId") ?? "");
  const [shopId, setShopId] = useState("");
  const [garment, setGarment] = useState<GarmentType>("");
  const [showGarmentForm, setShowGarmentForm] = useState(false);
  const [newGarmentName, setNewGarmentName] = useState("");
  const [description, setDescription] = useState("");
  const [total, setTotal] = useState("");
  const [paid, setPaid] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [sizeBreakdowns, setSizeBreakdowns] = useState<Record<string, string>>(
    Object.fromEntries(defaultSizes.map(s => [s, ""]))
  );
  const [designSource, setDesignSource] = useState<"existing" | "upload">("existing");
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [designImage, setDesignImage] = useState<File | null>(null);
  const [assignments, setAssignments] = useState<AssignmentDraft[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getCustomers(), getShops(), getGarments()]).then(([c, s, g]) => {
      setCustomers(c.data);
      setShops(s.data);
      setGarments(g.data);
      const selected = c.data.find(customer => customer.id === searchParams.get("customerId")) ?? c.data[0];
      if (selected) {
        setCustomerId(selected.id);
        if (selected.shop?.id) setShopId(selected.shop.id);
      }
      if (s.data[0] && !selected?.shop?.id) setShopId(s.data[0].id);
    }).catch(e => setError(e instanceof Error ? e.message : "Unable to load order form"));
  }, [searchParams]);

  useEffect(() => {
    if (!garment) return;
    getDesigns(garment).then(r => {
      setDesigns(r.data);
      if (!r.data.some(d => d.id === selectedDesignId)) setSelectedDesignId(r.data[0]?.id ?? "");
    }).catch(e => setError(e instanceof Error ? e.message : "Unable to load designs"));
  }, [garment]);

  useEffect(() => {
    if (!shopId) {
      setMasters([]);
      return;
    }
    getMasters(shopId).then(r => setMasters(r.data)).catch(e => setError(e instanceof Error ? e.message : "Unable to load masters"));
  }, [shopId]);

  const breakdown = useMemo(() => defaultSizes
    .map(size => ({ size, quantity: Number(sizeBreakdowns[size] || 0) }))
    .filter(item => item.quantity > 0), [sizeBreakdowns]);
  const breakdownTotal = breakdown.reduce((sum, item) => sum + item.quantity, 0);

  function updateSize(size: string, value: string) {
    if (value === "" || /^\d+$/.test(value)) {
      setSizeBreakdowns(current => ({ ...current, [size]: value }));
    }
  }

  async function addGarment() {
    const name = newGarmentName.trim();
    if (!name) return;
    setError("");
    try {
      const result = await createGarment({ name });
      setGarments(current => [...current, result.data].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
      setGarment("");
      setNewGarmentName("");
      setShowGarmentForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to add garment");
    }
  }

  function addAssignment() {
    setAssignments(current => [...current, { id: Date.now(), size: breakdown[0]?.size ?? "M", masterId: "", quantity: "", notes: "" }]);
  }

  function updateAssignment(id: number, patch: Partial<AssignmentDraft>) {
    setAssignments(current => current.map(row => row.id === id ? { ...row, ...patch } : row));
  }

  function removeAssignment(id: number) {
    setAssignments(current => current.filter(row => row.id !== id));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!customerId || !garment) {
      setError("Customer and garment are required.");
      return;
    }
    if (breakdownTotal < 1) {
      setError("Add at least one piece in the size breakdown.");
      return;
    }
    // Design is optional. The owner can create the order first and attach a design later.

    const assignmentTotals: Record<string, number> = {};
    for (const row of assignments) {
      const qty = Number(row.quantity);
      if (!row.masterId || !row.size || qty < 1) {
        setError("Complete every optional master assignment row or remove it.");
        return;
      }
      assignmentTotals[row.size] = (assignmentTotals[row.size] ?? 0) + qty;
      const required = breakdown.find(item => item.size === row.size)?.quantity ?? 0;
      if (assignmentTotals[row.size] > required) {
        setError(row.size + " assignments exceed the order quantity for that size.");
        return;
      }
    }

    if (assignments.length && !shopId) {
      setError("A stitching shop is required when assigning a master during order creation.");
      return;
    }

    setSaving(true);
    try {
      const order = await createOrder({
        customerId,
        shopId: shopId || null,
        garment,
        description,
        quantity: breakdownTotal,
        totalAmountFils: Math.round(Number(total) * 1000),
        paidAmountFils: Math.round(Number(paid) * 1000),
        paymentMethod,
        deliveryDate: deliveryDate ? new Date(deliveryDate + "T00:00:00").toISOString() : null,
        notes: notes || null,
        sizeBreakdowns: breakdown,
      });

      let orderDesignId: string | null = null;
      const hasDesign = (designSource === "existing" && !!selectedDesignId) || (designSource === "upload" && !!designImage);
      if (hasDesign) {
        const orderDesign = await createOrderDesign(order.data.id, {
          designId: designSource === "existing" ? selectedDesignId : undefined,
          file: designSource === "upload" ? designImage ?? undefined : undefined,
        });
        orderDesignId = orderDesign.data.id;
      }

      if (assignments.length) {
        for (const row of assignments) {
          const data = {
            masterId: row.masterId,
            size: row.size,
            quantity: Number(row.quantity),
            notes: row.notes || undefined,
          };
          if (orderDesignId) {
            await createMasterAssignment(orderDesignId, data);
          } else {
            await createOrderAssignment(order.data.id, data);
          }
        }
      }

      navigate("/orders/" + order.data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create order");
    } finally {
      setSaving(false);
    }
  }

  return <div className="mx-auto max-w-5xl space-y-5">
    <button onClick={() => navigate("/orders")} className="text-sm text-slate-500 hover:underline">← Back to orders</button>
    <div>
      <h3 className="text-2xl font-semibold text-navy-900">New order</h3>
      <p className="text-sm text-slate-600">Create the order, attach the customer's design, and optionally assign master work now.</p>
    </div>

    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

    <form onSubmit={submit} className="space-y-5 rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Customer
          <select required value={customerId} onChange={e => setCustomerId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
            <option value="">Choose customer…</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} · {c.customerNo}</option>)}
          </select>
        </label>

        <label className="text-sm">
          Stitching shop
          <select value={shopId} onChange={e => setShopId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
            <option value="">Unassigned</option>
            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>

        <div className="text-sm sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <span>Garment</span>
            <button type="button" onClick={() => setShowGarmentForm(v => !v)} className="text-xs font-medium text-navy-900 hover:underline">+ Add garment</button>
          </div>
          <select value={garment} onChange={e => setGarment(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
            <option value="">Choose garment…</option>
            {garments.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
          {showGarmentForm && <div className="mt-2 flex gap-2 rounded-lg bg-slate-50 p-3">
            <input autoFocus value={newGarmentName} onChange={e => setNewGarmentName(e.target.value)} placeholder="New garment name" className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <button type="button" onClick={addGarment} className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white">Add</button>
          </div>}
        </div>

        <label className="text-sm">
          Total Quantity
          <input readOnly type="number" value={breakdownTotal} className="mt-1 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-medium text-slate-700" />
          <span className="mt-1 block text-xs text-slate-500">Automatically calculated from the size breakdown.</span>
        </label>

        <label className="text-sm">
          Order description
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Formal customer thobe (optional)" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
      </div>

      <section className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-semibold text-navy-900">Size breakdown</h4>
        <p className="mt-1 text-xs text-slate-500">Enter the quantity for each size. Total Quantity is calculated automatically.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {defaultSizes.map(size => <label key={size} className="text-xs font-medium text-slate-600">
            {size}
            <input type="number" min="0" step="1" value={sizeBreakdowns[size]} onChange={e => updateSize(size, e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>)}
        </div>
        <p className="mt-3 text-sm font-medium text-emerald-700">Total pieces: {breakdownTotal}</p>
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h4 className="font-semibold text-navy-900">Design image <span className="font-normal text-slate-500">(optional)</span></h4><p className="mt-1 text-xs text-slate-500">You can attach a reusable design, upload a customer image, or create the order without a design and add it later.</p></div>
          <div className="flex rounded-md border border-slate-200 p-1 text-xs">
            <button type="button" onClick={() => setDesignSource("existing")} className={"rounded px-3 py-1.5 " + (designSource === "existing" ? "bg-navy-900 text-white" : "text-slate-600")}>Existing design</button>
            <button type="button" onClick={() => setDesignSource("upload")} className={"rounded px-3 py-1.5 " + (designSource === "upload" ? "bg-navy-900 text-white" : "text-slate-600")}>Upload new</button>
          </div>
        </div>

        {designSource === "existing" ? <div className="mt-3">
          <select value={selectedDesignId} onChange={e => setSelectedDesignId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Choose a design from Design Library…</option>
            {designs.map(d => <option key={d.id} value={d.id}>{d.designNo} · {d.name}</option>)}
          </select>
          {!designs.length && <p className="mt-2 text-xs text-amber-700">No reusable designs for this garment yet. You can upload one later or leave the order without a design.</p>}
        </div> : <div className="mt-3">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setDesignImage(e.target.files?.[0] ?? null)} className="w-full text-sm" />
          {designImage && <p className="mt-2 text-xs text-slate-600">{designImage.name}</p>}
        </div>}
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h4 className="font-semibold text-navy-900">Assign master <span className="font-normal text-slate-500">(optional)</span></h4><p className="mt-1 text-xs text-slate-500">You can assign now, or leave it blank and assign later from Orders, Production, or Masters.</p></div>
          <button type="button" onClick={addAssignment} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium">+ Add assignment</button>
        </div>

        {assignments.length === 0 && <p className="mt-3 rounded-md bg-slate-50 p-3 text-xs text-slate-500">No master assigned yet. This is completely optional.</p>}

        <div className="mt-3 space-y-2">
          {assignments.map(row => <div key={row.id} className="grid gap-2 rounded-lg bg-slate-50 p-3 md:grid-cols-5">
            <select value={row.size} onChange={e => updateAssignment(row.id, { size: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              {breakdown.map(s => <option key={s.size} value={s.size}>{s.size}</option>)}
            </select>
            <select value={row.masterId} onChange={e => updateAssignment(row.id, { masterId: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Choose master…</option>
              {masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input type="number" min="1" value={row.quantity} onChange={e => updateAssignment(row.id, { quantity: e.target.value })} placeholder="Qty" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input value={row.notes} onChange={e => updateAssignment(row.id, { notes: e.target.value })} placeholder="Note (optional)" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <button type="button" onClick={() => removeAssignment(row.id)} className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700">Remove</button>
          </div>)}
        </div>
        {assignments.length > 0 && !shopId && <p className="mt-2 text-xs text-amber-700">Select a stitching shop to load masters.</p>}
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm">Total amount (KWD)<input required min="0" step="0.001" type="number" value={total} onChange={e => setTotal(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
        <label className="text-sm">Paid amount (KWD)<input min="0" step="0.001" type="number" value={paid} onChange={e => setPaid(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
        <label className="text-sm">Payment method<select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} disabled={Number(paid) <= 0} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50">{[["CASH","Cash"],["CARD","Card"],["BANK_TRANSFER","Bank transfer"],["OTHER","Other"]].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-sm">Delivery date<input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
        <label className="text-sm sm:col-span-3">Notes<textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => navigate("/orders")} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
        <button disabled={saving} className="rounded-md bg-navy-900 px-5 py-2 text-sm font-medium text-white">{saving ? "Saving…" : "Save Order & Done"}</button>
      </div>
    </form>
  </div>;
}
