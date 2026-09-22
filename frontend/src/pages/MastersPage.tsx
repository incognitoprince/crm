import { useEffect, useState, type FormEvent } from "react";
import { createMaster, getMasters, getShops, updateMaster } from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import type { Master, Shop } from "../types";

export function MastersPage() {
  const [masters,setMasters]=useState<Master[]>([]);
  const [shops,setShops]=useState<Shop[]>([]);
  const [show,setShow]=useState(false);
  const [name,setName]=useState(""); const [phone,setPhone]=useState(""); const [shopId,setShopId]=useState("");
  const [error,setError]=useState(""); const [saving,setSaving]=useState(false);
  async function load(){ try { const [m,s]=await Promise.all([getMasters(),getShops()]); setMasters(m.data); setShops(s.data); if(!shopId&&s.data[0])setShopId(s.data[0].id); } catch(e){setError(e instanceof Error?e.message:"Unable to load masters");}}
  useEffect(()=>{load()},[]);
  async function submit(e:FormEvent){e.preventDefault();setSaving(true);setError("");try{await createMaster({name,phone:phone||undefined,shopId});setName("");setPhone("");setShow(false);await load()}catch(e){setError(e instanceof Error?e.message:"Unable to create master")}finally{setSaving(false)}}
  async function toggle(master:Master){try{await updateMaster(master.id,{active:false});await load()}catch(e){setError(e instanceof Error?e.message:"Unable to update master")}}
  if(!shops.length&&!error)return <LoadingState label="Loading master workspace…"/>;
  return <div className="mx-auto max-w-6xl space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Production team</p><h3 className="text-2xl font-semibold text-navy-900">Masters</h3><p className="text-sm text-slate-600">Manage the tailors who can be assigned to production work.</p></div>
      <button onClick={()=>setShow(v=>!v)} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white">{show?"Close":"+ Add master"}</button>
    </div>
    {error&&<ErrorState message={error}/>}
    {show&&<form onSubmit={submit} className="grid gap-3 rounded-xl border border-sand-100 bg-white p-5 shadow-sm md:grid-cols-4">
      <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Master name" className="rounded-md border border-slate-300 px-3 py-2 text-sm"/>
      <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone (optional)" className="rounded-md border border-slate-300 px-3 py-2 text-sm"/>
      <select required value={shopId} onChange={e=>setShopId(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">{shops.map(s=><option key={s.id} value={s.id}>{s.name} · {s.area}</option>)}</select>
      <button disabled={saving} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white">{saving?"Saving…":"Save master"}</button>
    </form>}
    {!masters.length?<div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No active masters yet. Add your first master to start assigning production work.</div>:
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{masters.map(m=><article key={m.id} className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-slate-500">{m.shop.name}</p><h4 className="mt-1 text-lg font-semibold text-navy-900">{m.name}</h4></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Active</span></div>
      <p className="mt-3 text-sm text-slate-600">{m.phone||"No phone added"}</p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-xs text-slate-500">{m._count?.assignments??0} assignment(s)</span><button onClick={()=>toggle(m)} className="text-xs font-medium text-slate-500 hover:text-red-700">Deactivate</button></div>
    </article>)}</div>}
  </div>;
}
