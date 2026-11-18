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
  const logoSource = shop?.logoPath || shop?.logoUrl;

  const gridClass = compact
    ? "grid min-h-[84px] grid-cols-[84px_minmax(0,1fr)] items-center gap-2"
    : "grid min-h-[112px] grid-cols-[24%_minmax(0,1fr)] items-center gap-3";
  const logoWrapClass = compact
    ? "flex h-full items-center justify-start"
    : "flex h-full items-center justify-start";
  const headingWrapClass = compact
    ? "min-w-0 text-left"
    : "min-w-0 text-left";
  const logoClass = compact
    ? "max-h-20 max-w-[72px] object-contain"
    : "max-h-32 max-w-[132px] object-contain sm:max-h-36 sm:max-w-[164px] md:max-h-40 md:max-w-[200px]";
  const headingClass = compact
    ? "break-words text-[15px] font-bold leading-tight"
    : "break-words text-xl font-bold leading-tight sm:text-2xl md:text-3xl";
  const englishHeadingClass = compact
    ? "mt-1 whitespace-nowrap font-serif text-[12px] font-bold leading-tight"
    : "mt-1 whitespace-nowrap font-serif text-base font-bold leading-tight sm:text-lg md:text-xl";
  const addressClass = compact
    ? "text-[9px] font-medium leading-tight"
    : "text-[10px] font-medium leading-tight sm:text-xs md:text-sm";

  return <header className="text-center">
    <div className={gridClass}>
      <div className={logoWrapClass}>
        {logoSource && <img src={resolveMediaUrl(logoSource)} className={logoClass} alt="" onError={event => { event.currentTarget.style.display = "none"; }} />}
      </div>
      <div className={headingWrapClass}>
        {shop?.arabicName && <p dir="rtl" className={`${headingClass} text-left`}>{shop.arabicName}</p>}
        {shop?.englishName && <p className={`${englishHeadingClass} text-left`}>{shop.englishName}</p>}
        {!shop?.arabicName && !shop?.englishName && <p className={`${englishHeadingClass} text-left`}>{shop?.name ?? "Tailor Shop"}</p>}
      </div>
    </div>

    <div className={compact ? "mt-2 border-t-2 border-slate-800" : "mt-2 border-t-2 border-slate-800"} />
    {(addressLines.length > 0 || contacts || shop?.email) && <div className={compact ? "space-y-0.5 py-1.5" : "space-y-0.5 py-1.5"}>
      {addressLines.map((line, index) => <p key={index} className={addressClass}>{line}</p>)}
      {contacts && <p className={addressClass}>Tel: {contacts}</p>}
      {shop?.email && <p className={addressClass}>Email: {shop.email}</p>}
    </div>}
    <div className="border-b-2 border-slate-800" />
  </header>;
}
