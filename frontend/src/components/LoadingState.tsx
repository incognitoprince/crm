export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="rounded-lg border border-sand-100 bg-white p-6 text-sm text-slate-600"
      role="status"
    >
      {label}
    </div>
  );
}
