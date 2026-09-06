# Urus Radar

Interactive market desk for used Lamborghini Urus listings (focus: 3–4 year old / 2022–2023), comparing US, UK, Germany, and Dubai asks with a rough US import landed-cost estimate — plus a **rental income calculator** (insurance, platform fees, maintenance, break-even days).

## Live dashboard

After deploy, open the Vercel URL from the repo README / deployment.

Local:

```bash
npm install
npm run dev
```

## Daily refresh

```bash
npm run refresh          # update listings JSON now
npm run refresh:daemon   # refresh when data is >20h old
```

GitHub Action: `.github/workflows/daily-refresh.yml` runs daily at 06:00 UTC.

## Make money renting

Use the on-page **Make money renting it** desk to model:
- daily rate × rented days/month
- platform/host fees
- commercial/host insurance
- maintenance + detailing reserves
- storage/registration
- break-even occupancy and payback

Illustrative only — verify insurance, licensing, and platform terms before buying to rent.
