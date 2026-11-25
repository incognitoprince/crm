import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState as useReactState } from "react";
import { getCustomers, getDesigns, getOrders, getBills } from "../services/api";
import type { Customer, Design, Order, Invoice } from "../types";
import { cn } from "../utils/cn";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "⌂" },
  { to: "/customers", label: "Customers", icon: "♟" },
  { to: "/orders", label: "Orders", icon: "▣" },
  { to: "/shops", label: "Shops", icon: "⌂" },
  { to: "/masters", label: "Masters", icon: "♙" },
  { to: "/designs", label: "Design Library", icon: "▧" },
  { to: "/production", label: "Production", icon: "◈" },
  { to: "/payments", label: "Payments", icon: "₹" },
  { to: "/bills", label: "Bills / Invoices", icon: "▤" },
  { to: "/users", label: "Users", icon: "♙" },
];

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useReactState("");
  const [searchOpen, setSearchOpen] = useReactState(false);
  const [searchBusy, setSearchBusy] = useReactState(false);
  const [searchError, setSearchError] = useReactState("");
  const [customers, setCustomers] = useReactState<Customer[]>([]);
  const [orders, setOrders] = useReactState<Order[]>([]);
  const [designs, setDesigns] = useReactState<Design[]>([]);
  const [invoices, setInvoices] = useReactState<Invoice[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const visibleLinks = links.filter(link => user?.role === "ADMIN" || (user?.role === "INVOICE_CREATOR" ? link.to === "/bills" : !["/dashboard","/payments","/bills","/users"].includes(link.to)));
  useEffect(() => {
    const term = search.trim();
    if (!term) {
      setCustomers([]); setOrders([]); setDesigns([]); setInvoices([]);
      setSearchError(""); setSearchBusy(false); return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setSearchBusy(true); setSearchError("");
      try {
        const canSearchCustomers = user?.role !== "INVOICE_CREATOR";
        const canSearchOrders = user?.role !== "INVOICE_CREATOR";
        const canSearchDesigns = user?.role !== "INVOICE_CREATOR";
        const canSearchInvoices = user?.role === "ADMIN" || user?.role === "INVOICE_CREATOR";
        const [c,o,d,b] = await Promise.all([
          canSearchCustomers ? getCustomers(term) : Promise.resolve({data: [] as Customer[]}),
          canSearchOrders ? getOrders() : Promise.resolve({data: [] as Order[]}),
          canSearchDesigns ? getDesigns() : Promise.resolve({data: [] as Design[]}),
          canSearchInvoices ? getBills() : Promise.resolve({data: [] as Invoice[]})
        ]);
        if (!active) return;
        const q = term.toLocaleLowerCase();
        setCustomers(c.data.filter(x => [x.name,x.phone,x.customerNo].some(v => (v ?? "").toLocaleLowerCase().includes(q))).slice(0,5));
        setOrders(o.data.filter(x => [x.orderNo,x.customer?.name,x.customer?.phone,x.status].some(v => (v ?? "").toString().toLocaleLowerCase().includes(q))).slice(0,5));
        setDesigns(d.data.filter(x => [x.designNo,x.name,x.garment,x.customer?.name].some(v => (v ?? "").toString().toLocaleLowerCase().includes(q))).slice(0,5));
        setInvoices(b.data.filter(x => [x.invoiceNo,x.customer?.name,x.subject].some(v => (v ?? "").toString().toLocaleLowerCase().includes(q))).slice(0,5));
      } catch (e) {
        if (active) setSearchError(e instanceof Error ? e.message : "Search is unavailable");
      } finally { if (active) setSearchBusy(false); }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, user?.role]);

  useEffect(() => { setSearch(""); setSearchOpen(false); }, [location.pathname, location.search]);

  const searchGroups = useMemo(() => [
    { label: "Customers", items: customers.map(x => ({id:x.id,title:x.name,subtitle:[x.customerNo,x.phone].filter(Boolean).join(" · "),to:"/customers/"+x.id})) },
    { label: "Orders", items: orders.map(x => ({id:x.id,title:x.orderNo,subtitle:x.customer.name+" · "+x.status.replaceAll("_"," "),to:"/orders/"+x.id})) },
    { label: "Designs", items: designs.map(x => ({id:x.id,title:x.designNo+" · "+(x.name||x.garment),subtitle:x.customer?.name ?? "Design Library",to:x.customerId?"/designs?customerId="+x.customerId:"/designs"})) },
    { label: "Invoices", items: invoices.map(x => ({id:x.id,title:x.invoiceNo,subtitle:x.customer?.name ?? "Invoice",to:"/bills/"+x.id})) }
  ].filter(group => group.items.length), [customers,orders,designs,invoices]);

  const allSearchItems = searchGroups.flatMap(group=>group.items);
  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") { setSearchOpen(false); return; }
    if (event.key === "Enter" && allSearchItems[0]) { navigate(allSearchItems[0].to); setSearchOpen(false); }
  }
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);


  return (
    <div className="min-h-screen bg-[#f5f9fd] lg:grid lg:grid-cols-[236px_1fr]">
      <aside className="hidden min-h-screen bg-gradient-to-b from-[#123f68] via-[#0d355b] to-[#0b2d4c] text-white lg:flex lg:flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-2xl">✂</div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight">Tailoring CRM</h1>
              <p className="mt-0.5 text-[11px] text-blue-100/80">Tailor Shop Management</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1.5 px-3 py-5">
          {visibleLinks.map(link => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => cn(
              "group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all",
              isActive ? "bg-[#1976e8] text-white shadow-[0_5px_16px_rgba(25,118,232,0.28)]" : "text-blue-50/90 hover:bg-white/10 hover:text-white"
            )}>
              <span className="flex w-6 justify-center text-lg leading-none opacity-95">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-5">
          <p className="text-[11px] text-blue-100/60">Admin workspace</p>
          <p className="mt-1 text-xs text-white/80">Tailoring management</p>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative flex h-full w-[280px] max-w-[86vw] flex-col bg-gradient-to-b from-[#123f68] via-[#0d355b] to-[#0b2d4c] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-2xl">✂</div>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold tracking-tight">Tailoring CRM</h1>
                  <p className="mt-0.5 text-[11px] text-blue-100/80">Tailor Shop Management</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-white/80 hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>
            <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
              {visibleLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition-all",
                    isActive ? "bg-[#1976e8] text-white shadow-[0_5px_16px_rgba(25,118,232,0.28)]" : "text-blue-50/90 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span className="flex w-6 justify-center text-lg leading-none">{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-white/10 px-5 py-5">
              <p className="text-[11px] text-blue-100/60">Admin workspace</p>
              <p className="mt-1 text-xs text-white/80">Tailoring management</p>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-[72px] items-center gap-4 border-b border-slate-200/80 bg-white/95 px-4 shadow-[0_1px_8px_rgba(15,31,53,0.04)] backdrop-blur sm:px-6">
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(open => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl text-navy-900 hover:bg-slate-100 lg:hidden"
          >
            {mobileMenuOpen ? "×" : "☰"}
          </button>
          <div className="hidden h-10 w-10 items-center justify-center rounded-lg text-xl text-navy-900 lg:flex">☰</div>
          <div ref={searchRef} className="relative max-w-[510px] flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-500">⌕</span>
            <input
              aria-label="Global search"
              aria-expanded={searchOpen}
              aria-controls="global-search-results"
              role="combobox"
              aria-autocomplete="list"
              value={search}
              onChange={event => { setSearch(event.target.value); setSearchOpen(true); }}
              onFocus={() => search.trim() && setSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search customers, orders, designs, invoices..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-[#f6f8fb] pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {searchOpen && search.trim() && <div id="global-search-results" role="listbox" className="absolute left-0 right-0 top-12 z-50 max-h-[min(70vh,480px)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {searchBusy && <p className="px-3 py-2 text-xs text-slate-500">Searching…</p>}
              {searchError && <p className="px-3 py-2 text-xs text-rose-600">{searchError}</p>}
              {!searchBusy && !searchError && searchGroups.length === 0 && <p className="px-3 py-3 text-sm text-slate-500">No matching records found.</p>}
              {searchGroups.map(group => <section key={group.label} className="py-1">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
                {group.items.map(item => <Link key={item.id} role="option" aria-selected="false" to={item.to} onClick={() => {setSearch("");setSearchOpen(false);}} className="block rounded-lg px-3 py-2 hover:bg-blue-50 focus:bg-blue-50">
                  <span className="block truncate text-sm font-medium text-slate-800">{item.title}</span>
                  <span className="block truncate text-xs text-slate-500">{item.subtitle}</span>
                </Link>)}
              </section>)}
              {!searchBusy && allSearchItems.length > 0 && <p className="border-t border-slate-100 px-3 pt-2 text-[10px] text-slate-400">Press Enter to open the first result · Esc to close</p>}
            </div>}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">{(user?.name ?? "U").slice(0,2).toUpperCase()}</div>
              <span className="hidden text-sm font-semibold text-slate-800 sm:block">{user?.name ?? "User"}</span>
              <button type="button" onClick={logout} className="text-xs font-medium text-slate-500 hover:text-slate-800">Sign out</button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-7 lg:py-6"><Outlet /></main>
      </div>
    </div>
  );
}
