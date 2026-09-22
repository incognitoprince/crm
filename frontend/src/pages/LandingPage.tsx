import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { useHealth } from "../hooks/useHealth";
import { formatLatency } from "../utils/cn";

export function LandingPage() {
  const { state, data, error, refresh } = useHealth();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-navy-900">System status</h3>
        <p className="mt-1 text-sm text-slate-600">
          This page checks that the React app can reach the Node.js API through Nginx, and that
          PostgreSQL is connected.
        </p>
      </section>

      {state === "loading" || state === "idle" ? (
        <LoadingState label="Checking API and database…" />
      ) : null}

      {state === "error" ? (
        <ErrorState message={error ?? "API is unreachable"} onRetry={() => void refresh()} />
      ) : null}

      {state === "success" && data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-lg border border-sand-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">API</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">Connected</p>
            <p className="mt-1 text-sm text-slate-600">
              {data.service} · v{data.version ?? "0.1.0"}
            </p>
          </article>
          <article className="rounded-lg border border-sand-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">PostgreSQL</p>
            <p
              className={`mt-2 text-2xl font-semibold ${
                data.checks?.database.status === "ok" ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {data.checks?.database.status === "ok" ? "Connected" : "Unavailable"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {data.checks ? formatLatency(data.checks.database.latencyMs) : "No check data"}
            </p>
          </article>
        </div>
      ) : null}

      <p className="rounded-md bg-white px-4 py-3 text-sm text-slate-600" role="status">
        {state === "success"
          ? "Frontend and backend communication is working."
          : "Waiting for a successful health response."}
      </p>
    </div>
  );
}
