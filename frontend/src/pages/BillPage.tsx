import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Link, useParams } from "react-router-dom";
import { getBill } from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import type { Invoice } from "../types";

const date=(v:string)=>new Date(v).toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"});
const INVOICE_CAPTURE_WIDTH = 794; // A4 width at 96 CSS DPI.

function words(n:number){
  const ones=["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const tens=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  const under100=(x:number)=>x<20?ones[x]:tens[Math.floor(x/10)]+(x%10?" "+ones[x%10]:"");
  const under1000=(x:number)=>x<100?under100(x):(ones[Math.floor(x/100)]+" hundred"+(x%100?" "+under100(x%100):""));
  if(n===0)return "Zero";
  const dinars=Math.floor(n/1000), fils=n%1000; let out="";
  if(dinars>=1000000)out+=under1000(Math.floor(dinars/1000000))+" million ";
  if(dinars%1000000>=1000)out+=under1000(Math.floor((dinars%1000000)/1000))+" thousand ";
  if(dinars%1000)out+=under1000(dinars%1000)+" ";
  out+="Kuwaiti Dinar"; if(fils)out+=" and "+String(fils).padStart(3,"0")+" Fils";
  return out.trim()+" only";
}

export function BillPage(){
 const {id}=useParams(); const [invoice,setInvoice]=useState<Invoice|null>(null); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const invoiceRef=useRef<HTMLElement|null>(null);

 async function createInvoiceCanvas(){
   if(!invoiceRef.current)throw new Error("Invoice is not ready");
   await document.fonts?.ready;

   // Render a dedicated A4-width copy for downloads. This prevents the
   // mobile viewport/overflow container from clipping the right side of
   // the invoice when html2canvas captures it.
   const source=invoiceRef.current;
   const clone=source.cloneNode(true) as HTMLElement;
   clone.style.width=`${INVOICE_CAPTURE_WIDTH}px`;
   clone.style.minWidth=`${INVOICE_CAPTURE_WIDTH}px`;
   clone.style.maxWidth=`${INVOICE_CAPTURE_WIDTH}px`;
   clone.style.boxSizing="border-box";
   clone.style.position="absolute";
   clone.style.left="-100000px";
   clone.style.top="0";
   clone.style.margin="0";
   clone.style.overflow="visible";
   clone.style.backgroundColor="#ffffff";

   const tableWrap=clone.querySelector<HTMLElement>("[data-invoice-table-wrap]");
   if(tableWrap){
     tableWrap.style.overflow="visible";
     tableWrap.style.width="100%";
   }

   const table=clone.querySelector<HTMLTableElement>("[data-invoice-table]");
   if(table){
     table.style.width="100%";
     table.style.minWidth="0";
     table.style.maxWidth="100%";
     table.style.tableLayout="fixed";
     table.style.borderCollapse="collapse";

     const widths=["12%","13%","19%","24%","9%","11%","12%"];
     table.querySelectorAll("tr").forEach(row=>{
       row.querySelectorAll<HTMLElement>("th,td").forEach((cell,index)=>{
         if(index<widths.length)cell.style.width=widths[index];
         cell.style.maxWidth="0";
         cell.style.overflowWrap="anywhere";
         cell.style.wordBreak="break-word";
         cell.style.whiteSpace="normal";
       });
     });
   }

   clone.querySelectorAll<HTMLElement>("[data-invoice-nowrap]").forEach(el=>{
     el.style.whiteSpace="normal";
     el.style.overflowWrap="anywhere";
     el.style.wordBreak="break-word";
   });

   document.body.appendChild(clone);
   try{
     await Promise.all(Array.from(clone.querySelectorAll("img")).map(img=>{
       if(img.complete)return Promise.resolve();
       return new Promise<void>(resolve=>{img.addEventListener("load",()=>resolve(),{once:true});img.addEventListener("error",()=>resolve(),{once:true});});
     }));
     await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
     return await html2canvas(clone,{
       backgroundColor:"#ffffff",
       scale:2,
       useCORS:true,
       allowTaint:false,
       logging:false,
       width:INVOICE_CAPTURE_WIDTH,
       windowWidth:INVOICE_CAPTURE_WIDTH
     });
   }finally{
     clone.remove();
   }
 }

 async function createInvoiceImage(){
   const canvas=await createInvoiceCanvas();
   return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Unable to create invoice image")),"image/png"));
 }

 async function downloadImage(){
   if(!invoice)return;
   setBusy(true);setError("");
   try{
     const blob=await createInvoiceImage();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`invoice-${invoice.invoiceNo}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   }catch(e){setError(e instanceof Error?e.message:"Unable to create invoice image");}finally{setBusy(false);}
 }

 async function downloadPdf(){
   if(!invoice)return;
   setBusy(true);setError("");
   try{
     const canvas=await createInvoiceCanvas();
     const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
     const pageWidth=pdf.internal.pageSize.getWidth();const pageHeight=pdf.internal.pageSize.getHeight();
     const imageWidth=pageWidth;const imageHeight=(canvas.height*imageWidth)/canvas.width;
     const pageCount=Math.max(1,Math.ceil(imageHeight/pageHeight));
     for(let page=0;page<pageCount;page++){
       if(page>0)pdf.addPage();
       pdf.addImage(canvas.toDataURL("image/jpeg",0.95),"JPEG",0,-page*pageHeight,imageWidth,imageHeight);
     }
     pdf.save(`invoice-${invoice.invoiceNo}.pdf`);
   }catch(e){setError(e instanceof Error?e.message:"Unable to create invoice PDF");}finally{setBusy(false);}
 }

 async function shareImage(){
   if(!invoice)return;
   setBusy(true);setError("");
   try{
     const blob=await createInvoiceImage();
     const file=new File([blob],`invoice-${invoice.invoiceNo}.png`,{type:"image/png"});
     if(!navigator.share || !navigator.canShare || !navigator.canShare({files:[file]})){
       throw new Error("Direct image sharing requires HTTPS and a browser/device that supports file sharing. Please use Download Image on this device.");
     }
     await navigator.share({title:`Invoice ${invoice.invoiceNo}`,text:`Invoice ${invoice.invoiceNo}`,files:[file]});
   }catch(e){
     if(e instanceof DOMException && e.name==="AbortError")return;
     setError(e instanceof Error?e.message:"Unable to share invoice image");
   }finally{setBusy(false);}
 }

 useEffect(()=>{if(id)getBill(id).then(r=>setInvoice(r.data)).catch(e=>setError(e instanceof Error?e.message:"Unable to load invoice"));},[id]);
 if(error&&!invoice)return <ErrorState message={error}/>; if(!invoice)return <LoadingState label="Loading invoice…"/>;
 const shop=invoice.shop ?? invoice.order?.shop ?? null, customer=invoice.customer ?? invoice.order?.customer ?? null;
 const totalQty=invoice.lines.reduce((s,l)=>s+l.quantity,0);

 return <div className="mx-auto max-w-[1050px] space-y-5">
   <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
    <Link to="/bills" className="text-sm font-medium text-blue-700">← Back to Bills</Link>
    <div className="flex flex-wrap gap-2">
      <button disabled={busy} onClick={()=>void downloadPdf()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Download PDF</button>
      <button disabled={busy} onClick={()=>void downloadImage()} className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50">Download Image</button>
      <button disabled={busy} onClick={()=>void shareImage()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50">{busy?"Preparing…":"Share Image"}</button>
      <button disabled={busy} onClick={()=>window.print()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">Print</button>
    </div>
   </div>
   {error&&<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 print:hidden">{error}</div>}

   <article ref={invoiceRef} className="invoice-paper invoice-printable min-w-0 w-full overflow-hidden bg-white p-3 text-slate-900 shadow-[0_8px_35px_rgba(15,31,53,.10)] sm:p-5 md:p-7 print:p-0 print:shadow-none">
     <header className="border-b-2 border-slate-800 pb-3">
       <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[90px_minmax(0,1fr)] sm:gap-3 md:grid-cols-[110px_minmax(0,1fr)] md:gap-4">
         <div className="flex justify-start">{shop?.logoUrl&&<img crossOrigin="anonymous" src={shop.logoUrl} className="max-h-20 max-w-28 object-contain" alt="Shop logo"/>}</div>
         <div className="min-w-0 text-center">
           {shop?.arabicName&&<p className="break-words text-base font-semibold sm:text-lg md:text-xl">{shop.arabicName}</p>}
           {shop?.englishName&&<p className="break-words text-base font-bold sm:text-lg md:text-xl">{shop.englishName}</p>}
           {!shop?.arabicName&&!shop?.englishName&&<p className="break-words text-base font-bold sm:text-lg md:text-xl">{shop?.name ?? "Tailor Shop"}</p>}
           {shop?.address&&<p className="mt-1 break-words text-[9px] leading-tight whitespace-pre-line sm:text-[10px]">{shop.address}</p>}
           {(shop?.phone||shop?.whatsapp||shop?.email)&&<div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[9px] font-medium sm:flex-nowrap sm:whitespace-nowrap sm:gap-3 sm:text-xs">
             {(shop?.phone||shop?.whatsapp)&&<span>Tel/WhatsApp: {shop.phone||shop.whatsapp}</span>}
             {shop?.email&&<span>Email: {shop.email}</span>}
           </div>}
         </div>
       </div>
     </header>

     <div className="py-4 text-center"><h1 className="text-xl font-bold underline">INVOICE</h1>{invoice.subject&&<p className="mt-1 text-sm break-words">{invoice.subject}</p>}</div>

     <div className="grid gap-4 border-y border-slate-700 py-3 text-sm sm:grid-cols-2">
       <div><p className="font-bold">Bill To</p><p data-invoice-nowrap>{customer?.name ?? "Customer"}</p>{customer?.phone?.trim() && customer.phone.trim().toLowerCase() !== "not provided" && <p data-invoice-nowrap>{customer.phone}</p>}{customer?.address?.trim() && customer.address.trim().toLowerCase() !== "not provided" && <p className="break-words">{customer.address}</p>}</div>
       <div className="sm:text-right"><p data-invoice-nowrap>Invoice Date: {date(invoice.issuedAt)}</p><p data-invoice-nowrap>Invoice No: {invoice.invoiceNo}</p>{invoice.modelNo&&<p data-invoice-nowrap>Model No: {invoice.modelNo}</p>}</div>
     </div>

     <div data-invoice-table-wrap className="mt-4 overflow-x-auto border border-slate-700">
       <table data-invoice-table className="w-full min-w-[620px] table-fixed border-collapse text-[10px] sm:text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="w-[12%] break-words border border-slate-700 p-2">Image</th>
            <th className="w-[13%] break-words border border-slate-700 p-2">Order No</th>
            <th className="w-[19%] break-words border border-slate-700 p-2">Order Date &amp; Time</th>
            <th className="w-[24%] break-words border border-slate-700 p-2">Order Details</th>
            <th className="w-[9%] break-words border border-slate-700 p-2">Quantity</th>
            <th className="w-[11%] break-words border border-slate-700 p-2">Rate Per Piece<br/>(K.D.)</th>
            <th className="w-[12%] break-words border border-slate-700 p-2">Total</th>
          </tr>
        </thead>
        <tbody>{invoice.lines.map(line=><tr key={line.id}>
          <td className="border border-slate-700 p-1 text-center">{line.imagePath?<img crossOrigin="anonymous" src={line.imagePath} className="mx-auto h-16 w-16 max-w-full object-contain" alt="Design"/>:"—"}</td>
          <td className="break-words border border-slate-700 p-2 text-center">{line.orderNo??line.order?.orderNo??"—"}</td>
          <td className="break-words border border-slate-700 p-2 text-center">{line.orderDate?new Date(line.orderDate).toLocaleString("en-GB"):"—"}</td>
          <td className="break-words border border-slate-700 p-2 text-center">{line.description}</td>
          <td className="break-words border border-slate-700 p-2 text-center">{line.quantity}</td>
          <td className="break-words border border-slate-700 p-2 text-center">{(line.unitPriceFils/1000).toFixed(3)}</td>
          <td className="break-words border border-slate-700 p-2 text-right">{(line.totalFils/1000).toFixed(3)}</td>
        </tr>)}</tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="border border-slate-700 p-2 font-bold">TOTAL QTY: {totalQty}</td>
            <td colSpan={2} className="border border-slate-700 p-2 text-right font-bold">GRAND TOTAL</td>
            <td className="border border-slate-700 p-2 text-right font-bold">{(invoice.totalFils/1000).toFixed(3)}</td>
          </tr>
          <tr><td colSpan={7} className="break-words border border-slate-700 p-2 text-center font-bold uppercase">{words(invoice.totalFils)}</td></tr>
        </tfoot>
       </table>
     </div>

     {invoice.notes&&<div className="mt-5 whitespace-pre-wrap break-words border-t border-slate-700 pt-4 text-sm">{invoice.notes}</div>}
     <div className="mt-12 grid grid-cols-2 gap-10 text-sm"><div className="border-t border-slate-500 pt-2">Receiver's Sign.</div><div className="border-t border-slate-500 pt-2 text-right">Salesman Sign.</div></div>
   </article>
 </div>;
}
