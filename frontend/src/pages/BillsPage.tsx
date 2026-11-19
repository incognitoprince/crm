import { useEffect, useState, type ChangeEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createBill, getBill, getBills, getCustomers, getDesigns, getOrders, getShops, resolveMediaUrl, updateBill, uploadInvoiceLineImage } from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { InvoiceHeader } from "../components/InvoiceHeader";
import { LoadingState } from "../components/LoadingState";
import type { Customer, Design, Invoice, Order, Shop } from "../types";

const previewAmountWords=(n:number)=>{
  const ones=["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const tens=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  const under100=(x:number)=>x<20?ones[x]:tens[Math.floor(x/10)]+(x%10?" "+ones[x%10]:"");
  const under1000=(x:number)=>x<100?under100(x):(ones[Math.floor(x/100)]+" hundred"+(x%100?" "+under100(x%100):""));
  if(n===0)return "Zero";
  const dinars=Math.floor(n/1000),fils=n%1000;let out="";
  if(dinars>=1000000)out+=under1000(Math.floor(dinars/1000000))+" million ";
  if(dinars%1000000>=1000)out+=under1000(Math.floor((dinars%1000000)/1000))+" thousand ";
  if(dinars%1000)out+=under1000(dinars%1000)+" ";
  out+="Kuwaiti Dinar";if(fils)out+=" and "+String(fils).padStart(3,"0")+" Fils";
  return out.trim()+" only";
};

const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);
const fils = (value: string) => Math.round(Number(value || 0) * 1000);

type DraftLine = {
  orderId: string;
  orderNo: string;
  description: string;
  orderDate: string;
  sizeBreakdowns: Array<{ size: string; quantity: string; rate: string }>;
  quantity: string;
  rate: string;
  designId: string;
  imageFile: File | null;
  imagePreview: string;
  imagePath: string;
};

const createDraftLine = (): DraftLine => ({ orderId:"", orderNo:"", description:"", orderDate:"", sizeBreakdowns:[], quantity:"1", rate:"", designId:"", imageFile:null, imagePreview:"", imagePath:"" });

export function BillsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingInvoiceId = searchParams.get("edit");
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
  const [lines,setLines]=useState<DraftLine[]>([createDraftLine()]);
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{
      const [b,c,s,d,o,existing]=await Promise.all([
        getBills(),getCustomers(),getShops(),getDesigns(),getOrders(),
        editingInvoiceId ? getBill(editingInvoiceId) : Promise.resolve(null),
      ]);
      setInvoices(b.data);setCustomers(c.data);setShops(s.data);setDesigns(d.data);setOrders(o.data);
      if(existing){
        const invoice=existing.data;
        setShopId(invoice.shopId);setCustomerId(invoice.customerId);setInvoiceNo(invoice.invoiceNo);setInvoiceDate(new Date(invoice.issuedAt).toISOString().slice(0,10));setSubject(invoice.subject??"");setModelNo(invoice.modelNo??"");setNotes(invoice.notes??"");
        setLines(invoice.lines.map(line=>({
          orderId:line.orderId??"",orderNo:line.orderNo??"",description:line.description.replace(/\s*·\s*/g," ").trim(),orderDate:line.orderDate??line.order?.orderDate??"",
          sizeBreakdowns:line.sizeBreakdowns?.map(item=>({size:item.size,quantity:String(item.quantity),rate:(line.unitPriceFils/1000).toFixed(3)}))??[],
          quantity:String(line.quantity),rate:(line.unitPriceFils/1000).toFixed(3),designId:"",imageFile:null,
          imagePreview:line.imagePath?resolveMediaUrl(line.imagePath):"",imagePath:line.imagePath??"",
        })));
      }else if(s.data[0]){
        setShopId(current=>current||s.data[0].id);
      }
    }catch(e){setError(e instanceof Error?e.message:"Unable to load billing data");}finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[editingInvoiceId]);
  const total=lines.reduce((sum,l)=>sum+(l.orderId&&l.sizeBreakdowns.length?l.sizeBreakdowns.reduce((part,row)=>part+(Number(row.quantity||0)*fils(row.rate)),0):Number(l.quantity||0)*fils(l.rate)),0);

  function updateLine(index:number,key: keyof DraftLine,value:DraftLine[keyof DraftLine]){
    setLines(current=>current.map((line,i)=>i===index?{...line,[key]:value}:line));
  }
  function selectOrder(index:number,orderId:string){
    const order=orders.find(item=>item.id===orderId);
    setLines(current=>current.map((line,i)=>i===index?{
      ...line,orderId,orderNo:order?.orderNo??"",description:order?.description??line.description,
      quantity:order?String(order.quantity):line.quantity,orderDate:order?.orderDate??"",
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
      return {...line,designId:"",imageFile:file,imagePreview:preview,imagePath:""};
    }));
  }
  function addLine(){setLines(current=>[...current,createDraftLine()]);}
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
      const payload={
        invoiceNo:invoiceNo||undefined,
        issuedAt:invoiceDate?new Date(invoiceDate+"T12:00:00").toISOString():undefined,
        shopId,customerId,subject:subject||undefined,modelNo:modelNo||undefined,notes:notes||undefined,
        lines:valid.flatMap(l=>{
          const imagePath=l.imageFile?undefined:designs.find(d=>d.id===l.designId)?.imagePath||l.imagePath||undefined;
          const sizes=l.sizeBreakdowns.filter(row=>row.size.trim()&&Number(row.quantity)>0);
          if(l.orderId&&sizes.length)return sizes.map(row=>({orderId:l.orderId,orderNo:l.orderNo.trim()||undefined,imagePath,description:l.description.trim(),sizeBreakdowns:[{size:row.size.trim(),quantity:Number(row.quantity)}],quantity:Number(row.quantity),unitPriceFils:fils(row.rate)}));
          return [{orderId:l.orderId||undefined,orderNo:l.orderNo.trim()||undefined,imagePath,description:l.description.trim(),quantity:Number(l.quantity),unitPriceFils:fils(l.rate)}];
        }),
      };
      const result=editingInvoiceId?await updateBill(editingInvoiceId,payload):await createBill(payload);
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
    }catch(e){setError(e instanceof Error?e.message:(editingInvoiceId?"Unable to update invoice":"Unable to create bill"));}finally{setSaving(false);}
  }

  if(loading)return <LoadingState label="Loading billing workspace…"/>;

  return <div className="mx-auto w-full min-w-0 max-w-[1400px] space-y-4 px-0 sm:space-y-5 sm:px-1">
    <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Invoices</p><h3 className="mt-1 text-2xl font-semibold text-navy-900">{editingInvoiceId?"Edit Invoice":"Bills / Invoices"}</h3><p className="mt-1 text-sm text-slate-600">{editingInvoiceId?"Update any invoice detail, line item, quantity, rate or image.":"Select one order, then enter a separate quantity and rate for each size. Add another item only when billing a different order or garment."}</p></div>
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
            <label className="text-sm font-medium text-slate-700">Customer<select value={customerId} onChange={e=>{setCustomerId(e.target.value);setLines(current=>current.map(line=>({...line,orderId:"",orderNo:"",orderDate:""})));}} className="mt-1.5 h-11 w-full px-3"><option value="">Select customer…</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}{c.phone?.trim() && c.phone.trim().toLowerCase() !== "not provided" ? ` · ${c.phone}` : ""}</option>)}</select></label>
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
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={()=>navigate(editingInvoiceId?"/bills/"+editingInvoiceId:"/orders")} className="w-full rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium sm:w-auto sm:py-2.5">Cancel</button><button type="button" disabled={saving} onClick={()=>void save()} className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto sm:py-2.5">{saving?(editingInvoiceId?"Updating…":"Creating…"):(editingInvoiceId?"Update Invoice":"Create Bill")}</button></div>
      </section>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-2 shadow-sm sm:p-3">
          <div className="mb-3 flex items-center justify-between px-2"><div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Live preview</p><p className="text-sm font-semibold text-navy-900">Customer bill</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{editingInvoiceId?"Editing":"Draft"}</span></div>
          <div className="invoice-paper min-w-0 overflow-hidden bg-white p-2 text-[12px] text-slate-900 shadow-sm sm:p-3">
            {(()=>{const shop=shops.find(s=>s.id===shopId);const customer=customers.find(c=>c.id===customerId);const previewRows=lines.flatMap((l,i)=>l.orderId&&l.sizeBreakdowns.length?l.sizeBreakdowns.filter(row=>row.size.trim()&&Number(row.quantity)>0).map((row,j)=>({key:i+"-"+j,line:l,size:row.size,quantity:Number(row.quantity),rate:Number(row.rate||0),total:Number(row.quantity||0)*Number(row.rate||0)})):Number(l.quantity)>0?[{key:String(i),line:l,size:"—",quantity:Number(l.quantity),rate:Number(l.rate||0),total:Number(l.quantity||0)*Number(l.rate||0)}]:[]);return <>
              <InvoiceHeader shop={shop}/>
              <div className="py-2 text-center"><h1 className="text-xl font-bold underline">INVOICE</h1></div>
              <div className="grid gap-3 border-y border-slate-700 py-2 text-sm sm:grid-cols-2">
                <div><p className="font-bold">Bill To</p><p>{customer?.name||"Customer"}</p>{subject&&<p className="text-xs">Subject: {subject}</p>}{customer?.phone?.trim()&&customer.phone.trim().toLowerCase()!=="not provided"&&<p>{customer.phone}</p>}{customer?.address?.trim()&&customer.address.trim().toLowerCase()!=="not provided"&&<p className="break-words">{customer.address}</p>}</div>
                <div className="sm:text-right"><p>Invoice Date: {invoiceDate?new Date(invoiceDate+"T12:00:00").toLocaleDateString("en-GB"):"—"}</p><p>Invoice No: {invoiceNo||"Auto"}</p>{modelNo&&<p>Model No: {modelNo}</p>}</div>
              </div>
              <div className="mt-2 overflow-x-auto border border-slate-700">
                <table className="w-full min-w-[720px] table-fixed border-collapse text-[12px] leading-snug sm:text-[13px]">
                  <thead><tr className="bg-slate-50">
                    <th className="w-[10%] break-words border border-slate-700 p-1.5 align-middle">Image</th>
                    <th className="w-[12%] whitespace-nowrap border border-slate-700 p-1.5 align-middle">Order No</th>
                    <th className="w-[17%] break-words border border-slate-700 p-1.5 align-middle">Order Date &amp; Time</th>
                    <th className="w-[22%] break-words border border-slate-700 p-1.5 align-middle">Order Details</th>
                    <th className="w-[10%] break-words border border-slate-700 p-1.5 align-middle">Size</th>
                    <th className="w-[8%] whitespace-nowrap border border-slate-700 p-1.5 align-middle">Quantity</th>
                    <th className="w-[10%] break-words border border-slate-700 p-1.5 align-middle">Rate Per Piece<br/>(K.D.)</th>
                    <th className="w-[11%] break-words border border-slate-700 p-1.5 align-middle">Total</th>
                  </tr></thead>
                  <tbody>{previewRows.map(row=><tr key={row.key} className="align-middle">
                    <td className="border border-slate-700 p-1 text-center align-middle">{row.line.imagePreview?<img src={row.line.imagePreview} className="mx-auto h-12 w-12 max-w-full object-contain" alt="Design"/>:"—"}</td>
                    <td className="whitespace-nowrap border border-slate-700 p-1.5 text-center text-[11px] align-middle">{row.line.orderNo||"—"}</td>
                    <td className="break-words border border-slate-700 p-1.5 text-center text-[11px] align-middle">{row.line.orderDate?new Date(row.line.orderDate).toLocaleString("en-GB"):"—"}</td>
                    <td className="break-words border border-slate-700 p-1.5 text-center align-middle">{row.line.description.replace(/\s*·\s*/g," ").trim()||"—"}</td>
                    <td className="break-words border border-slate-700 p-1.5 text-center align-middle">{row.size}</td>
                    <td className="break-words border border-slate-700 p-1.5 text-center align-middle">{row.quantity}</td>
                    <td className="break-words border border-slate-700 p-1.5 text-center align-middle">{row.rate.toFixed(3)}</td>
                    <td className="break-words border border-slate-700 p-1.5 text-right align-middle">{row.total.toFixed(3)}</td>
                  </tr>)}</tbody>
                  <tfoot>
                    <tr><td colSpan={5} className="border border-slate-700 p-2 font-bold">TOTAL QTY: {previewRows.reduce((sum,row)=>sum+row.quantity,0)}</td><td colSpan={2} className="border border-slate-700 p-2 text-right font-bold">GRAND TOTAL</td><td className="border border-slate-700 p-2 text-right font-bold">{(total/1000).toFixed(3)}</td></tr>
                    <tr><td colSpan={8} className="break-words border border-slate-700 p-2 text-center font-bold uppercase">{previewAmountWords(Math.round(total))}</td></tr>
                  </tfoot>
                </table>
              </div>
              {notes&&<div className="mt-3 whitespace-pre-wrap break-words border-t border-slate-700 pt-2 text-sm">{notes}</div>}
              <div className="mt-6 grid grid-cols-2 gap-8 text-sm"><div className="border-t border-slate-500 pt-2">Receiver's Sign.</div><div className="border-t border-slate-500 pt-2 text-right">Salesman Sign.</div></div>
            </>})()}
          </div>
        </div>
      </aside>
    </div>
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5"><h4 className="font-semibold text-navy-900">Invoice history</h4><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="pb-3">Invoice</th><th className="pb-3">Shop</th><th className="pb-3">Customer</th><th className="pb-3">Date</th><th className="pb-3 text-right">Total</th></tr></thead><tbody>{invoices.map(inv=><tr key={inv.id} className="border-b border-slate-50 last:border-0"><td className="py-3"><div className="flex items-center gap-3"><Link className="font-medium text-blue-700 hover:underline" to={"/bills/"+inv.id}>{inv.invoiceNo}</Link><Link className="text-xs font-medium text-slate-600 hover:text-blue-700 hover:underline" to={"/bills?edit="+inv.id}>Edit</Link></div></td><td className="py-3">{inv.shop?.name}</td><td className="py-3">{inv.customer?.name}</td><td className="py-3">{new Date(inv.issuedAt).toLocaleDateString()}</td><td className="py-3 text-right font-semibold">{money(inv.totalFils)}</td></tr>)}</tbody></table></div></section>
  </div>;
}
