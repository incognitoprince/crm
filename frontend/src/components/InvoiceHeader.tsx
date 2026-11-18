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
        : "flex min-h-[112px] w-full items-center justify-center gap-3"}>
        <div className={compact
          ? "flex h-full items-center justify-start"
          : "flex shrink-0 items-center justify-center"}>
          {logoSource && (
            <img
              src={resolveMediaUrl(logoSource)}
              className={compact ? "max-h-20 max-w-[72px] object-contain" : "max-h-28 w-[112px] max-w-[24vw] object-contain"}
              alt=""
              onError={event => { event.currentTarget.style.display = "none"; }}
            />
          )}
        </div>
        <div className={compact
          ? "flex min-w-0 flex-col items-center justify-center text-center"
          : "flex min-w-0 max-w-[min(68%,620px)] flex-col items-center justify-center text-center"}>
          {shop?.arabicName && (
            <p dir="rtl" className={compact
              ? "w-full whitespace-nowrap text-[14px] font-bold leading-tight"
              : "w-full whitespace-nowrap text-sm font-bold leading-tight sm:text-base md:text-lg"}>
              {shop.arabicName}
            </p>
          )}
          {(shop?.englishName || (!shop?.arabicName && !shop?.englishName)) && (
            <p className={compact
              ? "mt-0.5 w-full whitespace-nowrap font-serif text-[11px] font-bold leading-tight"
              : "mt-0.5 w-full whitespace-nowrap font-serif text-[11px] font-bold leading-tight sm:text-xs md:text-sm"}>
              {shop?.englishName || shop?.name || "Tailor Shop"}
            </p>
          )}
          {addressLines.map((line, index) => (
            <p key={index} className={compact
              ? "mt-0.5 w-full whitespace-nowrap text-[8px] font-medium leading-tight"
              : "mt-0.5 w-full whitespace-nowrap text-[8px] font-medium leading-tight"}>
              {line}
            </p>
          ))}
          {contactLine && (
            <p className="mt-0.5 w-full whitespace-nowrap text-[8px] font-medium leading-tight">
              {contactLine}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
