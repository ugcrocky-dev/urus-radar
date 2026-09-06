# Urus Radar

Interactive market desk for used Lamborghini Urus listings (focus: 3–4 year old / 2022–2023), comparing US, UK, Germany, and Dubai asks with import landed-cost estimates — plus a **rental income calculator** (insurance, platform fees, maintenance, break-even).

## Links

- **Repo:** https://github.com/ugcrocky-dev/urus-radar
- **Dashboard:** deploy with Vercel (URL in deployment) or run locally below

## Run locally

```bash
npm install
npm run dev
```

## Daily refresh

```bash
npm run refresh
npm run refresh:daemon
```

GitHub Action runs daily at 06:00 UTC and commits `public/data/listings.json`.

## Make money renting

Use **Make money renting it** on the dashboard to model daily rate × rented days, host insurance, platform fees, detailing, storage, break-even occupancy, and payback. Typical peer-to-peer Urus day rates often land ~$600–$1,200; exotic desks higher. Security deposits ($3k–$10k) are holds, not income. Illustrative only — confirm insurance and local rules before buying to rent.
