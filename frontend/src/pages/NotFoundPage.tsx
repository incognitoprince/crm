import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg rounded-lg bg-white p-8 text-center">
      <h3 className="text-lg font-semibold text-navy-900">Page not found</h3>
      <p className="mt-2 text-sm text-slate-600">That screen is not part of Phase 1.</p>
      <Link to="/" className="mt-4 inline-block text-sm font-medium text-navy-700 underline">
        Back to overview
      </Link>
    </div>
  );
}
