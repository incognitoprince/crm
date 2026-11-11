import { resolveMediaUrl } from "../services/api";
import type { Shop } from "../types";

type InvoiceHeaderProps = {
  shop?: Shop | null;
  compact?: boolean;
};

export function InvoiceHeader({ shop, compact = false }: InvoiceHeaderProps) {
  const addressLines = (shop?.address ?? "")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const contacts = [...new Set([shop?.phone, shop?.whatsapp].filter((value): value is string => Boolean(value?.trim())))].join(" - ");

  const headingClass = compact
    ? "break-words text-[13px] font-semibold leading-tight"
    : "break-words text-base font-semibold leading-tight sm:text-lg md:text-xl";
  const englishHeadingClass = compact
    ? "mt-0.5 break-words font-serif text-[13px] font-bold leading-tight"
    : "mt-0.5 break-words font-serif text-base font-bold leading-tight sm:text-lg md:text-xl";
  const addressClass = compact
    ? "text-[9px] leading-tight"
    : "text-[10px] leading-tight sm:text-xs";

  return <header className="text-center">
    <div className={compact ? "grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2" : "grid grid-cols-[72px_minmax(0,1fr)_72px] items-center gap-2 sm:grid-cols-[90px_minmax(0,1fr)_90px] sm:gap-3 md:grid-cols-[110px_minmax(0,1fr)_110px] md:gap-4"}>
      <div className="flex justify-start">
        {shop?.logoUrl && <img crossOrigin="use-credentials" src={resolveMediaUrl(shop.logoUrl)} className={compact ? "max-h-14 max-w-12 object-contain" : "max-h-20 max-w-28 object-contain"} alt="Shop logo" />}
      </div>
      <div className="min-w-0">
        {shop?.arabicName && <p dir="rtl" className={headingClass}>{shop.arabicName}</p>}
        {shop?.englishName && <p className={englishHeadingClass}>{shop.englishName}</p>}
        {!shop?.arabicName && !shop?.englishName && <p className={englishHeadingClass}>{shop?.name ?? "Tailor Shop"}</p>}
      </div>
      <div aria-hidden="true" />
    </div>

    <div className={compact ? "mt-2 border-t-2 border-slate-800" : "mt-3 border-t-2 border-slate-800"} />
    {(addressLines.length > 0 || contacts || shop?.email) && <div className={compact ? "space-y-0.5 py-1.5" : "space-y-0.5 py-2"}>
      {addressLines.map((line, index) => <p key={index} className={addressClass}>{line}</p>)}
      {contacts && <p className={addressClass}>Tel: {contacts}</p>}
      {shop?.email && <p className={addressClass}>Email: {shop.email}</p>}
    </div>}
    <div className="border-b-2 border-slate-800" />
  </header>;
}
