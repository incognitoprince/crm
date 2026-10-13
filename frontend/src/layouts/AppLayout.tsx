import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "../utils/cn";
import { Icon, type IconName } from "../components/Icons";

type NavItem = { to: string; label: string; icon: IconName };

const links: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/customers", label: "Customers", icon: "customers" },
  { to: "/orders", label: "Orders", icon: "orders" },
  { to: "/shops", label: "Shops", icon: "shops" },
  { to: "/masters", label: "Masters", icon: "masters" },
  { to: "/designs", label: "Design Library", icon: "designs" },
  { to: "/production", label: "Production", icon: "production" },
  { to: "/payments", label: "Payments", icon: "payments" },
  { to: "/bills", label: "Bills / Invoices", icon: "bills" },
  { to: "/users", label: "Users", icon: "users" },
];

const groups: Array<{ title: string; paths: string[] }> = [
  { title: "Overview", paths: ["/dashboard"] },
  { title: "Workflow", paths: ["/customers", "/orders", "/production", "/designs"] },
  { title: "Business", paths: ["/shops", "/masters", "/payments", "/bills"] },
  { title: "Admin", paths: ["/users"] },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-300 via-brand-500 to-brand-700 text-white shadow-glow">
        <Icon name="scissors" className="h-5 w-5" />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0b2a52]" />
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-[17px] font-extrabold tracking-tight text-white">Tailoring CRM</h1>
        <p className="mt-0.5 text-[11px] font-medium text-brand-200/80">Tailor shop management</p>
      </div>
    </div>
  );
}

function NavList({ items, onNavigate, dense }: { items: NavItem[]; onNavigate?: () => void; dense?: boolean }) {
  const sections = groups
    .map(g => ({ title: g.title, items: items.filter(i => g.paths.includes(i.to)) }))
    .filter(g => g.items.length > 0);
  let order = 0;
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
      {sections.map(section => (
        <div key={section.title}>
          <p className="mb-2 px-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-200/50">{section.title}</p>
          <div className="space-y-1">
            {section.items.map(link => {
              const delay = order++ * 40;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onNavigate}
                  style={{ animationDelay: delay + "ms" }}
                  className={({ isActive }) => cn(
                    "group relative flex animate-slide-right items-center gap-3 overflow-hidden rounded-xl px-3.5 text-sm font-semibold transition-all duration-300",
                    dense ? "py-3" : "py-2.5",
                    isActive
                      ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-[0_8px_22px_-8px_rgba(47,134,246,0.8)]"
                      : "text-brand-100/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <span className={cn(
                        "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all duration-300",
                        isActive ? "opacity-100" : "h-0 opacity-0"
                      )} />
                      <Icon name={link.icon} className="h-[19px] w-[19px] shrink-0 transition-transform duration-300 group-hover:scale-110" />
                      <span className="truncate">{link.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

const sidebarBg = "bg-[radial-gradient(120%_60%_at_0%_0%,#1b5aa8_0%,transparent_60%),linear-gradient(180deg,#0f3a6e_0%,#0a2c55_55%,#081f3d_100%)]";

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const visibleLinks = links.filter(link => user?.role === "ADMIN" || (user?.role === "INVOICE_CREATOR" ? link.to === "/bills" : !["/dashboard", "/payments", "/bills", "/users"].includes(link.to)));
  const roleLabel = user?.role === "ADMIN" ? "Administrator" : user?.role === "INVOICE_CREATOR" ? "Invoicing" : "Staff";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className={cn("sticky top-0 hidden h-screen text-white lg:flex lg:flex-col", sidebarBg)}>
        <div className="border-b border-white/10 px-5 py-5"><Brand /></div>
        <NavList items={visibleLinks} />
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className={cn("relative flex h-full w-[290px] max-w-[88vw] animate-slide-right flex-col text-white shadow-2xl", sidebarBg)}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <Brand />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>
            <NavList items={visibleLinks} dense onNavigate={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className={cn(
          "sticky top-0 z-40 flex h-[72px] items-center gap-3 border-b px-4 backdrop-blur-xl transition-all duration-300 sm:gap-4 sm:px-6",
          scrolled ? "border-slate-200/80 bg-white/80 shadow-[0_8px_30px_-12px_rgba(16,47,79,0.18)]" : "border-transparent bg-white/50"
        )}>
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(open => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-brand-50 hover:text-brand-600 lg:hidden"
          >
            <Icon name="menu" />
          </button>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                type="button"
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                onClick={() => setProfileMenuOpen(open => !open)}
                className="flex items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-brand-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white shadow-glow">
                  {(user?.name ?? "U").slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden leading-tight sm:block">
                  <span className="block text-sm font-semibold text-slate-800">{user?.name ?? "User"}</span>
                  <span className="block text-[11px] text-slate-500">{roleLabel}</span>
                </span>
                <Icon name="chevronDown" className="hidden h-4 w-4 text-slate-500 sm:block" />
              </button>
              {profileMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close account menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    <div className="border-b border-slate-100 px-3 py-2">
                      <p className="truncate text-sm font-semibold text-slate-800">{user?.name ?? "User"}</p>
                      <p className="text-xs text-slate-500">{roleLabel}</p>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setProfileMenuOpen(false); logout(); }}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      <Icon name="logout" className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main key={location.pathname} className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-7"><Outlet /></main>
      </div>
    </div>
  );
}
