import type { SVGProps } from "react";

export type IconName =
  | "dashboard" | "customers" | "orders" | "shops" | "masters" | "designs"
  | "production" | "payments" | "bills" | "users" | "search" | "menu"
  | "logout" | "scissors" | "mail" | "user" | "lock" | "eye" | "eyeOff"
  | "download" | "share" | "printer" | "image" | "arrowLeft" | "trendUp" | "clock" | "check" | "alert" | "wallet" | "bell";

const paths: Record<IconName, string> = {
  dashboard: "M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z",
  customers: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6",
  orders: "M7 4h10a2 2 0 0 1 2 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V6a2 2 0 0 1 2-2zM9 9h6M9 13h4",
  shops: "M4 10l1.5-5h13L20 10M4 10v10h16V10M4 10c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3M10 20v-4h4v4",
  masters: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.3 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z",
  designs: "M4 5h16v14H4zM4 15l4.5-4.5 3.5 3.5 3-3L20 16M9 9.5h.01",
  production: "M3 20V10l6 3V10l6 3V6h4a2 2 0 0 1 2 2v12zM8 20v-3M13 20v-3",
  payments: "M3 7h18v10H3zM3 11h18M7 15h3",
  bills: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3 2.9-5 6.5-5s6.5 2 6.5 5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 15.3c2 .6 3.5 2 3.5 4.7",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  menu: "M4 7h16M4 12h16M4 17h10",
  logout: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10",
  scissors: "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.1 7.9L20 19M8.1 16.1L20 5",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 15v2",
  eye: "M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  eyeOff: "M3 3l18 18M10.6 6a9.7 9.7 0 0 1 1.4-.1c6.4 0 10 6.1 10 6.1a17 17 0 0 1-3.2 3.9M6.6 7.6A16.6 16.6 0 0 0 2 12s3.6 6.1 10 6.1c1.5 0 2.8-.3 4-.8M9.9 9.9a2.5 2.5 0 0 0 3.2 3.2",
  download: "M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 20h14",
  share: "M12 15V4M8 8l4-4 4 4M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6",
  printer: "M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v6H7z",
  image: "M4 5h16v14H4zM4 16l4.5-4.5 3.5 3.5 3-3L20 17M9 9.5h.01",
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  trendUp: "M3 17l6-6 4 4 8-8M15 7h6v6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  check: "M5 12.5l4.5 4.5L19 7.5",
  alert: "M12 4l9.5 16h-19zM12 10v4M12 17.5h.01",
  wallet: "M4 7a2 2 0 0 1 2-2h12v3M4 7v10a2 2 0 0 0 2 2h14V8H6a2 2 0 0 1-2-1zM16 13.5h.01",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0",
};

export function Icon({ name, className = "h-5 w-5", ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...rest}>
      <path d={paths[name]} />
    </svg>
  );
}
