import { useEffect, useState, type FormEvent } from "react";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { createShop, getShops, updateShop } from "../services/api";
import type { Shop } from "../types";

const empty={name:"",area:"",phone:"",whatsapp:"",email:"",arabicName:"",englishName:"",address:"",logoUrl:""};

export function ShopsPage(){
 const [shops,setShops]=useState<Shop[]>([]);const [form,setForm]=useState(empty);const [showForm,setShowForm]=useState(false);const [selected,setSelected]=useState<Shop|null>(null);const [saving,setSaving]=useState(false);const [error,setError]=useState("");
 async function load(){try{setShops((await getShops()).data);}catch(e){setError(e instanceof Error?e.message:"Unable to load shops");}}
 useEffect(()=>{void load();},[]);
 function set(key:keyof typeof empty,value:string){setForm(v=>({...v,[key]:value}));}
 function open(shop:Shop){setSelected(shop);setForm({name:shop.name,area:shop.area,phone:shop.phone??"",whatsapp:shop.whatsapp??"",email:shop.email??"",arabicName:shop.arabicName??"",englishName:shop.englishName??"",address:shop.address??"",logoUrl:shop.logoUrl??""});}
 async function submit(e:FormEvent){e.preventDefault();setSaving(true);setError("");try{if(selected)await updateShop(selected.id,{...form,phone:form.phone||null,whatsapp:form.whatsapp||null,email:form.email||null,arabicName:form.arabicName||null,englishName:form.englishName||null,address:form.address||null,logoUrl:form.logoUrl||null});else await createShop(form);setForm(empty);setSelected(null);setShowForm(false);await load();}catch(e){setError(e instanceof Error?e.message:"Unable to save shop");}finally{setSaving(false);}}
 return <div className="mx-auto max-w-6xl space-y-5">
  <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Administration</p><h3 className="mt-1 text-2xl font-semibold text-navy-900">Shops</h3><p className="mt-1 text-sm text-slate-600">Maintain branch information used across orders and invoices.</p></div><button onClick={()=>{setSelected(null);setForm(empty);setShowForm(v=>!v)}} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">{showForm?"Close":"+ Add shop"}</button></section>
  {error&&<ErrorState message={error}/>}
  {(showForm||selected)&&<form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="border-b border-slate-100 pb-4"><h4 className="font-semibold text-navy-900">{selected?"Edit shop":"Add shop"}</h4><p className="mt-1 text-xs text-slate-500">Only available information needs to be filled. Missing fields will be skipped on invoices.</p></div>
   <div className="mt-5 grid gap-4 md:grid-cols-2">
    {([["name","Shop name",true],["area","Area / branch",true],["arabicName","Arabic business name",false],["englishName","English business name",false],["phone","Phone",false],["whatsapp","WhatsApp",false],["email","Email",false],["logoUrl","Logo URL",false]] as const).map(([key,label,required])=><label key={key} className="text-sm font-medium text-slate-700">{label}<input required={required} value={form[key]} onChange={e=>set(key,e.target.value)} className="mt-1.5 h-11 w-full px-3" /></label>)}
    <label className="text-sm font-medium text-slate-700 md:col-span-2">Address<textarea value={form.address} onChange={e=>set("address",e.target.value)} rows={3} className="mt-1.5 w-full p-3"/></label>
   </div>
   <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={()=>{setSelected(null);setShowForm(false);setForm(empty)}} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm">Cancel</button><button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">{saving?"Saving…":"Save shop"}</button></div>
  </form>}
  {!shops.length?<LoadingState label="No active shops found."/>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{shops.map(shop=><article key={shop.id} onClick={()=>open(shop)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")open(shop)}} className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    {shop.logoUrl&&<img src={shop.logoUrl} className="mb-3 h-10 max-w-28 object-contain" />}<p className="text-xs uppercase tracking-wide text-slate-500">Branch</p><h4 className="mt-1 text-lg font-semibold text-navy-900">{shop.name}</h4><p className="mt-1 text-sm text-slate-600">{shop.area}</p>{shop.englishName&&<p className="mt-3 text-sm text-slate-700">{shop.englishName}</p>}{shop.phone&&<p className="mt-1 text-sm text-slate-500">{shop.phone}</p>}
  </article>)}</div>}
 </div>;
}