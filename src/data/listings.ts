export type Market = "US" | "UK" | "DE" | "AE";
export type Trim = "Standard" | "S" | "Performante" | "Graphite Capsule" | "Mansory";

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

/** Snapshot of public asking prices (Sep 2026). Prices move; verify before buying. */
export const listings: Listing[] = [
  {
    id: "us-nyc-17176",
    year: 2022,
    trim: "Standard",
    priceUsd: 224972,
    priceLocal: 224972,
    currency: "USD",
    mileage: 6652,
    mileageUnit: "mi",
    market: "US",
    city: "New York, NY",
    color: "—",
    interior: "—",
    seller: "Manhattan Motorcars",
    cpo: false,
    warranty: "Likely expired factory",
    source: "TrueCar",
    sourceUrl: "https://www.truecar.com/used-cars-for-sale/listings/lamborghini/urus/year-2022/",
    notes: "Low miles; dealer fees may apply",
    deal: "Fair",
  },
  {
    id: "us-nj-20221",
    year: 2022,
    trim: "Standard",
    priceUsd: 195498,
    priceLocal: 195498,
    currency: "USD",
    mileage: 37398,
    mileageUnit: "mi",
    market: "US",
    city: "Union, NJ",
    color: "Gray",
    interior: "Black",
    seller: "Autopia Motorcars",
    cpo: false,
    warranty: "Out of factory",
    source: "CarGurus / TrueCar",
    sourceUrl: "https://www.cargurus.com/Cars/l-Used-Lamborghini-Urus-d2787",
    notes: "Higher miles = stronger negotiation leverage; PPI brakes/tires",
    deal: "Great",
  },
  {
    id: "us-dal-16984",
    year: 2022,
    trim: "Standard",
    priceUsd: 214999,
    priceLocal: 214999,
    currency: "USD",
    mileage: 23584,
    mileageUnit: "mi",
    market: "US",
    city: "Dallas, TX",
    color: "Bianco Monocerus",
    interior: "Nero Ade",
    seller: "Lamborghini Dallas",
    cpo: true,
    warranty: "Selezione CPO",
    source: "Dealer CPO",
    sourceUrl: "https://www.lamborghinidallas.com/",
    notes: "Smoke-free CPO; premium worth it for coverage",
    deal: "Fair",
  },
  {
    id: "us-irv-25479",
    year: 2023,
    trim: "Performante",
    priceUsd: 289900,
    priceLocal: 289900,
    currency: "USD",
    mileage: 11739,
    mileageUnit: "mi",
    market: "US",
    city: "Irvine, CA",
    color: "Gray",
    interior: "Black",
    seller: "Newport Beach Automotive Group",
    cpo: false,
    warranty: "Check remaining",
    source: "CarStory",
    sourceUrl: "https://www.carstory.com/",
    notes: "Performante premium; low supply",
    deal: "High",
  },
  {
    id: "uk-ph-189995",
    year: 2023,
    trim: "S",
    priceUsd: 248000,
    priceLocal: 189995,
    currency: "GBP",
    mileage: 29000,
    mileageUnit: "mi",
    market: "UK",
    city: "Hindley Green, UK",
    color: "Grigio Nimbus (matte wrap)",
    interior: "Black leather",
    seller: "PistonHeads seller",
    cpo: false,
    warranty: "Lambo warranty to Mar 2027",
    source: "PistonHeads",
    sourceUrl: "https://www.pistonheads.com/buy/listing/20975775",
    notes: "RHD; warranty remaining; wrap may hide paint—inspect",
    deal: "Fair",
  },
  {
    id: "de-dus-s23",
    year: 2023,
    trim: "S",
    priceUsd: 308000,
    priceLocal: 263900,
    currency: "EUR",
    mileage: 19855,
    mileageUnit: "km",
    market: "DE",
    city: "Düsseldorf, DE",
    color: "Rosso Efesto",
    interior: "Nero Ade / Rosso stitch",
    seller: "Lamborghini Düsseldorf",
    cpo: false,
    warranty: "Ask dealer",
    source: "Dealer",
    sourceUrl: "https://www.lamborghini-duesseldorf.de/",
    notes: "€221,764 netto (VAT reclaim possible for qualified export)",
    deal: "Watch",
  },
  {
    id: "ae-23-s-low",
    year: 2023,
    trim: "S",
    priceUsd: 250700,
    priceLocal: 920000,
    currency: "AED",
    mileage: 2000,
    mileageUnit: "km",
    market: "AE",
    city: "Dubai",
    color: "—",
    interior: "—",
    seller: "DubiCars dealer",
    cpo: false,
    warranty: "Ask seller",
    source: "DubiCars",
    sourceUrl: "https://www.dubicars.com/dubai/used/lamborghini/urus",
    notes: "Very low km — sticker competitive vs US before import math",
    deal: "Great",
  },
  {
    id: "ae-gcc-22-wh",
    year: 2022,
    trim: "Standard",
    priceUsd: 172300,
    priceLocal: 633000,
    currency: "AED",
    mileage: 113384,
    mileageUnit: "km",
    market: "AE",
    city: "Dubai",
    color: "—",
    interior: "—",
    seller: "DubiCars dealer",
    cpo: false,
    warranty: "Lambo warranty to Oct 2026",
    source: "DubiCars",
    sourceUrl: "https://www.dubicars.com/dubai/used/lamborghini/urus",
    notes: "Very high km GCC — cheap sticker, expensive wear risk",
    deal: "Watch",
  },
];

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
    importNote: "Netto deals exist; ~27.5% US duty + RI costs usually erase savings",
  },
  AE: {
    label: "UAE / Dubai",
    flag: "AE",
    importNote: "Deep inventory; GCC/EU/JP specs; export+duty rarely beats US street",
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
