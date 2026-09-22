import { EmptyState } from "../components/EmptyState";

const placeholders = [
  "Total customers",
  "Today's orders",
  "Pending orders",
  "In production",
  "Quality check",
  "Ready orders",
];

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-navy-900">Dashboard shell</h3>
        <p className="mt-1 text-sm text-slate-600">
          Operational metrics will appear here in Phase 12. The layout is ready for desktop, tablet,
          and mobile.
        </p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {placeholders.map((label) => (
          <article key={label} className="rounded-lg border border-sand-100 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-navy-900">—</p>
          </article>
        ))}
      </div>
      <EmptyState
        title="No live metrics yet"
        description="Orders, shop workload, and revenue widgets will be connected after the domain modules are built."
      />
    </div>
  );
}
