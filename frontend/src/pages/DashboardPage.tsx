import { useEffect, useState } from "react";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { getDashboardSummary } from "../services/api";
import type { DashboardSummary } from "../types";

const money = (fils: number) => "KWD " + (fils / 1000).toFixed(3);
const cards = [
  ["customers", "Active customers"], ["orders", "Total orders"], ["pending", "Pending"],
  ["production", "In production"], ["quality", "Quality check"], ["ready", "Ready"],
] as const;

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getDashboardSummary().then(r => setData(r.data)).catch(e => setError(e.message)); }, []);

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return <LoadingState label="Loading live dashboard…" />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm font-medium text-amber-700">Demo data enabled</p>
        <h3 className="mt-1 text-2xl font-semibold text-navy-900">Good afternoon, Owner 👋</h3>
        <p className="mt-1 text-sm text-slate-600">Here is the current view across all four tailoring shops.</p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([key, label]) => (
          <article key={key} className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold text-navy-900">{data[key]}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between"><h4 className="font-semibold text-navy-900">Shop performance</h4><span className="text-sm text-slate-500">Live</span></div>
          <div className="mt-4 divide-y divide-slate-100">
            {data.shops.map(shop => (
              <div key={shop.id} className="flex items-center justify-between py-3">
                <div><p className="font-medium text-slate-800">{shop.name}</p><p className="text-xs text-slate-500">{shop.area}</p></div>
                <div className="text-right"><p className="font-semibold text-navy-900">{shop.orders} orders</p><p className="text-xs text-slate-500">{shop.customers} customers</p></div>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-xl border border-sand-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Order value</p><p className="mt-2 text-3xl font-semibold text-navy-900">{money(data.revenueFils)}</p>
          <p className="mt-2 text-sm text-slate-600">{data.delivered} delivered orders in demo data.</p>
        </article>
      </div>
    </div>
  );
}
