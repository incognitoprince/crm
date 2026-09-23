import { useEffect, useRef, useState, type FormEvent } from "react";
import { createDesign, createGarment, getDesigns, getGarments, updateDesign, uploadDesignImage } from "../services/api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import type { Design, Garment } from "../types";

const label = (v: string) => v.replaceAll("_", " ");

export function DesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<Design | null>(null);
  const [newGarmentName, setNewGarmentName] = useState("");
  const [showGarmentForm, setShowGarmentForm] = useState(false);
  const [filter, setFilter] = useState("");
  const [designNo, setDesignNo] = useState("");
  const [name, setName] = useState("");
  const [garment, setGarment] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function load() {
    try {
      const [d, g] = await Promise.all([getDesigns(), getGarments()]);
      setDesigns(d.data);
      setGarments(g.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load designs");
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createDesign({ designNo, name, garment, description: description || undefined });
      setDesignNo("");
      setName("");
      setDescription("");
      setGarment("");
      setShowGarmentForm(false);
      setShow(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create design");
    } finally {
      setSaving(false);
    }
  }

  async function image(id: string, file?: File) {
    if (!file) return;
    try {
      await uploadDesignImage(id, file);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to upload image");
    }
  }

  async function addGarment() {
    const name = newGarmentName.trim();
    if (!name) return;
    setError("");
    try {
      const result = await createGarment({ name });
      setGarments(current => [...current, result.data].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
      setNewGarmentName("");
      setShowGarmentForm(false);
      setGarment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to add garment");
    }
  }

  function openDesign(design: Design) {
    setShow(false);
    setShowGarmentForm(false);
    setSelected(design);
    setDesignNo(design.designNo);
    setName(design.name);
    setGarment(design.garmentMaster?.name ?? design.garment);
    setDescription(design.description ?? "");
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await updateDesign(selected.id, {
        designNo,
        name,
        garment,
        description: description || null,
      });
      setSelected(null);
      setDesignNo("");
      setName("");
      setGarment("");
      setDescription("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update design");
    } finally {
      setSaving(false);
    }
  }

  const visible = filter ? designs.filter(d => d.garment === filter) : designs;

  return <div className="mx-auto max-w-6xl space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Library</p><h3 className="text-2xl font-semibold text-navy-900">Designs</h3><p className="text-sm text-slate-600">Reusable designs. Order-specific customer designs are stored directly on the order.</p></div>
      <button onClick={() => { setSelected(null); setShow(v => !v); setDesignNo(""); setName(""); setGarment(""); setDescription(""); setShowGarmentForm(false); }} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white">{show ? "Close" : "+ Add design"}</button>
    </div>
    {error && <ErrorState message={error} />}
    {show && <section className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs uppercase tracking-wide text-slate-500">Design details</p><h4 className="mt-1 text-xl font-semibold text-navy-900">Add new design</h4></div>
        <button type="button" onClick={() => setShow(false)} className="text-sm text-slate-500 hover:underline">Close</button>
      </div>
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-4">
        <input required value={designNo} onChange={e => setDesignNo(e.target.value)} placeholder="Design number" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input required value={name} onChange={e => setName(e.target.value)} placeholder="Design name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <div className="text-sm">
          <span>Garment</span>
          <select required value={garment} onChange={e => setGarment(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"><option value="">Choose garment…</option>{garments.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}</select>
          <button type="button" onClick={() => setShowGarmentForm(v => !v)} className="mt-2 text-xs font-medium text-navy-900 hover:underline">+ Add garment</button>
          {showGarmentForm && <div className="mt-2 flex gap-2 rounded-lg bg-slate-50 p-2"><input autoFocus value={newGarmentName} onChange={e => setNewGarmentName(e.target.value)} placeholder="New garment name" className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm" /><button type="button" onClick={addGarment} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white">Add</button></div>}
        </div>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-4" />
        <div className="flex gap-2 md:col-span-4 md:justify-end">
          <button type="button" onClick={() => setShow(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
          <button disabled={saving || !garment} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white">{saving ? "Saving…" : "Save design"}</button>
        </div>
      </form>
    </section>}    {selected && <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-slate-500">Design details</p><h4 className="mt-1 text-xl font-semibold text-navy-900">Edit design</h4></div><button type="button" onClick={() => setSelected(null)} className="text-sm text-slate-500 hover:underline">Close</button></div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <input required value={designNo} onChange={e => setDesignNo(e.target.value)} placeholder="Design number" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input required value={name} onChange={e => setName(e.target.value)} placeholder="Design name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <div className="text-sm">
          <span>Garment</span>
          <select required value={garment} onChange={e => setGarment(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"><option value="">Choose garment…</option>{garments.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}</select>
          <button type="button" onClick={() => setShowGarmentForm(v => !v)} className="mt-2 text-xs font-medium text-navy-900 hover:underline">+ Add garment</button>
          {showGarmentForm && <div className="mt-2 flex gap-2 rounded-lg bg-slate-50 p-2"><input autoFocus value={newGarmentName} onChange={e => setNewGarmentName(e.target.value)} placeholder="New garment name" className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm" /><button type="button" onClick={addGarment} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white">Add</button></div>}
        </div>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-4" />
      </div>
      <div className="mt-3 flex gap-2"><button disabled={saving || !garment} onClick={() => void saveEdit()} className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white">Save changes</button><button type="button" onClick={() => setSelected(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button></div>
    </section>}
    <div className="flex flex-col gap-3 sm:flex-row"><select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm"><option value="">All garments</option>{garments.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}</select><span className="self-center text-sm text-slate-500">{visible.length} design(s)</span></div>
    {!visible.length ? <LoadingState label="No designs found." /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {visible.map(d => <article key={d.id} onClick={() => openDesign(d)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") openDesign(d); }} role="button" tabIndex={0} className="cursor-pointer overflow-hidden rounded-xl border border-sand-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="aspect-[4/3] bg-slate-100">{d.imagePath ? <img src={d.imagePath} alt={d.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-3xl font-semibold text-slate-300">SP</div>}</div>
        <div className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-slate-500">{d.designNo}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">{label(d.garmentMaster?.name ?? d.garment)}</span></div><h4 className="mt-2 font-semibold text-navy-900">{d.name}</h4><p className="mt-1 min-h-10 text-sm text-slate-600">{d.description || "No description added."}</p>
          <input ref={el => { fileRefs.current[d.id] = el; }} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => image(d.id, e.target.files?.[0])} /><button onClick={e => { e.stopPropagation(); fileRefs.current[d.id]?.click(); }} className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">{d.imagePath ? "Replace image" : "Add design image"}</button>
        </div>
      </article>)}
    </div>}
  </div>;
}
