import { NavLink, Outlet } from "react-router-dom";
import { cn } from "../utils/cn";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/customers", label: "Customers" },
  { to: "/orders", label: "Orders" },
  { to: "/shops", label: "Shops" },
  { to: "/overview", label: "System status" },
];

export function AppLayout() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-navy-900 text-sand-50">
        <div className="px-5 py-6">
          <p className="text-xs uppercase tracking-wide text-sand-100/80">Kuwait</p>
          <h1 className="text-lg font-semibold">Tailoring CRM</h1>
          <p className="mt-1 text-xs text-sand-100/70">Demo workspace</p>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) =>
              cn("whitespace-nowrap rounded-md px-3 py-2 text-sm", isActive ? "bg-navy-700 text-white" : "text-sand-100 hover:bg-navy-800")
            }>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-sand-100 bg-white px-4 py-4 sm:px-6">
          <p className="text-sm text-slate-500">Customer demo build</p>
          <h2 className="text-xl font-semibold text-navy-900">Owner workspace</h2>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6"><Outlet /></main>
      </div>
    </div>
  );
}
