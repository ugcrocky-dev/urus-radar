import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  estimateUsLanded,
  formatMoney,
  hoursSinceRefresh,
  isStale,
  listingCtaLabel,
  liveListingUrl,
  marketMeta,
  milesEquivalent,
  type Listing,
  type ListingsPayload,
  type Market,
  type Trim,
} from "./data/listings";
import { RentalDesk } from "./RentalDesk";
import "./index.css";

type SortKey = "priceAsc" | "priceDesc" | "milesAsc" | "yearDesc" | "deal";

const dealRank: Record<Listing["deal"], number> = {
  Great: 0,
  Fair: 1,
  High: 2,
  Watch: 3,
};

const allMarkets: Market[] = ["US", "UK", "DE", "AE"];
const allTrims: Trim[] = [
  "Standard",
  "S",
  "Performante",
  "Graphite Capsule",
  "Mansory",
];
const allYears = [2022, 2023, 2021, 2024];

function formatRefreshLabel(iso: string | null) {
  if (!iso) return "Never refreshed";
  const hours = hoursSinceRefresh(iso);
  const when = new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  if (hours == null) return when;
  if (hours < 1) return `Updated ${when} · just now`;
  if (hours < 24) return `Updated ${when} · ${hours.toFixed(0)}h ago`;
  return `Updated ${when} · ${(hours / 24).toFixed(1)}d ago`;
}

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [refreshNotes, setRefreshNotes] = useState<string[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  const [marketFilter, setMarketFilter] = useState<Market[]>([]);
  const [yearFilter, setYearFilter] = useState<number[]>([2022, 2023]);
  const [trimFilter, setTrimFilter] = useState<Trim[]>([]);
  const [cpoOnly, setCpoOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(350000);
  const [maxMiles, setMaxMiles] = useState(80000);
  const [sort, setSort] = useState<SortKey>("deal");
  const [selected, setSelected] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(true);

  const loadListings = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setIsReloading(true);
    try {
      const res = await fetch(`/data/listings.json?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ListingsPayload;
      setListings(data.listings ?? []);
      setLastRefreshed(data.lastRefreshed ?? null);
      setRefreshNotes(data.refreshNotes ?? []);
      setLoadState("ready");
      setLoadError(null);
    } catch (err) {
      setLoadState("error");
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsReloading(false);
    }
  }, []);

  useEffect(() => {
    void loadListings({ quiet: true });
    // Re-check the JSON every hour while the tab is open
    const id = window.setInterval(() => {
      void loadListings({ quiet: true });
    }, 60 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [loadListings]);

  const stale = isStale(lastRefreshed);

  const filtered = useMemo(() => {
    const rows = listings.filter((l) => {
      if (marketFilter.length && !marketFilter.includes(l.market)) return false;
      if (yearFilter.length && !yearFilter.includes(l.year)) return false;
      if (trimFilter.length && !trimFilter.includes(l.trim)) return false;
      if (cpoOnly && !l.cpo) return false;
      if (l.priceUsd > maxPrice) return false;
      if (milesEquivalent(l) > maxMiles) return false;
      return true;
    });

    rows.sort((a, b) => {
      switch (sort) {
        case "priceAsc":
          return a.priceUsd - b.priceUsd;
        case "priceDesc":
          return b.priceUsd - a.priceUsd;
        case "milesAsc":
          return milesEquivalent(a) - milesEquivalent(b);
        case "yearDesc":
          return b.year - a.year || a.priceUsd - b.priceUsd;
        default:
          return dealRank[a.deal] - dealRank[b.deal] || a.priceUsd - b.priceUsd;
      }
    });
    return rows;
  }, [
    listings,
    marketFilter,
    yearFilter,
    trimFilter,
    cpoOnly,
    maxPrice,
    maxMiles,
    sort,
  ]);

  const stats = useMemo(() => {
    if (!filtered.length) {
      return { count: 0, median: 0, cheapest: 0, markets: 0 };
    }
    const prices = [...filtered.map((l) => l.priceUsd)].sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    const median =
      prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];
    return {
      count: filtered.length,
      median: Math.round(median),
      cheapest: prices[0],
      markets: new Set(filtered.map((l) => l.market)).size,
    };
  }, [filtered]);

  const compared = listings.filter((l) => selected.includes(l.id));

  function toggleValue<T>(value: T, list: T[], setList: (next: T[]) => void) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="brand-row">
          <div>
            <p className={`stamp ${stale ? "stale" : ""}`}>
              <i /> Daily desk · {formatRefreshLabel(lastRefreshed)}
              {stale ? " · needs refresh" : ""}
            </p>
            <h1 className="brand">
              <span>Urus Radar</span>
            </h1>
            <p className="tagline">
              One desk for 3–4 year old Lamborghini Urus asks across the US, UK,
              Germany, and Dubai — plus a rough US landed-cost check so “cheap
              abroad” doesn’t fool you. Data refreshes every day.
            </p>
          </div>
          <div className="refresh-panel">
            <button
              type="button"
              className="btn primary"
              onClick={() => void loadListings()}
              disabled={isReloading}
            >
              {isReloading ? "Checking…" : "Check for updates"}
            </button>
            <p className="refresh-hint">
              Auto-refreshes daily via <code>npm run refresh</code> / GitHub
              Action. This button reloads today’s JSON.
            </p>
            {loadState === "error" && (
              <p className="refresh-error">Load failed: {loadError}</p>
            )}
            {refreshNotes.length > 0 && !stale && (
              <p className="refresh-hint">
                Last run: {refreshNotes[0]}
              </p>
            )}
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <label>Listings shown</label>
            <strong>{stats.count}</strong>
          </div>
          <div className="stat">
            <label>Median ask (USD)</label>
            <strong>{stats.median ? formatMoney(stats.median) : "—"}</strong>
          </div>
          <div className="stat">
            <label>Cheapest ask</label>
            <strong>{stats.cheapest ? formatMoney(stats.cheapest) : "—"}</strong>
          </div>
          <div className="stat">
            <label>Markets</label>
            <strong>{stats.markets}</strong>
          </div>
        </div>
      </header>

      <RentalDesk
        seedPurchasePrice={stats.cheapest || stats.median || undefined}
      />

      <div className="layout">
        <aside className="panel filters">
          <h2>Filters</h2>

          <div className="field">
            <span>Market</span>
            <div className="chips">
              {allMarkets.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`chip ${marketFilter.includes(m) ? "active" : ""}`}
                  onClick={() => toggleValue(m, marketFilter, setMarketFilter)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Model year</span>
            <div className="chips">
              {allYears.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={`chip ${yearFilter.includes(y) ? "active" : ""}`}
                  onClick={() => toggleValue(y, yearFilter, setYearFilter)}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Trim</span>
            <div className="chips">
              {allTrims.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`chip ${trimFilter.includes(t) ? "active" : ""}`}
                  onClick={() => toggleValue(t, trimFilter, setTrimFilter)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Max price (USD) — {formatMoney(maxPrice)}</span>
            <input
              type="range"
              min={150000}
              max={350000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <span>Max miles equiv. — {maxMiles.toLocaleString()}</span>
            <input
              type="range"
              min={5000}
              max={80000}
              step={1000}
              value={maxMiles}
              onChange={(e) => setMaxMiles(Number(e.target.value))}
            />
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={cpoOnly}
              onChange={(e) => setCpoOnly(e.target.checked)}
            />
            CPO / Selezione only
          </label>

          <div className="field">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="deal">Best deal signal</option>
              <option value="priceAsc">Price ↑</option>
              <option value="priceDesc">Price ↓</option>
              <option value="milesAsc">Miles ↑</option>
              <option value="yearDesc">Year ↓</option>
            </select>
          </div>

          <p className="hint">
            Tip: pick up to 3 cars with “Compare” to stack local ask vs estimated
            US landed cost.
          </p>
        </aside>

        <main className="main">
          <div className="panel toolbar">
            <p>
              Showing <strong>{filtered.length}</strong> of {listings.length}{" "}
              curated asks · default focus 2022–2023
            </p>
            <div className="toolbar-actions">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={showImport}
                  onChange={(e) => setShowImport(e.target.checked)}
                />
                Import math panel
              </label>
              {selected.length > 0 && (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setSelected([])}
                >
                  Clear compare ({selected.length})
                </button>
              )}
            </div>
          </div>

          {showImport && (
            <section className="panel import-box">
              <h3>Would importing beat a US car?</h3>
              <p>
                Rough model for US buyers: ask + shipping (~$5.5k) + duty (UK
                ~10%, others ~27.5%) + compliance (~$15k) + ~7% state tax. Not
                legal advice — confirm with a customs broker.
              </p>
              <div className="chips">
                {allMarkets.map((m) => (
                  <span
                    key={m}
                    className="chip active"
                    style={{ cursor: "default" }}
                  >
                    {marketMeta[m].flag}: {marketMeta[m].importNote}
                  </span>
                ))}
              </div>
            </section>
          )}

          {compared.length > 0 && (
            <section className="panel compare">
              <h3>Compare desk</h3>
              <p>Local ask vs estimated US landed cost for selected cars.</p>
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Car</th>
                    <th>Market ask</th>
                    <th>Est. US landed</th>
                    <th>vs cheapest US in view</th>
                    <th>Live</th>
                  </tr>
                </thead>
                <tbody>
                  {compared.map((l) => {
                    const landed = estimateUsLanded(l);
                    const usCandidates = listings.filter(
                      (x) => x.market === "US" && yearFilter.includes(x.year),
                    );
                    const usFloor = usCandidates.length
                      ? Math.min(...usCandidates.map((x) => x.priceUsd))
                      : l.priceUsd;
                    const delta = landed == null ? 0 : landed - usFloor;
                    return (
                      <tr key={l.id}>
                        <td>
                          {l.year} {l.trim}
                          <br />
                          <small>
                            {l.city} · {milesEquivalent(l).toLocaleString()} mi
                          </small>
                        </td>
                        <td>
                          {formatMoney(l.priceLocal, l.currency)}
                          <br />
                          <small>{formatMoney(l.priceUsd)} USD</small>
                        </td>
                        <td>{landed ? formatMoney(landed) : "—"}</td>
                        <td>
                          {l.market === "US" ? (
                            <span className="landed-ok">Already US-spec</span>
                          ) : delta > 0 ? (
                            <span className="landed-bad">
                              +{formatMoney(delta)} vs US floor
                            </span>
                          ) : (
                            <span className="landed-ok">
                              {formatMoney(delta)} vs US floor
                            </span>
                          )}
                        </td>
                        <td>
                          <a
                            href={liveListingUrl(l)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {listingCtaLabel(l)}
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}

          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <div className="panel empty">No listings match these filters.</div>
            ) : (
              <div className="grid">
                {filtered.map((listing, index) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    index={index}
                    selected={selected.includes(listing.id)}
                    onCompare={() => toggleSelect(listing.id)}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          <p className="footer-note">
            Cards open live marketplace matches (or the dealer VDP when we have
            a VIN/listing id). Asking prices change; always verify VIN, title,
            PPI, and import eligibility before sending money.
          </p>
        </main>
      </div>
    </div>
  );
}

function ListingCard({
  listing,
  index,
  selected,
  onCompare,
}: {
  listing: Listing;
  index: number;
  selected: boolean;
  onCompare: () => void;
}) {
  const miles = milesEquivalent(listing);
  const landed = estimateUsLanded(listing);

  return (
    <motion.article
      className={`card ${selected ? "selected" : ""}`}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.24) }}
    >
      <div className="card-top">
        <div>
          <h3 className="year-trim">
            {listing.year} Urus {listing.trim}
          </h3>
          <p className="meta">
            {listing.market} · {listing.city}
          </p>
        </div>
        <span className={`badge ${listing.deal}`}>{listing.deal}</span>
      </div>

      <p className="price">
        {formatMoney(listing.priceLocal, listing.currency)}
        <small>
          {listing.currency !== "USD" && `${formatMoney(listing.priceUsd)} USD · `}
          {listing.market !== "US" && landed
            ? `Est. US landed ${formatMoney(landed)}`
            : listing.cpo
              ? "Selezione / CPO"
              : listing.seller}
        </small>
      </p>

      <dl className="facts">
        <div>
          <dt>Mileage</dt>
          <dd>
            {listing.mileage.toLocaleString()} {listing.mileageUnit}
            {listing.mileageUnit === "km" && (
              <small style={{ display: "block", color: "var(--muted)" }}>
                ≈ {miles.toLocaleString()} mi
              </small>
            )}
          </dd>
        </div>
        <div>
          <dt>Warranty</dt>
          <dd>{listing.warranty}</dd>
        </div>
        <div>
          <dt>Color</dt>
          <dd>{listing.color}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{listing.source}</dd>
        </div>
      </dl>

      <p className="notes">{listing.notes}</p>

      <div className="card-actions">
        <a
          className="btn primary"
          href={liveListingUrl(listing)}
          target="_blank"
          rel="noopener noreferrer"
          title="Opens live inventory for this year / price band"
        >
          {listingCtaLabel(listing)}
        </a>
        <button type="button" className="btn" onClick={onCompare}>
          {selected ? "Selected" : "Compare"}
        </button>
      </div>
    </motion.article>
  );
}
