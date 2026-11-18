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
  const contactLine = [contacts ? "Tel: " + contacts : "", shop?.email ? "Email: " + shop.email : ""]
    .filter(Boolean)
    .join(" · ");
  const logoSource = shop?.logoPath || shop?.logoUrl;

  return (
    <header className="border-b-2 border-slate-800 pb-1 text-center">
      <div className={compact
        ? "relative grid min-h-[84px] grid-cols-[84px_minmax(0,1fr)] items-center gap-2"
        : "relative flex min-h-[112px] items-center justify-center"}>
        <div className={compact
          ? "flex h-full items-center justify-start"
          : "absolute left-[25%] top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"}>
          {logoSource && (
            <img
              src={resolveMediaUrl(logoSource)}
              className={compact ? "max-h-20 max-w-[72px] object-contain" : "max-h-28 max-w-full object-contain"}
              alt=""
              onError={event => { event.currentTarget.style.display = "none"; }}
            />
          )}
        </div>
        <div className={compact
          ? "flex min-w-0 flex-col items-center justify-center text-center"
          : "flex w-full min-w-0 flex-col items-center justify-center text-center"}>
          {shop?.arabicName && (
            <p dir="rtl" className={compact
              ? "w-full whitespace-nowrap text-[14px] font-bold leading-tight"
              : "w-full whitespace-nowrap text-base font-bold leading-tight sm:text-lg md:text-xl"}>
              {shop.arabicName}
            </p>
          )}
          {(shop?.englishName || (!shop?.arabicName && !shop?.englishName)) && (
            <p className={compact
              ? "mt-0.5 w-full whitespace-nowrap font-serif text-[11px] font-bold leading-tight"
              : "mt-0.5 w-full whitespace-nowrap font-serif text-xs font-bold leading-tight sm:text-sm md:text-base"}>
              {shop?.englishName || shop?.name || "Tailor Shop"}
            </p>
          )}
          {addressLines.map((line, index) => (
            <p key={index} className={compact
              ? "mt-0.5 w-full whitespace-nowrap text-[8px] font-medium leading-tight"
              : "mt-0.5 w-full whitespace-nowrap text-[9px] font-medium leading-tight"}>
              {line}
            </p>
          ))}
          {contactLine && (
            <p className="mt-0.5 w-full whitespace-nowrap text-[9px] font-medium leading-tight">
              {contactLine}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
