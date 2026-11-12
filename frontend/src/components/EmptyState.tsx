export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="animate-scale-in rounded-2xl border border-dashed border-brand-200 bg-white/80 p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 animate-float items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10" /></svg>
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
