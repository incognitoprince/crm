import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createOrder, getCustomers, getShops, uploadOrderReferenceImage } from "../services/api";
import type { Customer, GarmentType, Shop } from "../types";

const garments: GarmentType[] = ["THOBE", "SHIRT", "TROUSER", "SUIT", "OTHER"];
const defaultSizes = ["XS", "S", "M", "L", "XL", "XXL"];

export function NewOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [customerId, setCustomerId] = useState(searchParams.get("customerId") ?? "");
  const [shopId, setShopId] = useState("");
  const [garment, setGarment] = useState<GarmentType>("THOBE");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [total, setTotal] = useState("");
  const [paid, setPaid] = useState("0");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [sizeBreakdowns, setSizeBreakdowns] = useState<Record<string, string>>(Object.fromEntries(defaultSizes.map(s => [s, ""])));
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getCustomers(), getShops()]).then(([c, s]) => {
      setCustomers(c.data); setShops(s.data);
      const selected = c.data.find(customer => customer.id === searchParams.get("customerId")) ?? c.data[0];
      if (selected) { setCustomerId(selected.id); if (selected.shop?.id) setShopId(selected.shop.id); }
      if (s.data[0] && !selected?.shop?.id) setShopId(s.data[0].id);
    }).catch(e => setError(e instanceof Error ? e.message : "Unable to load order form"));
  }, [searchParams]);

  const breakdown = defaultSizes.map(size => ({ size, quantity: Number(sizeBreakdowns[size] || 0) })).filter(item => item.quantity > 0);
  const breakdownTotal = breakdown.reduce((sum, item) => sum + item.quantity, 0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (breakdown.length && breakdownTotal !== Number(quantity)) { setError("Size quantities must equal total quantity."); return; }
    try {
      const order = await createOrder({
        customerId, shopId: shopId || null, garment, description, quantity: Number(quantity),
        totalAmountFils: Math.round(Number(total) * 1000), paidAmountFils: Math.round(Number(paid) * 1000),
        deliveryDate: deliveryDate ? new Date(deliveryDate + "T00:00:00").toISOString() : null, notes: notes || null,
        sizeBreakdowns: breakdown,
      });
      if (referenceImage) await uploadOrderReferenceImage(order.data.id, referenceImage);
      navigate("/orders/" + order.data.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create order"); }
  }

  return <div className="mx-auto max-w-4xl space-y-5">
    <button onClick={() => navigate("/orders")} className="text-sm text-slate-500 hover:underline">← Back to orders</button>
    <div><h3 className="text-2xl font-semibold text-navy-900">New order</h3><p className="text-sm text-slate-600">Capture the customer's reference image, size quantities and production assignment.</p></div>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <form onSubmit={submit} className="space-y-5 rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Customer<select required value={customerId} onChange={e => setCustomerId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">{customers.map(c => <option key={c.id} value={c.id}>{c.name} · {c.customerNo}</option>)}</select></label>
        <label className="text-sm">Stitching shop<select value={shopId} onChange={e => setShopId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="">Unassigned</option>{shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="text-sm">Garment<select value={garment} onChange={e => setGarment(e.target.value as GarmentType)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">{garments.map(g => <option key={g} value={g}>{g}</option>)}</select></label>
        <label className="text-sm">Total pieces<input required min="1" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
        <label className="text-sm sm:col-span-2">Order description<input required value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Customer reference image - formal thobe" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
      </div>

      <section className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-semibold text-navy-900">Size breakdown</h4>
        <p className="mt-1 text-xs text-slate-500">Example: 4 pieces XL + 3 pieces M = 7 total pieces.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {defaultSizes.map(size => <label key={size} className="text-xs font-medium text-slate-600">{size}<input type="number" min="0" value={sizeBreakdowns[size]} onChange={e => setSizeBreakdowns(v => ({...v, [size]: e.target.value}))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>)}
        </div>
        <p className={"mt-3 text-sm " + (breakdownTotal === Number(quantity) ? "text-emerald-700" : "text-amber-700")}>Breakdown total: {breakdownTotal} / {quantity || 0} pieces</p>
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <h4 className="font-semibold text-navy-900">Customer reference image</h4>
        <p className="mt-1 text-xs text-slate-500">This image will stay attached to the order and be shown in production/order details.</p>
        <input required type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setReferenceImage(e.target.files?.[0] ?? null)} className="mt-3 w-full text-sm" />
        {referenceImage && <p className="mt-2 text-xs text-slate-600">{referenceImage.name}</p>}
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm">Total amount (KWD)<input required min="0" step="0.001" type="number" value={total} onChange={e => setTotal(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
        <label className="text-sm">Paid amount (KWD)<input min="0" step="0.001" type="number" value={paid} onChange={e => setPaid(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
        <label className="text-sm">Delivery date<input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
        <label className="text-sm sm:col-span-3">Notes<textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
      </div>
      <div className="flex justify-end gap-3"><button type="button" onClick={() => navigate("/orders")} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button><button className="rounded-md bg-navy-900 px-5 py-2 text-sm font-medium text-white">Create order</button></div>
    </form>
  </div>;
}
