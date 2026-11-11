import { useEffect, useState, type FormEvent } from "react";
import { createDesign, getCustomers, getDesigns, getGarments, updateDesign, uploadDesignImage } from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import type { Customer, Design, Garment } from "../types";

export function DesignsPage() {
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [designs,setDesigns]=useState<Design[]>([]);
  const [garments,setGarments]=useState<Garment[]>([]);
  const [selectedCustomer,setSelectedCustomer]=useState<Customer|null>(null);
  const [showAdd,setShowAdd]=useState(false);
  const [editingDesign,setEditingDesign]=useState<Design|null>(null);
  const [designNo,setDesignNo]=useState("");
  const [name,setName]=useState("");
  const [garment,setGarment]=useState("");
  const [description,setDescription]=useState("");
  const [image,setImage]=useState<File|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);

  async function load() {
    setError("");
    try {
      const [c,d,g]=await Promise.all([getCustomers(),getDesigns(),getGarments()]);
      setCustomers(c.data);setDesigns(d.data);setGarments(g.data);
      if(selectedCustomer) setSelectedCustomer(c.data.find(item=>item.id===selectedCustomer.id)??null);
    } catch(e) { setError(e instanceof Error?e.message:"Unable to load Design Library"); }
    finally { setLoading(false); }
  }
  useEffect(()=>{void load();},[]);

  function resetForm() {
    setDesignNo("");setName("");setGarment("");setDescription("");setImage(null);setError("");setEditingDesign(null);
  }
  function openAdd() {
    resetForm();setShowAdd(true);
  }
  function openEdit(design: Design) {
    setDesignNo(design.designNo);setName(design.name);setGarment(design.garmentMaster?.name ?? design.garment);setDescription(design.description ?? "");setImage(null);setError("");setEditingDesign(design);setShowAdd(true);
  }
  function closeForm() {
    setShowAdd(false);setEditingDesign(null);
  }
  async function submit(e:FormEvent) {
    e.preventDefault();
    if(!selectedCustomer) return;
    if(!garment) {setError("Choose a garment.");return;}
    setSaving(true);setError("");
    try {
      const payload={designNo,name,garment,customerId:selectedCustomer.id,description:description||undefined};
      const saved=editingDesign?await updateDesign(editingDesign.id,payload):await createDesign(payload);
      if(image) await uploadDesignImage(saved.data.id,image);
      setShowAdd(false);await load();
    } catch(e) {setError(e instanceof Error?e.message:"Unable to save design");}
    finally {setSaving(false);}
  }

  if(loading)return <LoadingState label="Loading customers…"/>;
  const customerDesigns=selectedCustomer?designs.filter(item=>item.customerId===selectedCustomer.id):[];
  return <div className="mx-auto max-w-6xl space-y-5">
    <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Library</p><h3 className="text-2xl font-semibold text-navy-900">Design Library</h3><p className="mt-1 text-sm text-slate-600">Choose a customer to view their saved designs and images.</p></div>
    {error&&<ErrorState message={error}/>}
    {!selectedCustomer ? <section className="space-y-3">
      <h4 className="font-semibold text-navy-900">Customers</h4>
      {!customers.length?<p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">No customers found.</p>:<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{customers.map(customer=><button key={customer.id} type="button" onClick={()=>setSelectedCustomer(customer)} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"><p className="font-semibold text-navy-900">{customer.name}</p><p className="mt-1 text-xs text-slate-500">{customer.customerNo}{customer.phone?" · "+customer.phone:""}</p><p className="mt-3 text-sm text-blue-700">View designs →</p></button>)}</div>}
    </section> : <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"><div><button type="button" onClick={()=>{setSelectedCustomer(null);closeForm();}} className="text-sm text-blue-700 hover:underline">← All customers</button><h4 className="mt-1 text-xl font-semibold text-navy-900">{selectedCustomer.name}</h4><p className="text-xs text-slate-500">{customerDesigns.length} design(s)</p></div><button type="button" onClick={openAdd} className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white">+ Add design</button></div>
      {showAdd&&<form onSubmit={submit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2"><h4 className="font-semibold sm:col-span-2">{editingDesign ? "Edit" : "Add"} design for {selectedCustomer.name}</h4><label className="text-sm">Design number<input required value={designNo} onChange={e=>setDesignNo(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"/></label><label className="text-sm">Design name<input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"/></label><label className="text-sm">Garment<select required value={garment} onChange={e=>setGarment(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="">Choose garment…</option>{garments.filter(item=>item.active).map(item=><option key={item.id} value={item.name}>{item.name}</option>)}</select></label><label className="text-sm">Design image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setImage(e.target.files?.[0]??null)} className="mt-2 block w-full text-sm"/></label><label className="text-sm sm:col-span-2">Description<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"/></label><div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={closeForm} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button><button disabled={saving} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white">{saving ? "Saving…" : editingDesign ? "Save changes" : "Save design"}</button></div></form>}
      {!customerDesigns.length?<p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No designs saved for this customer yet. Select Add design to create the first one.</p>:<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{customerDesigns.map(design=><article key={design.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="aspect-[4/3] bg-slate-100">{design.imagePath?<img src={design.imagePath} alt={design.name || design.designNo} className="h-full w-full object-contain"/>:<div className="flex h-full items-center justify-center text-sm text-slate-400">No image uploaded</div>}</div><div className="p-4"><div className="flex items-start justify-between gap-3"><div><h5 className="font-semibold text-navy-900">{design.designNo}</h5><p className="mt-1 text-xs text-slate-500">{design.garmentMaster?.name??design.garment}</p></div><button type="button" onClick={()=>openEdit(design)} className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-navy-900 hover:bg-slate-50">Edit</button></div>{design.name&&<p className="mt-2 text-sm text-slate-700">{design.name}</p>}<p className="mt-1 text-sm text-slate-600">{design.description||"No description"}</p></div></article>)}</div>}
    </>}
  </div>;
}
