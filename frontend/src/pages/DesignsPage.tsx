import { useEffect, useRef, useState, type FormEvent } from "react";
import { createDesign, getDesigns, uploadDesignImage } from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import type { Design, GarmentType } from "../types";

const garments:GarmentType[]=["THOBE","SHIRT","TROUSER","SUIT","OTHER"];
const label=(v:string)=>v.replaceAll("_"," ");
export function DesignsPage(){
  const [designs,setDesigns]=useState<Design[]>([]); const [show,setShow]=useState(false); const [filter,setFilter]=useState("");
  const [designNo,setDesignNo]=useState(""); const [name,setName]=useState(""); const [garment,setGarment]=useState<GarmentType>("THOBE"); const [description,setDescription]=useState(""); const [error,setError]=useState(""); const [saving,setSaving]=useState(false); const fileRefs=useRef<Record<string,HTMLInputElement|null>>({});
  async function load(){try{setDesigns((await getDesigns()).data)}catch(e){setError(e instanceof Error?e.message:"Unable to load designs")}}
  useEffect(()=>{load()},[]);
  async function submit(e:FormEvent){e.preventDefault();setSaving(true);setError("");try{await createDesign({designNo,name,garment,description:description||undefined});setDesignNo("");setName("");setDescription("");setShow(false);await load()}catch(e){setError(e instanceof Error?e.message:"Unable to create design")}finally{setSaving(false)}}
  async function image(id:string,file?:File){if(!file)return;try{await uploadDesignImage(id,file);await load()}catch(e){setError(e instanceof Error?e.message:"Unable to upload image")}}
  const visible=filter?designs.filter(d=>d.garment===filter):designs;
  return <div className="mx-auto max-w-6xl space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Library</p><h3 className="text-2xl font-semibold text-navy-900">Designs</h3><p className="text-sm text-slate-600">Reusable garment designs for customer orders and production assignment.</p></div><button onClick={()=>setShow(v=>!v)} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white">{show?"Close":"+ Add design"}</button></div>
    {error&&<ErrorState message={error}/>}
    {show&&<form onSubmit={submit} className="grid gap-3 rounded-xl border border-sand-100 bg-white p-5 shadow-sm md:grid-cols-4">
      <input required value={designNo} onChange={e=>setDesignNo(e.target.value)} placeholder="Design no. e.g. DES-0046" className="rounded-md border border-slate-300 px-3 py-2 text-sm"/>
      <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Design name" className="rounded-md border border-slate-300 px-3 py-2 text-sm"/>
      <select value={garment} onChange={e=>setGarment(e.target.value as GarmentType)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">{garments.map(g=><option key={g}>{g}</option>)}</select>
      <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Short description" className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-4"/>
      <button disabled={saving} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white md:col-start-4">{saving?"Saving…":"Save design"}</button>
    </form>}
    <div className="flex flex-col gap-3 sm:flex-row"><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter by garment type…" className="rounded-md border border-slate-300 px-3 py-2 text-sm"/><span className="self-center text-sm text-slate-500">{visible.length} design(s)</span></div>
    {!visible.length?<LoadingState label="No designs found."/>:<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map(d=><article key={d.id} className="overflow-hidden rounded-xl border border-sand-100 bg-white shadow-sm">
      <div className="aspect-[4/3] bg-slate-100">{d.imagePath?<img src={d.imagePath} alt={d.name} className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center text-3xl font-semibold text-slate-300">SP</div>}</div>
      <div className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-slate-500">{d.designNo}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">{label(d.garment)}</span></div><h4 className="mt-2 font-semibold text-navy-900">{d.name}</h4><p className="mt-1 min-h-10 text-sm text-slate-600">{d.description||"No description added."}</p>
      <input ref={el=>{fileRefs.current[d.id]=el}} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e=>image(d.id,e.target.files?.[0])}/><button onClick={()=>fileRefs.current[d.id]?.click()} className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">{d.imagePath?"Replace image":"Add design image"}</button></div>
    </article>)}</div>}
  </div>;
}
