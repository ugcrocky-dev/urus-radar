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

/** True when URL looks like a specific vehicle page (VIN / listing id), not a search/index. */
export function isDetailListingUrl(url: string): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  // Explicit vehicle detail signals
  if (/zpbu[a-z0-9]{13}/i.test(url)) return true; // Lamborghini VIN
  if (/\/listing\/\d+/.test(u)) return true;
  if (/\/inventory\/[^/]+-[a-z0-9]{8,}/i.test(url)) return true;
  if (/for-sale-[a-f0-9]{16,}/i.test(url)) return true;
  if (/_man-\d+/i.test(url)) return true;
  // Marketplace search / category / research — not a single car
  if (
    /\/(shopping\/results|car-search|\/search\b|\/lst\/|price-trends|research\/price)/i.test(
      u,
    )
  ) {
    return false;
  }
  if (
    /\/(urus|year-\d{4}|l-used-lamborghini-urus)\/?$/i.test(
      u.replace(/\?.*$/, ""),
    )
  ) {
    return false;
  }
  return false;
}

/** Build a live marketplace deep-link for this car when we only have a category URL. */
export function liveListingUrl(listing: Listing): string {
  if (listing.sourceUrl && isDetailListingUrl(listing.sourceUrl)) {
    return listing.sourceUrl;
  }

  const year = listing.year;
  const lo = Math.max(50000, Math.round(listing.priceUsd * 0.9));
  const hi = Math.round(listing.priceUsd * 1.1);

  switch (listing.market) {
    case "US":
      return (
        "https://www.cars.com/shopping/results/" +
        `?stock_type=used&makes[]=lamborghini&models[]=lamborghini-urus` +
        `&year_min=${year}&year_max=${year}` +
        `&list_price_min=${lo}&list_price_max=${hi}` +
        `&maximum_distance=all&zip=10001`
      );
    case "UK": {
      const gbpLo = Math.round(lo * 0.78);
      const gbpHi = Math.round(hi * 0.78);
      return (
        "https://www.autotrader.co.uk/car-search" +
        `?postcode=W1B3AG&make=Lamborghini&model=Urus` +
        `&year-from=${year}&year-to=${year}` +
        `&price-from=${gbpLo}&price-to=${gbpHi}&advertising-location=at_cars`
      );
    }
    case "DE": {
      const eurLo = Math.round(lo * 0.92);
      const eurHi = Math.round(hi * 0.92);
      return (
        "https://www.autoscout24.com/lst/lamborghini/urus" +
        `?atype=C&cy=D&damaged_listing=exclude` +
        `&fregfrom=${year}&fregto=${year}` +
        `&pricefrom=${eurLo}&priceto=${eurHi}&sort=price&desc=0`
      );
    }
    case "AE": {
      const aedLo = Math.round(lo * 3.67);
      const aedHi = Math.round(hi * 3.67);
      return (
        "https://www.dubicars.com/search" +
        `?keywords=urus&make=lamborghini&model=urus` +
        `&year_min=${year}&year_max=${year}` +
        `&price_min=${aedLo}&price_max=${aedHi}`
      );
    }
    default:
      return listing.sourceUrl;
  }
}

export function listingCtaLabel(listing: Listing): string {
  return isDetailListingUrl(listing.sourceUrl)
    ? "Open live listing"
    : "View live matches";
}
