import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Link, useParams } from "react-router-dom";
import { getBill, resolveMediaUrl } from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { InvoiceHeader } from "../components/InvoiceHeader";
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

     const widths=["10%","12%","17%","22%","10%","8%","10%","11%"];
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
     const canvas = await html2canvas(clone,{
       backgroundColor:"#ffffff",
       scale:2,
       useCORS:true,
       allowTaint:false,
       logging:false,
       width:INVOICE_CAPTURE_WIDTH,
       windowWidth:INVOICE_CAPTURE_WIDTH
     });
     const scale = canvas.width / clone.offsetWidth;
     const table = clone.querySelector<HTMLTableElement>("[data-invoice-table]");
     const headerRow = table?.querySelector("thead tr");
     const headerRect = headerRow?.getBoundingClientRect();
     const cloneTop = clone.getBoundingClientRect().top;
     const rowBounds = Array.from(table?.querySelectorAll("tbody tr, tfoot tr") ?? []).map(row => {
       const rect = row.getBoundingClientRect();
       return { top: Math.round((rect.top - cloneTop) * scale), bottom: Math.round((rect.bottom - cloneTop) * scale) };
     });
     const headerBounds = headerRect ? {
       top: Math.round((headerRect.top - cloneTop) * scale),
       height: Math.round(headerRect.height * scale)
     } : { top: 0, height: 0 };
     return { canvas, rowBounds, headerBounds };
   }finally{
     clone.remove();
   }
 }

 async function createInvoiceImage(){
   const {canvas}=await createInvoiceCanvas();
   return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Unable to create invoice image")),"image/png"));
 }

 async function downloadImage(){
   if(!invoice)return;
   setBusy(true);setError("");
   try{
     const blob=await createInvoiceImage();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`invoice-${invoice.invoiceNo}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   }catch(e){setError(e instanceof Error?e.message:"Unable to create invoice image");}finally{setBusy(false);}
 }

 async function createInvoicePdfParts(){
   if(!invoiceRef.current)throw new Error("Invoice is not ready");
   await document.fonts?.ready;
   const clone=invoiceRef.current.cloneNode(true) as HTMLElement;
   clone.style.width=INVOICE_CAPTURE_WIDTH+"px";clone.style.minWidth=INVOICE_CAPTURE_WIDTH+"px";clone.style.maxWidth=INVOICE_CAPTURE_WIDTH+"px";
   clone.style.boxSizing="border-box";clone.style.position="absolute";clone.style.left="-100000px";clone.style.top="0";clone.style.margin="0";clone.style.overflow="visible";clone.style.backgroundColor="#fff";
   const wrap=clone.querySelector<HTMLElement>("[data-invoice-table-wrap]");if(wrap){wrap.style.overflow="visible";wrap.style.width="100%";}
   const table=clone.querySelector<HTMLTableElement>("[data-invoice-table]");if(!table)throw new Error("Invoice table is missing");
   table.style.width="100%";table.style.minWidth="0";table.style.maxWidth="100%";table.style.tableLayout="fixed";table.style.borderCollapse="collapse";
   const widths=["10%","12%","17%","22%","10%","8%","10%","11%"];
   table.querySelectorAll("thead tr, tbody tr").forEach(row=>row.querySelectorAll<HTMLElement>("th,td").forEach((cell,index)=>{if(index<widths.length)cell.style.width=widths[index];cell.style.maxWidth="none";cell.style.overflowWrap="break-word";cell.style.wordBreak="normal";cell.style.whiteSpace="normal";}));
   clone.querySelectorAll<HTMLElement>("[data-invoice-nowrap]").forEach(el=>{el.style.whiteSpace="normal";el.style.overflowWrap="break-word";el.style.wordBreak="normal";});
   document.body.appendChild(clone);
   try{
     await Promise.all(Array.from(clone.querySelectorAll("img")).map(async img=>{if(!img.complete)await new Promise<void>(resolve=>{img.addEventListener("load",()=>resolve(),{once:true});img.addEventListener("error",()=>resolve(),{once:true});});if(img.decode)try{await img.decode();}catch{}}));
     await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
     const capture=(element:HTMLElement)=>html2canvas(element,{backgroundColor:"#fff",scale:2,useCORS:true,allowTaint:false,logging:false,width:INVOICE_CAPTURE_WIDTH,windowWidth:INVOICE_CAPTURE_WIDTH});
     const header=clone.querySelector<HTMLElement>("[data-invoice-header]");const summary=clone.querySelector<HTMLElement>("[data-invoice-summary]");const footer=clone.querySelector<HTMLElement>("[data-invoice-footer]");
     if(!header||!summary||!footer)throw new Error("Invoice print sections are incomplete");
     const makeTablePart=(sectionName:"thead"|"tbody"|"tfoot",row?:Element)=>{const w=document.createElement("div");w.style.width=INVOICE_CAPTURE_WIDTH+"px";w.style.background="#fff";const t=table.cloneNode(false) as HTMLTableElement;t.style.width="100%";t.style.minWidth="0";t.style.maxWidth="100%";if(sectionName==="tbody"){const body=document.createElement("tbody");if(row)body.appendChild(row.cloneNode(true));t.appendChild(body);}else{const section=table.querySelector(sectionName);if(section)t.appendChild(section.cloneNode(true));}w.appendChild(t);clone.appendChild(w);return w;};
     const tableHeader=await capture(makeTablePart("thead"));const rows:HTMLCanvasElement[]=[];
     for(const row of Array.from(table.querySelectorAll("tbody tr")))rows.push(await capture(makeTablePart("tbody",row)));
     const footerWrap=document.createElement("div");footerWrap.style.width=INVOICE_CAPTURE_WIDTH+"px";footerWrap.style.background="#fff";footerWrap.appendChild(makeTablePart("tfoot"));footerWrap.appendChild(footer.cloneNode(true));clone.appendChild(footerWrap);
     return {header:await capture(header),summary:await capture(summary),tableHeader,rows,footer:await capture(footerWrap)};
   }finally{clone.remove();}
 }

 async function downloadPdf(){
   if(!invoice)return;
   setBusy(true);setError("");
   try{
     const parts=await createInvoicePdfParts();
     const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
     const pageWidth=pdf.internal.pageSize.getWidth(),pageHeight=pdf.internal.pageSize.getHeight(),margin=8;
     const contentWidth=pageWidth-margin*2,bottom=pageHeight-margin;
     const imageHeight=(canvas:HTMLCanvasElement)=>canvas.height*contentWidth/canvas.width;
     let y=margin;
     const addCanvas=(canvas:HTMLCanvasElement)=>{const h=imageHeight(canvas);pdf.addImage(canvas.toDataURL("image/jpeg",0.96),"JPEG",margin,y,contentWidth,h);y+=h;};
     addCanvas(parts.header);addCanvas(parts.summary);addCanvas(parts.tableHeader);
     for(const row of parts.rows){const h=imageHeight(row);if(y+h>bottom){pdf.addPage();y=margin;addCanvas(parts.tableHeader);}if(y+h>bottom)throw new Error("An invoice row is taller than the available PDF page height");addCanvas(row);}
     const footerHeight=imageHeight(parts.footer);if(y+footerHeight>bottom){pdf.addPage();y=margin;}if(y+footerHeight>bottom)throw new Error("Invoice totals and signatures do not fit together on one page");addCanvas(parts.footer);
     pdf.save("invoice-"+invoice.invoiceNo+".pdf");
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
      <Link to={`/bills?edit=${invoice.id}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800">Edit Invoice</Link>
      <button disabled={busy} onClick={()=>void downloadPdf()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Download PDF</button>
      <button disabled={busy} onClick={()=>void downloadImage()} className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50">Download Image</button>
      <button disabled={busy} onClick={()=>void shareImage()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50">{busy?"Preparing…":"Share Image"}</button>
      <button disabled={busy} onClick={()=>window.print()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">Print</button>
    </div>
   </div>
   {error&&<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 print:hidden">{error}</div>}

   <article ref={invoiceRef} className="invoice-paper invoice-printable min-w-0 w-full overflow-hidden bg-white p-2 text-slate-900 shadow-[0_8px_35px_rgba(15,31,53,.10)] sm:p-3 md:p-4 print:p-0 print:shadow-none">
     <div data-invoice-header><InvoiceHeader shop={shop} /></div>

     <div data-invoice-summary><div className="py-2 text-center"><h1 className="text-xl font-bold underline">INVOICE</h1></div>

     <div className="grid gap-3 border-y border-slate-700 py-2 text-sm sm:grid-cols-2">
       <div><p className="font-bold">Bill To</p><p data-invoice-nowrap>{customer?.name ?? "Customer"}</p>{invoice.subject && <p className="text-xs">Subject: {invoice.subject}</p>}{customer?.phone?.trim() && customer.phone.trim().toLowerCase() !== "not provided" && <p data-invoice-nowrap>{customer.phone}</p>}{customer?.address?.trim() && customer.address.trim().toLowerCase() !== "not provided" && <p className="break-words">{customer.address}</p>}</div>
       <div className="sm:text-right"><p data-invoice-nowrap>Invoice Date: {date(invoice.issuedAt)}</p><p data-invoice-nowrap>Invoice No: {invoice.invoiceNo}</p>{invoice.modelNo&&<p data-invoice-nowrap>Model No: {invoice.modelNo}</p>}</div>
     </div></div>

     <div data-invoice-table-wrap className="mt-2 overflow-x-auto border border-slate-700">
       <table data-invoice-table className="w-full min-w-[720px] table-fixed border-collapse text-[12px] leading-snug sm:text-[13px]">
        <thead>
          <tr className="bg-slate-50">
            <th className="w-[10%] break-words border border-slate-700 p-1.5 align-middle">Image</th>
            <th className="w-[12%] whitespace-nowrap border border-slate-700 p-1.5 align-middle">Order No</th>
            <th className="w-[17%] break-words border border-slate-700 p-1.5 align-middle">Order Date &amp; Time</th>
            <th className="w-[22%] break-words border border-slate-700 p-1.5 align-middle">Order Details</th>
            <th className="w-[10%] break-words border border-slate-700 p-1.5 align-middle">Size</th>
            <th className="w-[8%] whitespace-nowrap border border-slate-700 p-1.5 align-middle">Quantity</th>
            <th className="w-[10%] break-words border border-slate-700 p-1.5 align-middle">Rate Per Piece<br/>(K.D.)</th>
            <th className="w-[11%] break-words border border-slate-700 p-1.5 align-middle">Total</th>
          </tr>
        </thead>
        <tbody>{invoice.lines.map(line=><tr key={line.id} className="align-middle">
          <td className="border border-slate-700 p-1 text-center align-middle">{line.imagePath?<img data-invoice-design-image src={resolveMediaUrl(line.imagePath)} className="mx-auto h-12 w-12 max-w-full object-contain" alt="Design"/>:"—"}</td>
          <td className="whitespace-nowrap border border-slate-700 p-1.5 text-center text-[11px] align-middle">{line.orderNo??line.order?.orderNo??"—"}</td>
          <td className="break-words border border-slate-700 p-1.5 text-center text-[11px] align-middle">{line.orderDate?new Date(line.orderDate).toLocaleString("en-GB"):"—"}</td>
          <td className="break-words border border-slate-700 p-1.5 text-center align-middle">{line.description.replace(/\s*·\s*/g," ").trim() || "—"}</td>
          <td className="break-words border border-slate-700 p-1.5 text-center align-middle">{line.sizeBreakdowns?.map(item => item.size).join(", ") || "—"}</td>
          <td className="break-words border border-slate-700 p-2 text-center">{line.quantity}</td>
          <td className="break-words border border-slate-700 p-2 text-center">{(line.unitPriceFils/1000).toFixed(3)}</td>
          <td className="break-words border border-slate-700 p-1.5 text-right align-middle">{(line.totalFils/1000).toFixed(3)}</td>
        </tr>)}</tbody>
        <tfoot>
          <tr>
            <td colSpan={5} className="border border-slate-700 p-2 font-bold">TOTAL QTY: {totalQty}</td>
            <td colSpan={2} className="border border-slate-700 p-2 text-right font-bold">GRAND TOTAL</td>
            <td className="border border-slate-700 p-2 text-right font-bold">{(invoice.totalFils/1000).toFixed(3)}</td>
          </tr>
          <tr><td colSpan={8} className="break-words border border-slate-700 p-2 text-center font-bold uppercase">{words(invoice.totalFils)}</td></tr>
        </tfoot>
       </table>
     </div>

     <div data-invoice-footer>
       {invoice.notes&&<div className="mt-3 whitespace-pre-wrap break-words border-t border-slate-700 pt-2 text-sm">{invoice.notes}</div>}
       <div className="mt-6 grid grid-cols-2 gap-8 text-sm"><div className="border-t border-slate-500 pt-2">Receiver's Sign.</div><div className="border-t border-slate-500 pt-2 text-right">Salesman Sign.</div></div>
     </div>
   </article>
 </div>;
}
