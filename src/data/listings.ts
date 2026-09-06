export type Market = "US" | "UK" | "DE" | "AE";
export type Trim =
  | "Standard"
  | "S"
  | "Performante"
  | "Graphite Capsule"
  | "Mansory";

export interface Listing {
  id: string;
  year: number;
  trim: Trim;
  priceUsd: number;
  priceLocal: number;
  currency: "USD" | "GBP" | "EUR" | "AED";
  mileage: number;
  mileageUnit: "mi" | "km";
  market: Market;
  city: string;
  color: string;
  interior: string;
  seller: string;
  cpo: boolean;
  warranty: string;
  source: string;
  sourceUrl: string;
  notes: string;
  deal: "Great" | "Fair" | "High" | "Watch";
}

export interface ListingsPayload {
  lastRefreshed: string;
  refreshCadence: "daily";
  focusYears: number[];
  listings: Listing[];
  sourcesChecked?: string[];
  refreshNotes?: string[];
}

export const marketMeta: Record<
  Market,
  { label: string; flag: string; importNote: string }
> = {
  US: {
    label: "United States",
    flag: "US",
    importNote: "Best default for US buyers — already federalized",
  },
  UK: {
    label: "United Kingdom",
    flag: "UK",
    importNote: "RHD + compliance; modern duty stack still painful into US",
  },
  DE: {
    label: "Germany",
    flag: "DE",
    importNote:
      "Netto deals exist; ~27.5% US duty + RI costs usually erase savings",
  },
  AE: {
    label: "UAE / Dubai",
    flag: "AE",
    importNote:
      "Deep inventory; GCC/EU/JP specs; export+duty rarely beats US street",
  },
};

export function milesEquivalent(listing: Listing): number {
  return listing.mileageUnit === "mi"
    ? listing.mileage
    : Math.round(listing.mileage * 0.621371);
}

export function formatMoney(n: number, currency: Listing["currency"] = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function estimateUsLanded(listing: Listing): number | null {
  if (listing.market === "US") return listing.priceUsd;
  const shipping = 5500;
  const dutyRate = listing.market === "UK" ? 0.1 : 0.275;
  const duty = listing.priceUsd * dutyRate;
  const compliance = 15000;
  const stateTax = listing.priceUsd * 0.07;
  return Math.round(listing.priceUsd + shipping + duty + compliance + stateTax);
}

export function hoursSinceRefresh(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / 3_600_000;
}

export function isStale(iso: string | null | undefined, maxHours = 30): boolean {
  const hours = hoursSinceRefresh(iso);
  return hours == null || hours > maxHours;
}
