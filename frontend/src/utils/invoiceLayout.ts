/** A4 width at 96 CSS DPI. The invoice is always laid out at this width so the
 *  screen, PDF, image and print all look identical. */
export const INVOICE_PAPER_WIDTH = 794;

export const kwd = (fils: number) =>
  (fils / 1000).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export const fmtDate = (v: string) =>
  new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

export const clean = (v?: string | null) => {
  const t = v?.trim() ?? "";
  return t && t.toLowerCase() !== "not provided" ? t : "";
};

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const under100 = (x: number) => (x < 20 ? ONES[x] : TENS[Math.floor(x / 10)] + (x % 10 ? " " + ONES[x % 10] : ""));
const under1000 = (x: number) => (x < 100 ? under100(x) : ONES[Math.floor(x / 100)] + " hundred" + (x % 100 ? " " + under100(x % 100) : ""));
const title = (s: string) => s.replace(/\b[a-z]/g, c => c.toUpperCase());

/** Amount in words for Kuwaiti Dinar (1 KD = 1000 fils). */
export function amountInWords(totalFils: number) {
  if (totalFils <= 0) return "Zero Kuwaiti Dinar Only";
  const dinars = Math.floor(totalFils / 1000);
  const fils = totalFils % 1000;
  const parts: string[] = [];
  if (dinars >= 1_000_000) parts.push(under1000(Math.floor(dinars / 1_000_000)) + " million");
  if (dinars % 1_000_000 >= 1000) parts.push(under1000(Math.floor((dinars % 1_000_000) / 1000)) + " thousand");
  if (dinars % 1000) parts.push(under1000(dinars % 1000));
  let out = "";
  if (dinars > 0) out = parts.join(" ") + " Kuwaiti Dinar" + (dinars === 1 ? "" : "s");
  if (fils > 0) out += (out ? " and " : "") + under1000(fils) + " Fils";
  return title(out).replace(" And ", " and ") + " Only";
}
