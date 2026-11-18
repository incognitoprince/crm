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
  const address = addressLines.join(", ");
  const contactLine = [address, contacts ? "Tel: " + contacts : "", shop?.email ? "Email: " + shop.email : ""]
    .filter(Boolean)
    .join(" · ");
  const logoSource = shop?.logoPath || shop?.logoUrl;

  return (
    <header className="border-b-2 border-slate-800 pb-1 text-center">
      <div className={compact
        ? "grid min-h-[84px] grid-cols-[84px_minmax(0,1fr)] items-center gap-2"
        : "grid min-h-[96px] grid-cols-[20%_minmax(0,1fr)] items-center gap-2"}>
        <div className="flex h-full items-center justify-start">
          {logoSource && (
            <img
              src={resolveMediaUrl(logoSource)}
              className={compact ? "max-h-20 max-w-[72px] object-contain" : "max-h-24 max-w-full object-contain"}
              alt=""
              onError={event => { event.currentTarget.style.display = "none"; }}
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col items-center justify-center text-center">
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
          {contactLine && (
            <p className={compact
              ? "mt-1 w-full whitespace-nowrap text-[8px] font-medium leading-tight"
              : "mt-1 w-full whitespace-nowrap text-[8px] font-medium leading-tight sm:text-[9px] md:text-[10px]"}>
              {contactLine}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
