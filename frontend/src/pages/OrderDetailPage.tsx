import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import {
  createOrderDesign,
  deleteOrderDesign,
  getDesigns,
  getOrder,
  getShops,
  getGarments,
  updateOrderDesign,
  updateOrderStatus,
  updateOrder,
} from "../services/api";
import type { Design, Order, OrderStatus, Shop, Garment } from "../types";

const statuses: OrderStatus[] = ["PENDING","MEASUREMENT","CUTTING","STITCHING","QUALITY_CHECK","READY","DELIVERED","CANCELLED"];
const label = (v: string) => v.replaceAll("_", " ");
const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);

export function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [editingDesignId, setEditingDesignId] = useState<string | "new" | null>(null);
  const [designSource, setDesignSource] = useState<"existing" | "upload">("existing");
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [designImage, setDesignImage] = useState<File | null>(null);
  const [designSaving, setDesignSaving] = useState(false);
  const [designError, setDesignError] = useState("");
  const [error, setError] = useState("");
  const [editingOrder, setEditingOrder] = useState(false);
  const [orderDateDraft, setOrderDateDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [deliveryDateDraft, setDeliveryDateDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [orderSaving, setOrderSaving] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [shopIdDraft, setShopIdDraft] = useState("");
  const [garmentDraft, setGarmentDraft] = useState("");
  const [sizeRowsDraft, setSizeRowsDraft] = useState<Array<{ id: string; size: string; quantity: string }>>([]);

  async function loadOrder() {
    if (!id) return;
    const result = await getOrder(id);
    setOrder(result.data);
  }

  useEffect(() => {
    if (id) loadOrder().catch(e => setError(e instanceof Error ? e.message : "Unable to load order"));
    Promise.all([getShops(), getGarments()]).then(([shopResult, garmentResult]) => {
      setShops(shopResult.data);
      setGarments(garmentResult.data);
    }).catch(e => setError(e instanceof Error ? e.message : "Unable to load order edit options"));
  }, [id]);

  function beginOrderEdit() {
    if (!order) return;
    setOrderDateDraft(new Date(order.orderDate).toISOString().slice(0,16));
    setDescriptionDraft(order.description || "");
    setDeliveryDateDraft(order.deliveryDate ? new Date(order.deliveryDate).toISOString().slice(0,10) : "");
    setNotesDraft(order.notes || "");
    setShopIdDraft(order.shop?.id ?? "");
    setGarmentDraft(order.garmentMaster?.name ?? order.garment);
    setSizeRowsDraft(order.sizeBreakdowns.map(row => ({ id: row.id, size: row.size, quantity: String(row.quantity) })));
    setEditingOrder(true);
  }

  async function saveOrderEdit() {
    if (!order) return;
    setOrderSaving(true); setError("");
    try {
      const sizeBreakdowns = sizeRowsDraft.filter(row => row.size && Number(row.quantity) > 0).map(row => ({ size: row.size, quantity: Number(row.quantity) }));
      const quantity = sizeBreakdowns.reduce((sum, row) => sum + row.quantity, 0);
      if (!quantity) throw new Error("Add at least one size with a quantity.");
      if (hasSizeAssignments) {
        const assigned: Record<string, number> = {};
        for (const assignment of [...(order.masterAssignments ?? []), ...order.designs.flatMap(item => item.assignments ?? [])]) {
          assigned[assignment.size] = (assigned[assignment.size] ?? 0) + assignment.quantity;
        }
        for (const [size, assignedQty] of Object.entries(assigned)) {
          const requestedQty = sizeBreakdowns.find(row => row.size === size)?.quantity ?? 0;
          if (requestedQty < assignedQty) throw new Error(`Size ${size} must remain at least ${assignedQty} because that quantity is already assigned to masters.`);
        }
      }
      const result = await updateOrder(order.id, { shopId: shopIdDraft || null, garment: garmentDraft as Order["garment"], quantity, sizeBreakdowns, orderDate: new Date(orderDateDraft).toISOString(), description: descriptionDraft, deliveryDate: deliveryDateDraft ? new Date(deliveryDateDraft + "T00:00:00").toISOString() : null, notes: notesDraft });
      setOrder(result.data); setEditingOrder(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to edit order"); }
    finally { setOrderSaving(false); }
  }

  async function change(status: OrderStatus) {
    if (!order) return;
    try { setOrder((await updateOrderStatus(order.id, status)).data); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to update order"); }
  }

  async function openDesignEditor(orderDesignId: string | null, currentDesignId?: string | null) {
    setDesignError("");
    setDesignImage(null);
    setEditingDesignId(orderDesignId ?? "new");
    setSelectedDesignId(currentDesignId ?? "");
    setDesignSource(currentDesignId ? "existing" : "upload");
    if (order) {
      try {
        const result = await getDesigns(order.garment);
        setDesigns(result.data);
      } catch (e) {
        setDesignError(e instanceof Error ? e.message : "Unable to load Design Library");
      }
    }
  }

  function closeDesignEditor() {
    setEditingDesignId(null);
    setDesignImage(null);
    setDesignError("");
  }

  async function saveDesign() {
    if (!order) return;
    setDesignError("");
    if (designSource === "existing" && !selectedDesignId) {
      setDesignError("Select a Design Library design.");
      return;
    }
    if (designSource === "upload" && !designImage) {
      setDesignError("Choose an image to upload.");
      return;
    }

    setDesignSaving(true);
    try {
      if (editingDesignId && editingDesignId !== "new") {
        await updateOrderDesign(order.id, editingDesignId, {
          designId: designSource === "existing" ? selectedDesignId : undefined,
          file: designSource === "upload" ? designImage ?? undefined : undefined,
        });
      } else {
        await createOrderDesign(order.id, {
          designId: designSource === "existing" ? selectedDesignId : undefined,
          file: designSource === "upload" ? designImage ?? undefined : undefined,
        });
      }
      await loadOrder();
      closeDesignEditor();
    } catch (e) {
      setDesignError(e instanceof Error ? e.message : "Unable to save design");
    } finally {
      setDesignSaving(false);
    }
  }

  async function removeDesign(orderDesignId: string) {
    if (!order) return;
    if (!window.confirm("Remove this design from the order?")) return;
    setDesignError("");
    try {
      await deleteOrderDesign(order.id, orderDesignId);
      await loadOrder();
    } catch (e) {
      setDesignError(e instanceof Error ? e.message : "Unable to remove design");
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!order) return <LoadingState label="Loading order…" />;
   const balance = order.totalAmountFils - order.paidAmountFils;
  const editingDesign = typeof editingDesignId === "string" && editingDesignId !== "new" ? order.designs.find(d => d.id === editingDesignId) : undefined;
  const editingLocked = !!editingDesign?.assignments?.length;
  const hasSizeAssignments = (order.masterAssignments?.length ?? 0) > 0 || order.designs.some(item => item.assignments?.length);

  return <div className="mx-auto max-w-5xl space-y-5">
    <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs text-slate-500">{order.orderNo}</p><h3 className="mt-1 text-2xl font-semibold text-navy-900">{order.customer.name}</h3><p className="mt-1 text-sm text-slate-600">{order.description || "No order description"}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={beginOrderEdit} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium">Edit order</button>
          <button type="button" onClick={() => openDesignEditor(null)} className="rounded-md bg-navy-900 px-3 py-2 text-sm font-medium text-white">+ Add</button>
          <Link to={"/production?orderId=" + order.id} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium">Manage masters</Link>
          <select value={order.status} onChange={e => change(e.target.value as OrderStatus)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">{statuses.map(s => <option key={s} value={s}>{label(s)}</option>)}</select>
          <Link to="/orders" className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white">Done</Link>
        </div>
      </div>
    </section>

    {editingOrder && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="font-semibold text-navy-900">Edit order details</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Stitching shop<select value={shopIdDraft} onChange={e => setShopIdDraft(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="">Unassigned</option>{shops.map(shop => <option key={shop.id} value={shop.id}>{shop.name}</option>)}</select></label>
        <label className="text-sm">Garment<select value={garmentDraft} onChange={e => setGarmentDraft(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">{garments.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
        <label className="text-sm">Order date & time<input type="datetime-local" value={orderDateDraft} onChange={e => setOrderDateDraft(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"/></label>
        <label className="text-sm">Delivery date<input type="date" value={deliveryDateDraft} onChange={e => setDeliveryDateDraft(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"/></label>
        <label className="text-sm sm:col-span-2">Description<input value={descriptionDraft} onChange={e => setDescriptionDraft(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"/></label>
        <label className="text-sm sm:col-span-2">Notes<textarea value={notesDraft} onChange={e => setNotesDraft(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"/></label>
      </div>
      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-2"><div><h5 className="text-sm font-semibold">Size quantities</h5><p className="text-xs text-slate-500">Total is recalculated from these rows.</p></div><button type="button" onClick={() => setSizeRowsDraft(rows => [...rows, { id: String(Date.now()), size: "", quantity: "" }])} className="rounded-md border border-slate-300 px-3 py-2 text-xs disabled:opacity-40">+ Add size</button></div>
        {hasSizeAssignments && <p className="mt-2 text-xs text-amber-700">You can edit sizes. Quantities already assigned to masters must remain covered.</p>}
        <div className="mt-3 space-y-2">{sizeRowsDraft.map(row => <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <input aria-label="Size" value={row.size} onChange={e => setSizeRowsDraft(rows => rows.map(item => item.id === row.id ? { ...item, size: e.target.value } : item))} placeholder="Size (e.g. 1yr)" className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"/>
          <input aria-label="Quantity" type="number" min="1" value={row.quantity} onChange={e => setSizeRowsDraft(rows => rows.map(item => item.id === row.id ? { ...item, quantity: e.target.value } : item))} className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"/>
          <button type="button" disabled={sizeRowsDraft.length === 1} onClick={() => setSizeRowsDraft(rows => rows.filter(item => item.id !== row.id))} className="rounded-md border border-red-200 px-2 py-2 text-xs text-red-700 disabled:opacity-40">Remove</button>
        </div>)}</div>
        <p className="mt-2 text-sm font-medium text-emerald-700">Total quantity: {sizeRowsDraft.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)}</p>
      </div>
      <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setEditingOrder(false)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">Cancel</button><button type="button" disabled={orderSaving || !orderDateDraft} onClick={() => void saveOrderEdit()} className="rounded-md bg-navy-900 px-4 py-2 text-sm text-white">{orderSaving ? "Saving…" : "Save changes"}</button></div>
    </section>}

    <div className="grid gap-5 lg:grid-cols-3">
      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h4 className="font-semibold text-navy-900">Design</h4><p className="mt-1 text-xs text-slate-500">Optional. Attach a reusable Design Library design or a customer-supplied image at any time.</p></div>
          {!editingDesignId && <button onClick={() => openDesignEditor(null)} className="text-sm font-medium text-navy-900 hover:underline">+ Add design</button>}
        </div>

        {designError && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{designError}</p>}

        {editingDesignId !== null && <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div><h5 className="font-semibold text-navy-900">{editingDesign ? "Edit order design" : "Add order design"}</h5><p className="mt-1 text-xs text-slate-500">Choose an existing design or upload a customer image.</p></div>
            <button type="button" onClick={closeDesignEditor} className="text-sm text-slate-500 hover:underline">Cancel</button>
          </div>

          {editingLocked ? <p className="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-800">This design is locked because master work has already been assigned to it. Remove the master assignments before changing or removing the design.</p> : <>
            <div className="mt-3 flex rounded-md border border-slate-200 bg-white p-1 text-xs w-fit">
              <button type="button" onClick={() => setDesignSource("existing")} className={"rounded px-3 py-1.5 " + (designSource === "existing" ? "bg-navy-900 text-white" : "text-slate-600")}>Existing design</button>
              <button type="button" onClick={() => setDesignSource("upload")} className={"rounded px-3 py-1.5 " + (designSource === "upload" ? "bg-navy-900 text-white" : "text-slate-600")}>Upload image</button>
            </div>

            {designSource === "existing" ? <div className="mt-3">
              <select value={selectedDesignId} onChange={e => setSelectedDesignId(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">Choose from Design Library…</option>
                {designs.map(d => <option key={d.id} value={d.id}>{d.designNo} · {d.name}</option>)}
              </select>
              {!designs.length && <p className="mt-2 text-xs text-amber-700">No reusable designs for this garment yet. You can upload the customer's image instead.</p>}
            </div> : <div className="mt-3">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setDesignImage(e.target.files?.[0] ?? null)} className="w-full rounded-md bg-white text-sm" />
              {designImage && <p className="mt-2 text-xs text-slate-600">{designImage.name}</p>}
            </div>}

            <div className="mt-4 flex justify-end gap-2">
              {editingDesign && <button type="button" onClick={() => removeDesign(editingDesign.id)} className="mr-auto rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700">Remove design</button>}
              <button type="button" onClick={closeDesignEditor} className="rounded-md border border-slate-300 px-3 py-2 text-sm">Cancel</button>
              <button type="button" disabled={designSaving} onClick={saveDesign} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white">{designSaving ? "Saving…" : "Save design"}</button>
            </div>
          </>}
        </div>}

        {order.designs.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{order.designs.map(design => <figure key={design.id} className="overflow-hidden rounded-lg border border-slate-200">
          {design.imagePath || design.design?.imagePath ? <img src={design.imagePath || design.design?.imagePath || ""} alt={design.design?.name ?? design.designName ?? "Customer design"} className="max-h-96 w-full object-contain bg-slate-50" /> : <div className="flex h-64 items-center justify-center bg-slate-50 text-sm text-slate-400">No image uploaded</div>}
          <figcaption className="p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-slate-800">{design.design?.name ?? design.designName ?? "Customer design"}</p><p className="text-xs text-slate-500">{design.design?.designNo ?? "Order-specific design"}</p></div><button onClick={() => openDesignEditor(design.id, design.designId)} className="text-xs font-medium text-navy-900 hover:underline">Edit</button></div></figcaption>
        </figure>)}</div> : !editingDesignId && <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-500">No design attached. You can add one now or later.</p>}
      </section>

      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Stitching shop</p><p className="mt-1 text-xl font-semibold text-navy-900">{order.shop?.name ?? "Unassigned"}</p><p className="mt-1 text-sm text-slate-600">{order.shop?.area ?? ""}</p><p className="mt-5 text-xs text-slate-500">Production status</p><p className="mt-1 font-medium">{label(order.status)}</p></section>
    </div>

    <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3"><h4 className="font-semibold text-navy-900">Production quantity</h4><Link to={"/production?orderId=" + order.id} className="text-sm font-medium text-navy-900 hover:underline">Assign / edit master work →</Link></div>
      <div className="mt-4 flex flex-wrap gap-3">{order.sizeBreakdowns.length ? order.sizeBreakdowns.map(item => <div key={item.id} className="rounded-lg bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">Size</p><p className="text-lg font-semibold">{item.size}</p><p className="text-sm text-slate-600">{item.quantity} piece(s)</p></div>) : <p className="text-sm text-slate-500">No size breakdown recorded.</p>}</div>
      <p className="mt-4 text-sm font-medium text-slate-700">Total: {order.quantity} piece(s)</p>
    </section>

    <div className="grid gap-5 md:grid-cols-3">
      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Customer</p><Link to={"/customers/" + order.customer.id} className="mt-1 block font-semibold text-navy-900 hover:underline">{order.customer.name}</Link>{order.customer.phone?.trim() && order.customer.phone.trim().toLowerCase() !== "not provided" && <p className="text-sm text-slate-600">{order.customer.phone}</p>}</section>
      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Garment</p><p className="mt-1 font-semibold">{label(order.garmentMaster?.name ?? order.garment)}</p><p className="text-sm text-slate-600">{order.quantity} item(s)</p></section>
      <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Delivery</p><p className="mt-1 font-semibold">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "Not scheduled"}</p></section>
    </div>

    {user?.role === "ADMIN" &&     <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3"><h4 className="font-semibold text-navy-900">Payment</h4><div className="flex gap-2">{user?.role === "ADMIN" && <Link to={"/bills"} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-navy-900 hover:bg-slate-50">Create bill</Link>}</div></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Order value</p><p className="mt-1 text-lg font-semibold">{money(order.totalAmountFils)}</p></div><div><p className="text-xs text-slate-500">Paid</p><p className="mt-1 text-lg font-semibold">{money(order.paidAmountFils)}</p></div><div><p className="text-xs text-slate-500">Balance</p><p className={"mt-1 text-lg font-semibold " + (balance > 0 ? "text-rose-700" : "text-emerald-700")}>{money(balance)}</p></div></div>
      {order.payments?.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium">Method</th><th className="pb-2 font-medium">Reference</th><th className="pb-2 text-right font-medium">Amount</th></tr></thead><tbody>{order.payments.map(payment => <tr key={payment.id} className="border-b border-slate-50 last:border-0"><td className="py-2.5">{new Date(payment.receivedAt).toLocaleDateString()}</td><td className="py-2.5">{payment.method.replace("_", " ")}</td><td className="py-2.5 text-slate-500">{payment.reference || "—"}</td><td className="py-2.5 text-right font-semibold">{money(payment.amountFils)}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-xs text-slate-500">No payment transactions recorded yet.</p>}
    </section>
}    <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm"><h4 className="font-semibold text-navy-900">Notes</h4><p className="mt-3 text-sm text-slate-600">{order.notes || "No notes added."}</p></section>
  </div>;
}
