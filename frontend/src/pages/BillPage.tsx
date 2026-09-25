import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBill } from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import type { Invoice } from "../types";

const money=(fils:number)=>"K.D. "+(fils/1000).toFixed(3);
const date=(v:string)=>new Date(v).toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"});
function words(n:number){
  const ones=["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const tens=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  const under100=(x:number)=>x<20?ones[x]:tens[Math.floor(x/10)]+(x%10?" "+ones[x%10]:"");
  const under1000=(x:number)=>x<100?under100(x):(ones[Math.floor(x/100)]+" hundred"+(x%100?" "+under100(x%100):""));
  if(n===0)return "Zero";
  const dinars=Math.floor(n/1000), fils=n%1000;
  let out="";
  if(dinars>=1000000) out+=under1000(Math.floor(dinars/1000000))+" million ";
  if(dinars%1000000>=1000) out+=under1000(Math.floor((dinars%1000000)/1000))+" thousand ";
  if(dinars%1000) out+=under1000(dinars%1000)+" ";
  out+="Kuwaiti Dinar";
  if(fils) out+=" and "+String(fils).padStart(3,"0")+" Fils";
  return out.trim()+" only";
}

export function BillPage(){
 const {id}=useParams(); const [invoice,setInvoice]=useState<Invoice|null>(null); const [error,setError]=useState("");
 useEffect(()=>{if(id)getBill(id).then(r=>setInvoice(r.data)).catch(e=>setError(e instanceof Error?e.message:"Unable to load invoice"));},[id]);
 if(error)return <ErrorState message={error}/>; if(!invoice)return <LoadingState label="Loading invoice…"/>;
 const shop=invoice.shop ?? invoice.order?.shop ?? null, customer=invoice.customer ?? invoice.order?.customer ?? null;
 const quantities=invoice.lines.reduce<Record<string,number>>((a,l)=>(a[l.description]=(a[l.description]??0)+l.quantity,a),{});
 const totalQty=invoice.lines.reduce((s,l)=>s+l.quantity,0);
 return <div className="mx-auto max-w-[1050px] space-y-5">
   <div className="flex items-center justify-between print:hidden"><Link to="/bills" className="text-sm font-medium text-blue-700">← Back to Bills</Link><div className="flex gap-2"><button onClick={()=>window.print()} className="rounded-lg border bg-white px-4 py-2 text-sm">Print preview</button><button onClick={()=>window.print()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Print / Save PDF</button></div></div>
   <article className="invoice-paper bg-white p-7 text-slate-900 shadow-[0_8px_35px_rgba(15,31,53,.10)] print:p-0 print:shadow-none">
     <header className="border-b-2 border-slate-800 pb-4 text-center">
       {shop?.logoUrl&&<img src={shop.logoUrl} className="mx-auto mb-2 max-h-16 max-w-36 object-contain"/>}
       {shop?.arabicName&&<p className="text-xl font-semibold">{shop.arabicName}</p>}
       {shop?.englishName&&<p className="text-xl font-bold">{shop.englishName}</p>}
       {!shop?.arabicName&&!shop?.englishName&&<p className="text-xl font-bold">{shop?.name ?? "Tailor Shop"}</p>}
       {shop?.address&&<p className="mt-1 text-xs">{shop.address}</p>}
       <div className="mt-1 flex flex-wrap justify-center gap-x-4 text-xs">{shop?.phone&&<span>Tel: {shop.phone}</span>}{shop?.whatsapp&&<span>WhatsApp: {shop.whatsapp}</span>}{shop?.email&&<span>{shop.email}</span>}</div>
     </header>
     <div className="py-4 text-center"><h1 className="text-2xl font-bold underline">INVOICE</h1>{invoice.subject&&<p className="mt-1 text-sm">{invoice.subject}</p>}</div>
     <div className="grid gap-4 border-y border-slate-700 py-3 text-sm sm:grid-cols-2">
       <div><p className="font-bold">Bill To</p><p>{customer?.name ?? "Customer"}</p>{customer?.phone&&<p>{customer.phone}</p>}{customer?.address&&<p>{customer.address}</p>}</div>
       <div className="sm:text-right"><p>Invoice Date: {date(invoice.issuedAt)}</p><p>Invoice No: {invoice.invoiceNo}</p>{invoice.modelNo&&<p>Model No: {invoice.modelNo}</p>}</div>
     </div>
     {invoice.modelImagePath&&<div className="py-4 text-center"><img src={invoice.modelImagePath} className="mx-auto max-h-44 max-w-64 object-contain"/>{invoice.modelNo&&<p className="mt-1 text-sm">Model No: {invoice.modelNo}</p>}</div>}
     <div className="mt-4 overflow-hidden border border-slate-700"><table className="w-full border-collapse text-sm"><thead><tr className="bg-slate-50"><th className="border border-slate-700 p-2">Order No</th><th className="border border-slate-700 p-2">Order Date & Time</th><th className="border border-slate-700 p-2">Order Details</th><th className="border border-slate-700 p-2">Quantity</th><th className="border border-slate-700 p-2">Rate Per Piece<br/>(K.D.)</th><th className="border border-slate-700 p-2">Total</th></tr></thead><tbody>{invoice.lines.map(line=><tr key={line.id}><td className="border border-slate-700 p-2 text-center">{line.order?.orderNo??"—"}</td><td className="border border-slate-700 p-2 text-center">{line.orderDate?new Date(line.orderDate).toLocaleString("en-GB"): "—"}</td><td className="border border-slate-700 p-2 text-center">{line.description}</td><td className="border border-slate-700 p-2 text-center">{line.quantity}</td><td className="border border-slate-700 p-2 text-center">{(line.unitPriceFils/1000).toFixed(3)}</td><td className="border border-slate-700 p-2 text-right">{(line.totalFils/1000).toFixed(3)}</td></tr>)}</tbody><tfoot><tr><td colSpan={5} className="border border-slate-700 p-2 text-right font-bold">GRAND TOTAL</td><td className="border border-slate-700 p-2 text-right font-bold">{(invoice.totalFils/1000).toFixed(3)}</td></tr><tr><td colSpan={6} className="border border-slate-700 p-2 text-center font-bold uppercase">{words(invoice.totalFils)}</td></tr></tfoot></table></div>
     <div className="mt-5 border border-slate-700"><div className="grid sm:grid-cols-[1fr_1fr]"><div className="p-3 font-bold">QUANTITY</div><div className="p-3">{Object.entries(quantities).map(([name,qty])=><div key={name} className="flex justify-between border-b border-slate-200 py-1 last:border-0"><span>{name}</span><span>{qty}</span></div>)}<div className="mt-1 flex justify-between border-t border-slate-700 pt-2 font-bold"><span>TOTAL QUANTITY</span><span>{totalQty}</span></div></div></div></div>
     {invoice.notes&&<div className="mt-5 whitespace-pre-wrap border-t border-slate-700 pt-4 text-sm">{invoice.notes}</div>}
     <div className="mt-12 grid grid-cols-2 gap-10 text-sm"><div className="border-t border-slate-500 pt-2">Receiver's Sign.</div><div className="border-t border-slate-500 pt-2 text-right">Salesman Sign.</div></div>
   </article>
 </div>;
}