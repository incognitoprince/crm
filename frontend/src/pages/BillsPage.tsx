import { useEffect, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createBill, getBills, getCustomers, getDesigns, getOrders, getShops, uploadInvoiceLineImage } from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { InvoiceHeader } from "../components/InvoiceHeader";
import { LoadingState } from "../components/LoadingState";
import type { Customer, Design, Invoice, Order, Shop } from "../types";

const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);
const fils = (value: string) => Math.round(Number(value || 0) * 1000);

type DraftLine = {
  orderId: string;
  orderNo: string;
  description: string;
  sizeBreakdowns: Array<{ size: string; quantity: string; rate: string }>;
  quantity: string;
  rate: string;
  designId: string;
  imageFile: File | null;
  imagePreview: string;
};

export function BillsPage() {
  const navigate = useNavigate();
  const [invoices,setInvoices]=useState<Invoice[]>([]);
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [shops,setShops]=useState<Shop[]>([]);
  const [designs,setDesigns]=useState<Design[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [shopId,setShopId]=useState("");
  const [customerId,setCustomerId]=useState("");
  const [invoiceNo,setInvoiceNo]=useState("");
  const [invoiceDate,setInvoiceDate]=useState(new Date().toISOString().slice(0,10));
  const [subject,setSubject]=useState("");
  const [modelNo,setModelNo]=useState("");
  const [notes,setNotes]=useState("");
  const [lines,setLines]=useState<DraftLine[]>([{orderId:"",orderNo:"",description:"",sizeBreakdowns:[],quantity:"1",rate:"",designId:"",imageFile:null,imagePreview:""}]);
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState("");

  async function load(){
    setError("");
    try{
      const [b,c,s,d,o]=await Promise.all([getBills(),getCustomers(),getShops(),getDesigns(),getOrders()]);
      setInvoices(b.data);setCustomers(c.data);setShops(s.data);setDesigns(d.data);setOrders(o.data);
      if(!shopId&&s.data[0])setShopId(s.data[0].id);
    }catch(e){setError(e instanceof Error?e.message:"Unable to load billing data");}finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  const total=lines.reduce((sum,l)=>sum+(l.orderId&&l.sizeBreakdowns.length?l.sizeBreakdowns.reduce((part,row)=>part+(Number(row.quantity||0)*fils(row.rate)),0):Number(l.quantity||0)*fils(l.rate)),0);

  function updateLine(index:number,key: keyof DraftLine,value:DraftLine[keyof DraftLine]){
    setLines(current=>current.map((line,i)=>i===index?{...line,[key]:value}:line));
  }
  function selectOrder(index:number,orderId:string){
    const order=orders.find(item=>item.id===orderId);
    setLines(current=>current.map((line,i)=>i===index?{
      ...line,orderId,orderNo:order?.orderNo??"",description:order?.description??line.description,
      quantity:order?String(order.quantity):line.quantity,
      sizeBreakdowns:order?.sizeBreakdowns.map(item=>({size:item.size,quantity:String(item.quantity),rate:""}))??[]
    }:line));
  }
  function updateSizeBreakdown(index:number,rowIndex:number,key:"size"|"quantity"|"rate",value:string){
    setLines(current=>current.map((line,i)=>i===index?{...line,sizeBreakdowns:line.sizeBreakdowns.map((row,j)=>j===rowIndex?{...row,[key]:value}:row)}:line));
  }
  function selectDesign(index:number,designId:string){
    const design=designs.find(d=>d.id===designId);
    setLines(current=>current.map((line,i)=>i===index?{...line,designId,imageFile:null,imagePreview:design?.imagePath??""}:line));
  }
  function chooseFile(index:number,event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0]??null;
    if(!file)return;
    const preview=URL.createObjectURL(file);
    setLines(current=>current.map((line,i)=>{
      if(i!==index)return line;
      if(line.imagePreview.startsWith("blob:"))URL.revokeObjectURL(line.imagePreview);
      return {...line,designId:"",imageFile:file,imagePreview:preview};
    }));
  }
  function addLine(){setLines(current=>[...current,{orderId:"",orderNo:"",description:"",sizeBreakdowns:[],quantity:"1",rate:"",designId:"",imageFile:null,imagePreview:""}]);}
  function removeLine(index:number){
    setLines(current=>{const line=current[index];if(line?.imagePreview.startsWith("blob:"))URL.revokeObjectURL(line.imagePreview);return current.filter((_,i)=>i!==index);});
  }

  async function save(){
    setSaving(true);setError("");
    try{
      if(!shopId||!customerId)throw new Error("Select a shop and customer.");
      if(lines.some(l=>l.orderId && !orders.some(o=>o.id===l.orderId && o.customer.id===customerId))) throw new Error("Selected orders must belong to the chosen customer.");
      for (const line of lines) {
        if (line.orderId && line.sizeBreakdowns.length) {
          const incomplete = line.sizeBreakdowns.find(row => !row.size.trim() || Number(row.quantity) < 1 || row.rate.trim() === "" || !Number.isFinite(Number(row.rate)) || Number(row.rate) < 0);
          if (incomplete) throw new Error("Enter a size, quantity and rate for every size row before saving.");
        } else if (!line.orderNo.trim() && !line.description.trim()) {
          throw new Error("Enter an order number or description for each invoice item.");
        } else if (Number(line.quantity) < 1 || line.rate.trim() === "" || !Number.isFinite(Number(line.rate)) || Number(line.rate) < 0) {
          throw new Error("Enter a valid quantity and rate for each invoice item.");
        }
      }
      const valid=lines.filter(l=>l.orderId && l.sizeBreakdowns.length ? l.sizeBreakdowns.length > 0 : Number(l.quantity)>0 && l.rate.trim()!=="");
      if(!valid.length)throw new Error("Add at least one bill item.");
      const result=await createBill({
        invoiceNo:invoiceNo||undefined,
        issuedAt:invoiceDate?new Date(invoiceDate+"T12:00:00").toISOString():undefined,
        shopId,customerId,subject:subject||undefined,modelNo:modelNo||undefined,notes:notes||undefined,
        lines:valid.flatMap(l=>{const imagePath=designs.find(d=>d.id===l.designId)?.imagePath||undefined;const sizes=l.sizeBreakdowns.filter(row=>row.size.trim()&&Number(row.quantity)>0);if(l.orderId&&sizes.length)return sizes.map(row=>({orderId:l.orderId,orderNo:l.orderNo.trim()||undefined,imagePath,description:[l.description.trim(),row.size].filter(Boolean).join(" · "),sizeBreakdowns:[{size:row.size.trim(),quantity:Number(row.quantity)}],quantity:Number(row.quantity),unitPriceFils:fils(row.rate)}));return [{orderId:l.orderId||undefined,orderNo:l.orderNo.trim()||undefined,imagePath,description:l.description.trim(),quantity:Number(l.quantity),unitPriceFils:fils(l.rate)}];}),
      });
      let resultLineIndex = 0;
      for (const line of valid) {
        const generatedCount = line.orderId && line.sizeBreakdowns.length ? line.sizeBreakdowns.length : 1;
        const file = line.imageFile;
        if (file && result.data.lines[resultLineIndex]) {
          await uploadInvoiceLineImage(result.data.id, result.data.lines[resultLineIndex].id, file);
        }
        resultLineIndex += generatedCount;
      }
      navigate("/bills/"+result.data.id);
    }catch(e){setError(e instanceof Error?e.message:"Unable to create bill");}finally{setSaving(false);}
  }

  if(loading)return <LoadingState label="Loading billing workspace…"/>;

  return <div className="mx-auto w-full min-w-0 max-w-[1400px] space-y-4 px-0 sm:space-y-5 sm:px-1">
    <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Invoices</p><h3 className="mt-1 text-2xl font-semibold text-navy-900">Bills / Invoices</h3><p className="mt-1 text-sm text-slate-600">Select one order, then enter a separate quantity and rate for each size. Add another item only when billing a different order or garment.</p></div>
      <Link to="/orders" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-navy-900">Back to Orders</Link>
    </section>
    {error&&<ErrorState message={error}/>}
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,.9fr)]">
      <section className="space-y-5">
        <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <div className="border-b border-slate-100 pb-4"><h4 className="font-semibold text-navy-900">Bill Information</h4><p className="mt-1 text-xs text-slate-500">Shop header information is automatically used from the selected shop profile. All optional shop header fields remain optional.</p></div>
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4">
            <label className="text-sm font-medium text-slate-700">Invoice No.<input value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} placeholder="Auto if blank" className="mt-1.5 h-11 w-full px-3"/></label>
            <label className="text-sm font-medium text-slate-700">Invoice Date<input type="date" value={invoiceDate} onChange={e=>setInvoiceDate(e.target.value)} className="mt-1.5 h-11 w-full px-3"/></label>
            <label className="text-sm font-medium text-slate-700">Shop<select value={shopId} onChange={e=>setShopId(e.target.value)} className="mt-1.5 h-11 w-full px-3"><option value="">Select shop…</option>{shops.map(s=><option key={s.id} value={s.id}>{s.name} · {s.area}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Customer<select value={customerId} onChange={e=>{setCustomerId(e.target.value);setLines(current=>current.map(line=>({...line,orderId:"",orderNo:""})));}} className="mt-1.5 h-11 w-full px-3"><option value="">Select customer…</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}{c.phone?.trim() && c.phone.trim().toLowerCase() !== "not provided" ? ` · ${c.phone}` : ""}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Subject<input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Bill of Model No: 20" className="mt-1.5 h-11 w-full px-3"/></label>
            <label className="text-sm font-medium text-slate-700">Model No.<input value={modelNo} onChange={e=>setModelNo(e.target.value)} placeholder="Optional model number" className="mt-1.5 h-11 w-full px-3"/></label>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-end justify-between gap-3 border-b border-slate-100 pb-4"><div><h4 className="font-semibold text-navy-900">Bill Items</h4><p className="mt-1 text-xs text-slate-500">Select an existing customer order or enter a legacy order number. Choose an image from Design Library or upload one for each row.</p></div><button type="button" onClick={addLine} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">+ Add item</button></div>
          <div className="mt-4 space-y-4">
            {lines.map((line,i)=><div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">{i+1}</span><div><p className="text-sm font-semibold text-slate-800">Invoice item {i+1}</p><p className="text-[11px] text-slate-500">{line.orderId?"Existing order selected":line.orderNo.trim()?"Manual order number":"Choose an order or enter a number"}</p></div></div>
                {lines.length>1&&<button type="button" onClick={()=>removeLine(i)} className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Remove item</button>}
              </div>
              <div className="space-y-4 p-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Order number</label>
                  <input list={`customer-orders-${i}`} value={line.orderNo} onChange={e=>{const value=e.target.value;const match=orders.find(o=>o.customer.id===customerId&&o.orderNo.toLowerCase()===value.trim().toLowerCase());if(match)selectOrder(i,match.id);else{updateLine(i,"orderNo",value);updateLine(i,"orderId","");updateLine(i,"sizeBreakdowns",[]);}}} placeholder="Choose an existing order or type an order number" className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>
                  <datalist id={`customer-orders-${i}`}>{orders.filter(o=>o.customer.id===customerId&&o.status!=="CANCELLED").map(o=><option key={o.id} value={o.orderNo}>{o.garment} · {new Date(o.orderDate).toLocaleDateString()}</option>)}</datalist>
                  <p className="mt-1 text-[11px] text-slate-500">{customerId?"Choose from this customer's orders, or type a legacy order number.":"Select a customer above to see their existing orders."}</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-700">Design image
                    <select value={line.designId} onChange={e=>selectDesign(i,e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal"><option value="">No design selected</option>{designs.filter(d=>d.active&&(!d.customerId||d.customerId===customerId)).map(d=><option key={d.id} value={d.id}>{d.designNo} · {d.name}</option>)}</select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">Description
                    <input value={line.description} onChange={e=>updateLine(i,"description",e.target.value)} placeholder="e.g. Thobe, Clothes" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal"/>
                  </label>
                </div>
                <label className="block text-xs font-semibold text-slate-700">Or upload an image
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>chooseFile(i,e)} className="mt-1.5 block w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2 text-xs font-normal file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700"/>
                </label>
                {line.imagePreview&&<div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2"><img src={line.imagePreview} className="h-14 w-14 rounded-md bg-white object-contain" alt="Invoice item design"/><span className="text-xs text-slate-600">{line.imageFile?.name??"Selected Design Library image"}</span></div>}
                {line.orderId ? <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 sm:p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold text-slate-800">Size-wise billing</p><p className="mt-0.5 text-xs text-slate-500">Set a separate quantity and rate for every size in this order.</p></div><button type="button" onClick={()=>setLines(current=>current.map((item,j)=>j===i?{...item,sizeBreakdowns:[...item.sizeBreakdowns,{size:"",quantity:"",rate:""}]}:item))} className="rounded-md border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">+ Add size</button></div>
                  <div className="hidden grid-cols-[minmax(0,1fr)_minmax(70px,.55fr)_minmax(100px,.75fr)_28px] gap-2 px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:grid"><span>Size</span><span>Quantity</span><span>Rate (K.D.)</span><span></span></div>
                  {line.sizeBreakdowns.length===0&&<p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">No sizes found on this order. Use Add size to enter one.</p>}
                  <div className="space-y-2">
                    {line.sizeBreakdowns.map((row,j)=><div key={j} className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-[minmax(0,1fr)_minmax(70px,.55fr)_minmax(100px,.75fr)_28px] sm:items-center sm:border-0 sm:bg-transparent sm:p-0">
                      <label className="col-span-2 text-[11px] font-medium text-slate-500 sm:col-span-1 sm:text-transparent"><span className="sm:hidden">Size</span><input value={row.size} onChange={e=>updateSizeBreakdown(i,j,"size",e.target.value)} placeholder="e.g. 1yr" aria-label="Size" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-800 sm:mt-0"/></label>
                      <label className="text-[11px] font-medium text-slate-500 sm:text-transparent"><span className="sm:hidden">Quantity</span><input type="number" min="1" value={row.quantity} onChange={e=>updateSizeBreakdown(i,j,"quantity",e.target.value)} placeholder="Qty" aria-label="Quantity" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-800 sm:mt-0"/></label>
                      <label className="text-[11px] font-medium text-slate-500 sm:text-transparent"><span className="sm:hidden">Rate (K.D.)</span><input type="number" min="0" step="0.001" value={row.rate} onChange={e=>updateSizeBreakdown(i,j,"rate",e.target.value)} placeholder="0.000" aria-label="Rate in K.D." className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-800 sm:mt-0"/></label>
                      <button type="button" aria-label="Remove size" onClick={()=>setLines(current=>current.map((item,k)=>k===i?{...item,sizeBreakdowns:item.sizeBreakdowns.filter((_,n)=>n!==j)}:item))} className="col-span-2 justify-self-end rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 sm:col-span-1 sm:justify-self-center">Remove</button>
                    </div>)}
                  </div>
                  <div className="mt-3 flex justify-end border-t border-blue-100 pt-3 text-sm font-semibold text-slate-800">Order subtotal: {money(line.sizeBreakdowns.reduce((sum,row)=>sum+Number(row.quantity||0)*fils(row.rate),0))}</div>
                </div> : <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-800">Manual invoice item</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-slate-700">Quantity<input type="number" min="1" value={line.quantity} onChange={e=>updateLine(i,"quantity",e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal"/></label>
                    <label className="block text-xs font-semibold text-slate-700">Rate (K.D.)<input type="number" min="0" step="0.001" value={line.rate} onChange={e=>updateLine(i,"rate",e.target.value)} placeholder="0.000" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal"/></label>
                  </div>
                  <div className="mt-3 flex justify-end border-t border-slate-200 pt-3 text-sm font-semibold text-slate-800">Item subtotal: {money(Number(line.quantity||0)*fils(line.rate))}</div>
                </div>}
              </div>
            </div>)}
          </div>
          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4"><div className="w-full max-w-xs"><div className="flex justify-between text-lg font-bold text-navy-900"><span>Grand Total</span><span>{money(total)}</span></div><p className="mt-1 text-right text-xs text-slate-500">Amount in words will appear on the printed bill.</p></div></div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><label className="text-sm font-medium text-slate-700">Notes / Terms<textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} placeholder="Optional terms, payment instructions or notes…" className="mt-1.5 w-full p-3"/></label></article>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={()=>navigate("/orders")} className="w-full rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium sm:w-auto sm:py-2.5">Cancel</button><button type="button" disabled={saving} onClick={()=>void save()} className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto sm:py-2.5">{saving?"Creating…":"Create Bill"}</button></div>
      </section>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-2 shadow-sm sm:p-3">
          <div className="mb-3 flex items-center justify-between px-2"><div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Live preview</p><p className="text-sm font-semibold text-navy-900">Customer bill</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">Draft</span></div>
          <div className="min-h-[720px] bg-white p-5 text-[11px] text-slate-800 shadow-sm">
            {(()=>{const shop=shops.find(s=>s.id===shopId);const customer=customers.find(c=>c.id===customerId);return <>
              <InvoiceHeader shop={shop} compact />
              <div className="py-4 text-center"><p className="text-base font-bold underline">INVOICE</p><p className="mt-1">{subject||"Bill / Invoice"}</p></div>
              <div className="grid grid-cols-2 gap-3 border-y border-slate-300 py-3"><div><b>Bill To</b><p>{customer?.name||"Customer"}</p>{customer?.phone?.trim() && customer.phone.trim().toLowerCase() !== "not provided" && <p>{customer.phone}</p>}</div><div className="text-right"><p>Invoice Date: {invoiceDate ? new Date(invoiceDate+"T12:00:00").toLocaleDateString() : "—"}</p><p>Invoice No: {invoiceNo||"Auto"}</p></div></div>
              <table className="mt-4 w-full border-collapse border border-slate-400"><thead><tr><th className="border border-slate-400 p-1">Image</th><th className="border border-slate-400 p-1 text-left">Order</th><th className="border border-slate-400 p-1 text-left">Details</th><th className="border border-slate-400 p-1">Qty</th><th className="border border-slate-400 p-1">Rate</th><th className="border border-slate-400 p-1">Total</th></tr></thead><tbody>{lines.flatMap((l,i)=>l.orderId&&l.sizeBreakdowns.length?l.sizeBreakdowns.filter(row=>row.size&&Number(row.quantity)>0).map((row,j)=><tr key={`${i}-${j}`}><td className="border border-slate-400 p-1 text-center">{l.imagePreview?<img src={l.imagePreview} className="mx-auto h-12 w-12 object-contain" alt=""/>:"—"}</td><td className="border border-slate-400 p-1">{l.orderNo||"—"}</td><td className="border border-slate-400 p-1">{[l.description,row.size].filter(Boolean).join(" ")}</td><td className="border border-slate-400 p-1 text-center">{row.quantity}</td><td className="border border-slate-400 p-1 text-right">{Number(row.rate||0).toFixed(3)}</td><td className="border border-slate-400 p-1 text-right">{(Number(row.quantity||0)*Number(row.rate||0)).toFixed(3)}</td></tr>):Number(l.quantity)>0?[<tr key={i}><td className="border border-slate-400 p-1 text-center">{l.imagePreview?<img src={l.imagePreview} className="mx-auto h-12 w-12 object-contain" alt=""/>:"—"}</td><td className="border border-slate-400 p-1">{l.orderNo||"—"}</td><td className="border border-slate-400 p-1">{l.description}</td><td className="border border-slate-400 p-1 text-center">{l.quantity}</td><td className="border border-slate-400 p-1 text-right">{Number(l.rate||0).toFixed(3)}</td><td className="border border-slate-400 p-1 text-right">{(Number(l.quantity||0)*Number(l.rate||0)).toFixed(3)}</td></tr>]:[])}</tbody></table>
              <div className="mt-4 text-right font-bold">GRAND TOTAL&nbsp;&nbsp; {total?money(total):"K.D. 0.000"}</div>
              {notes&&<div className="mt-3 whitespace-pre-wrap border-t border-slate-300 pt-3">{notes}</div>}
            </>})()}
          </div>
        </div>
      </aside>
    </div>
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5"><h4 className="font-semibold text-navy-900">Invoice history</h4><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="pb-3">Invoice</th><th className="pb-3">Shop</th><th className="pb-3">Customer</th><th className="pb-3">Date</th><th className="pb-3 text-right">Total</th></tr></thead><tbody>{invoices.map(inv=><tr key={inv.id} className="border-b border-slate-50 last:border-0"><td className="py-3"><Link className="font-medium text-blue-700 hover:underline" to={"/bills/"+inv.id}>{inv.invoiceNo}</Link></td><td className="py-3">{inv.shop?.name}</td><td className="py-3">{inv.customer?.name}</td><td className="py-3">{new Date(inv.issuedAt).toLocaleDateString()}</td><td className="py-3 text-right font-semibold">{money(inv.totalFils)}</td></tr>)}</tbody></table></div></section>
  </div>;
}
