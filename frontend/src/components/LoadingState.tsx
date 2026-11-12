export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="mx-auto max-w-7xl space-y-5" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-500" />
        </span>
        {label}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-24" style={{ animationDelay: i * 120 + "ms" }} />)}
      </div>
      <div className="skeleton h-64" />
    </div>
  );
}
