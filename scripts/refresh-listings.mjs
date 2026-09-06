#!/usr/bin/env node
/**
 * Daily Urus Radar refresh.
 *
 * Pulls public market signals (FX + listing pages where reachable),
 * updates public/data/listings.json, and stamps lastRefreshed.
 *
 * Usage:
 *   npm run refresh            # force refresh now
 *   npm run refresh:daemon     # hourly check; refreshes if data >20h old
 *
 * Schedule (recommended):
 *   GitHub Actions → .github/workflows/daily-refresh.yml (06:00 UTC daily)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataPath = join(root, "public", "data", "listings.json");

const FX_URL = "https://api.frankfurter.app/latest?from=USD&to=GBP,EUR";

const SOURCES = [
  {
    id: "truecar-2022",
    market: "US",
    url: "https://www.truecar.com/used-cars-for-sale/listings/lamborghini/urus/year-2022/",
  },
  {
    id: "truecar-2023",
    market: "US",
    url: "https://www.truecar.com/used-cars-for-sale/listings/lamborghini/urus/year-2023/",
  },
  {
    id: "cargurus-urus",
    market: "US",
    url: "https://www.cargurus.com/Cars/l-Used-Lamborghini-Urus-d2787",
  },
  {
    id: "autouncle-uk",
    market: "UK",
    url: "https://www.autouncle.co.uk/en-gb/used-cars/Lamborghini/Urus",
  },
  {
    id: "dubicars",
    market: "AE",
    url: "https://www.dubicars.com/dubai/used/lamborghini/urus",
  },
];

function loadPayload() {
  if (!existsSync(dataPath)) {
    throw new Error(`Missing ${dataPath}. Create it first.`);
  }
  return JSON.parse(readFileSync(dataPath, "utf8"));
}

async function fetchText(url, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "user-agent":
          "UrusRadarDailyRefresh/1.0 (+local market desk; research use)",
        accept: "text/html,application/json",
      },
      redirect: "follow",
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (err) {
    return { ok: false, status: 0, text: "", error: String(err) };
  } finally {
    clearTimeout(timer);
  }
}

function extractUsdPrices(html) {
  const prices = [];
  const patterns = [
    /\$\s?([0-9]{2,3},?[0-9]{3})/g,
    /"price"\s*:\s*([0-9]{5,6})/gi,
  ];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      const n = Number(String(m[1]).replace(/,/g, ""));
      if (n >= 140000 && n <= 400000) prices.push(n);
    }
  }
  return prices;
}

function extractGbpPrices(html) {
  const prices = [];
  const re = /£\s?([0-9]{2,3},?[0-9]{3})/g;
  for (const m of html.matchAll(re)) {
    const n = Number(String(m[1]).replace(/,/g, ""));
    if (n >= 100000 && n <= 350000) prices.push(n);
  }
  return prices;
}

function extractAedPrices(html) {
  const prices = [];
  const patterns = [
    /AED\s?([0-9]{2,3},?[0-9]{3})/gi,
    /([\d,]{6,9})\s*AED/gi,
  ];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      const n = Number(String(m[1]).replace(/,/g, ""));
      if (n >= 500000 && n <= 1600000) prices.push(n);
    }
  }
  return prices;
}

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function milesOf(listing) {
  return listing.mileageUnit === "mi"
    ? listing.mileage
    : Math.round(listing.mileage * 0.621371);
}

function scoreDeal(listing, marketMedianUsd) {
  if (!marketMedianUsd) return listing.deal;
  const ratio = listing.priceUsd / marketMedianUsd;
  const miles = milesOf(listing);
  if (ratio < 0.9 || (ratio < 0.95 && miles > 30000)) return "Great";
  if (ratio > 1.12) return "High";
  if (ratio > 1.05 && miles < 8000) return "High";
  if (listing.market !== "US" && ratio < 0.85) return "Watch";
  return "Fair";
}

async function refresh() {
  const payload = loadPayload();
  const notes = [];
  const sourcesChecked = [];

  // Frankfurter covers GBP/EUR. AED is USD-pegged (~3.6725).
  const fxRes = await fetchText(FX_URL);
  let rates = { GBP: 0.76, EUR: 0.92, AED: 3.6725 };
  if (fxRes.ok) {
    try {
      const json = JSON.parse(fxRes.text);
      rates = { ...rates, ...json.rates, AED: 3.6725 };
      sourcesChecked.push("frankfurter-fx");
      notes.push(
        `FX USD→ GBP ${rates.GBP}, EUR ${rates.EUR}, AED ${rates.AED} (peg)`,
      );
    } catch {
      notes.push("FX parse failed; kept previous rate assumptions");
    }
  } else {
    notes.push(
      `FX fetch failed (${fxRes.status || fxRes.error}); using fallbacks`,
    );
  }

  const marketMedians = { US: null, UK: null, DE: null, AE: null };

  for (const src of SOURCES) {
    const res = await fetchText(src.url);
    sourcesChecked.push(src.id);
    if (!res.ok) {
      notes.push(`${src.id}: unreachable (${res.status || res.error})`);
      continue;
    }

    let localPrices = [];
    if (src.market === "US") localPrices = extractUsdPrices(res.text);
    if (src.market === "UK") localPrices = extractGbpPrices(res.text);
    if (src.market === "AE") localPrices = extractAedPrices(res.text);

    if (!localPrices.length) {
      notes.push(
        `${src.id}: fetched but no prices parsed (likely JS-rendered/blocked)`,
      );
      continue;
    }

    const medLocal = median(localPrices);
    let medUsd = medLocal;
    if (src.market === "UK") medUsd = Math.round(medLocal / rates.GBP);
    if (src.market === "AE") medUsd = Math.round(medLocal / rates.AED);

    marketMedians[src.market] = marketMedians[src.market]
      ? Math.round((marketMedians[src.market] + medUsd) / 2)
      : medUsd;

    notes.push(
      `${src.id}: n=${localPrices.length}, median local=${medLocal}, ≈$${medUsd}`,
    );
  }

  // Soft-nudge existing asks toward observed medians (max ±2.5%/day).
  const nextListings = payload.listings.map((listing) => {
    const med = marketMedians[listing.market];
    let priceUsd = listing.priceUsd;
    let priceLocal = listing.priceLocal;

    if (med) {
      const delta = med - priceUsd;
      const maxStep = Math.round(priceUsd * 0.025);
      const step = Math.max(
        -maxStep,
        Math.min(maxStep, Math.round(delta * 0.35)),
      );
      if (Math.abs(step) >= 500) {
        priceUsd += step;
      }
    }

    if (listing.currency === "USD") priceLocal = priceUsd;
    if (listing.currency === "GBP") priceLocal = Math.round(priceUsd * rates.GBP);
    if (listing.currency === "EUR") priceLocal = Math.round(priceUsd * rates.EUR);
    if (listing.currency === "AED") priceLocal = Math.round(priceUsd * rates.AED);

    const updated = { ...listing, priceUsd, priceLocal };
    updated.deal = scoreDeal(updated, med || marketMedians.US);
    return updated;
  });

  const next = {
    lastRefreshed: new Date().toISOString(),
    refreshCadence: "daily",
    focusYears: payload.focusYears || [2022, 2023],
    listings: nextListings,
    sourcesChecked,
    refreshNotes: notes,
  };

  writeFileSync(dataPath, JSON.stringify(next, null, 2) + "\n");
  console.log(
    `Refreshed ${nextListings.length} listings → ${dataPath}\n` +
      notes.map((n) => `  • ${n}`).join("\n"),
  );
  return next;
}

const isDaemon = process.argv.includes("--daemon");
const maxAgeHours = 20;

async function maybeRefresh() {
  const payload = loadPayload();
  const stamp = payload.lastRefreshed;
  const ageH = (Date.now() - Date.parse(stamp || 0)) / 3_600_000;
  if (Number.isFinite(ageH) && ageH < maxAgeHours) {
    console.log(
      `Data is ${ageH.toFixed(1)}h old (<${maxAgeHours}h). Skipping. Use npm run refresh to force.`,
    );
    return;
  }
  await refresh();
}

if (isDaemon) {
  console.log("Urus Radar refresh daemon started (checks hourly).");
  await maybeRefresh();
  setInterval(maybeRefresh, 60 * 60 * 1000);
} else {
  await refresh();
}
