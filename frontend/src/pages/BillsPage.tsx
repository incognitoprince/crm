import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createBill, getBills, getCustomers, getOrders, getShops, uploadInvoiceModelImage } from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import type { Customer, Invoice, Order, Shop } from "../types";

const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);
const fils = (value: string) => Math.round(Number(value || 0) * 1000);

type DraftLine = { orderId: string; description: string; quantity: string; rate: string };

export function BillsPage() {
  const navigate = useNavigate();
  const [invoices,setInvoices]=useState<Invoice[]>([]);
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [shops,setShops]=useState<Shop[]>([]);
  const [shopId,setShopId]=useState("");
  const [customerId,setCustomerId]=useState("");
  const [subject,setSubject]=useState("");
  const [modelNo,setModelNo]=useState("");
  const [notes,setNotes]=useState("");
  const [modelImage,setModelImage]=useState<File|null>(null);
  const [lines,setLines]=useState<DraftLine[]>([{orderId:"",description:"",quantity:"1",rate:""}]);
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState("");

  async function load(){
    setError("");
    try{const [b,c,o,s]=await Promise.all([getBills(),getCustomers(),getOrders(),getShops()]);setInvoices(b.data);setCustomers(c.data);setOrders(o.data);setShops(s.data);if(!shopId&&s.data[0])setShopId(s.data[0].id);}
    catch(e){setError(e instanceof Error?e.message:"Unable to load billing data");}finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  const customerOrders=useMemo(()=>orders.filter(o=>o.customer.id===customerId&&o.status!=="CANCELLED"),[orders,customerId]);
  const total=lines.reduce((sum,l)=>sum+(Number(l.quantity||0)*fils(l.rate)),0);

  function updateLine(index:number,key:keyof DraftLine,value:string){setLines(current=>current.map((line,i)=>i===index?{...line,[key]:value}:line));}
  function addLine(){setLines(current=>[...current,{orderId:"",description:"",quantity:"1",rate:""}]);}
  function removeLine(index:number){setLines(current=>current.filter((_,i)=>i!==index));}

  async function save(){
    setSaving(true);setError("");
    try{
      if(!shopId||!customerId) throw new Error("Select a shop and customer.");
      const valid=lines.filter(l=>l.description.trim()&&Number(l.quantity)>0&&Number(l.rate)>=0);
      if(!valid.length) throw new Error("Add at least one bill item.");
      const result=await createBill({shopId,customerId,subject:subject||undefined,modelNo:modelNo||undefined,notes:notes||undefined,lines:valid.map(l=>({orderId:l.orderId||undefined,description:l.description.trim(),quantity:Number(l.quantity),unitPriceFils:fils(l.rate)}))});
      if(modelImage) await uploadInvoiceModelImage(result.data.id,modelImage);
      navigate("/bills/"+result.data.id);
    }catch(e){setError(e instanceof Error?e.message:"Unable to create bill");}finally{setSaving(false);}
  }

  if(loading)return <LoadingState label="Loading billing workspace…"/>;

  return <div className="mx-auto max-w-[1400px] space-y-5">
    <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Owner · Finance</p><h3 className="mt-1 text-2xl font-semibold text-navy-900">Bills / Invoices</h3><p className="mt-1 text-sm text-slate-600">Create the customer's bill manually when pieces are ready for delivery.</p></div>
      <Link to="/orders" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-navy-900">View Orders</Link>
    </section>
    {error&&<ErrorState message={error}/>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,.9fr)]">
      <section className="space-y-5">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-4"><h4 className="font-semibold text-navy-900">Bill Information</h4><p className="mt-1 text-xs text-slate-500">Shop information is taken from the selected shop profile.</p></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Shop<select value={shopId} onChange={e=>setShopId(e.target.value)} className="mt-1.5 h-11 w-full px-3"><option value="">Select shop…</option>{shops.map(s=><option key={s.id} value={s.id}>{s.name} · {s.area}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Customer<select value={customerId} onChange={e=>setCustomerId(e.target.value)} className="mt-1.5 h-11 w-full px-3"><option value="">Select customer…</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Subject<input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Bill of Model No: 20" className="mt-1.5 h-11 w-full px-3"/></label>
            <label className="text-sm font-medium text-slate-700">Model No.<input value={modelNo} onChange={e=>setModelNo(e.target.value)} placeholder="Optional model number" className="mt-1.5 h-11 w-full px-3"/></label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">Model image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setModelImage(e.target.files?.[0]??null)} className="mt-1.5 block w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm"/></label>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-end justify-between gap-3 border-b border-slate-100 pb-4"><div><h4 className="font-semibold text-navy-900">Bill Items</h4><p className="mt-1 text-xs text-slate-500">Add only the pieces/details being billed now. Rate is entered manually.</p></div><button type="button" onClick={addLine} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">+ Add row</button></div>
          <div className="mt-4 space-y-3">
            {lines.map((line,i)=><div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div className="grid gap-3 md:grid-cols-[1.1fr_1.6fr_.55fr_.7fr_auto] md:items-end">
                <label className="text-xs font-medium text-slate-600">Order<select value={line.orderId} onChange={e=>updateLine(i,"orderId",e.target.value)} className="mt-1 h-10 w-full px-2 text-sm"><option value="">Manual / none</option>{customerOrders.map(o=><option key={o.id} value={o.id}>{o.orderNo}</option>)}</select></label>
                <label className="text-xs font-medium text-slate-600">Description<input value={line.description} onChange={e=>updateLine(i,"description",e.target.value)} placeholder="e.g. (1 TO 6) YEAR" className="mt-1 h-10 w-full px-2 text-sm"/></label>
                <label className="text-xs font-medium text-slate-600">Qty<input type="number" min="1" value={line.quantity} onChange={e=>updateLine(i,"quantity",e.target.value)} className="mt-1 h-10 w-full px-2 text-sm"/></label>
                <label className="text-xs font-medium text-slate-600">Rate (K.D.)<input type="number" min="0" step="0.001" value={line.rate} onChange={e=>updateLine(i,"rate",e.target.value)} placeholder="0.000" className="mt-1 h-10 w-full px-2 text-sm"/></label>
                <div className="flex items-center justify-between gap-2 md:block"><div className="text-right"><p className="text-[11px] text-slate-400">Total</p><p className="font-semibold text-navy-900">{money(Number(line.quantity||0)*fils(line.rate))}</p></div><button type="button" onClick={()=>removeLine(i)} className="text-xs font-medium text-red-600">Remove</button></div>
              </div>
            </div>)}
          </div>
          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4"><div className="w-full max-w-xs"><div className="flex justify-between text-lg font-bold text-navy-900"><span>Grand Total</span><span>{money(total)}</span></div><p className="mt-1 text-right text-xs text-slate-500">Amount in words will appear on the printed bill.</p></div></div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><label className="text-sm font-medium text-slate-700">Notes / Terms<textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} placeholder="Optional terms, payment instructions or notes…" className="mt-1.5 w-full p-3"/></label></article>
        <div className="flex justify-end gap-2"><button type="button" onClick={()=>navigate("/orders")} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium">Cancel</button><button type="button" disabled={saving} onClick={()=>void save()} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving?"Creating…":"Create Bill"}</button></div>
      </section>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between px-2"><div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Live preview</p><p className="text-sm font-semibold text-navy-900">Customer bill</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">Draft</span></div>
          <div className="min-h-[720px] bg-white p-5 text-[11px] text-slate-800 shadow-sm">
            {(()=>{const shop=shops.find(s=>s.id===shopId);const customer=customers.find(c=>c.id===customerId);return <>
              <div className="border-b border-slate-800 pb-3 text-center">{shop?.logoUrl&&<img src={shop.logoUrl} className="mx-auto mb-2 max-h-14 max-w-28 object-contain" />}{shop?.arabicName&&<p className="text-base font-semibold">{shop.arabicName}</p>}{shop?.englishName&&<p className="text-base font-bold">{shop.englishName}</p>}{!shop?.arabicName&&!shop?.englishName&&<p className="text-base font-bold">{shop?.name||"Shop name"}</p>}{shop?.address&&<p>{shop.address}</p>}{shop?.phone&&<p>Tel: {shop.phone}</p>}{shop?.whatsapp&&<p>WhatsApp: {shop.whatsapp}</p>}{shop?.email&&<p>{shop.email}</p>}</div>
              <div className="py-4 text-center"><p className="text-lg font-bold underline">INVOICE</p><p className="mt-1">{subject||"Bill / Invoice"}</p></div>
              <div className="grid grid-cols-2 gap-3 border-y border-slate-300 py-3"><div><b>Bill To</b><p>{customer?.name||"Customer"}</p>{customer?.phone&&<p>{customer.phone}</p>}</div><div className="text-right"><p>Invoice Date: {new Date().toLocaleDateString()}</p><p>Invoice No: —</p></div></div>
              {modelImage&&<div className="py-3 text-center"><img src={URL.createObjectURL(modelImage)} className="mx-auto max-h-32 max-w-40 object-contain" /><p className="mt-1">Model No: {modelNo||"—"}</p></div>}
              <table className="mt-4 w-full border-collapse border border-slate-400"><thead><tr><th className="border border-slate-400 p-1 text-left">Order</th><th className="border border-slate-400 p-1 text-left">Details</th><th className="border border-slate-400 p-1">Qty</th><th className="border border-slate-400 p-1">Rate</th><th className="border border-slate-400 p-1">Total</th></tr></thead><tbody>{lines.filter(l=>l.description.trim()).map((l,i)=><tr key={i}><td className="border border-slate-400 p-1">{l.orderId?customerOrders.find(o=>o.id===l.orderId)?.orderNo:"—"}</td><td className="border border-slate-400 p-1">{l.description}</td><td className="border border-slate-400 p-1 text-center">{l.quantity}</td><td className="border border-slate-400 p-1 text-right">{Number(l.rate||0).toFixed(3)}</td><td className="border border-slate-400 p-1 text-right">{(Number(l.quantity||0)*Number(l.rate||0)).toFixed(3)}</td></tr>)}</tbody></table>
              <div className="mt-4 text-right font-bold">GRAND TOTAL&nbsp;&nbsp; {total?money(total):"K.D. 0.000"}</div>
              {notes&&<div className="mt-3 whitespace-pre-wrap border-t border-slate-300 pt-3">{notes}</div>}
            </>})()}
          </div>
        </div>
      </aside>
    </div>

    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="font-semibold text-navy-900">Invoice history</h4>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="pb-3">Invoice</th><th className="pb-3">Shop</th><th className="pb-3">Customer</th><th className="pb-3">Date</th><th className="pb-3 text-right">Total</th></tr></thead><tbody>{invoices.map(inv=><tr key={inv.id} className="border-b border-slate-50 last:border-0"><td className="py-3"><Link className="font-medium text-blue-700 hover:underline" to={"/bills/"+inv.id}>{inv.invoiceNo}</Link></td><td className="py-3">{inv.shop?.name}</td><td className="py-3">{inv.customer?.name}</td><td className="py-3">{new Date(inv.issuedAt).toLocaleDateString()}</td><td className="py-3 text-right font-semibold">{money(inv.totalFils)}</td></tr>)}</tbody></table></div>
    </section>
  </div>;
}