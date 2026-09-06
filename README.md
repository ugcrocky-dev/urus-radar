# Urus Radar

Interactive market desk for used Lamborghini Urus listings (focus: 3–4 year old / 2022–2023), comparing US, UK, Germany, and Dubai asks with import landed-cost estimates — plus a **rental income calculator**.

## Live dashboard

- **GitHub:** https://github.com/ugcrocky-dev/urus-radar
- **Dashboard:** https://urus-radar.vercel.app

```bash
npm install
npm run dev
```

## Daily refresh

```bash
npm run refresh
npm run refresh:daemon
```

GitHub Action `.github/workflows/daily-refresh.yml` runs daily at 06:00 UTC.

## Make money renting (on the dashboard)

Open **Make money renting it** on the desk to model:

| Input | Typical range |
| --- | --- |
| Purchase price + down payment % | e.g. 20% down on a ~$220k ask |
| Loan term + APR | Used specialty finance often 36–72 mo, ~7–12%+ APR |
| **Finance / monthly loan payment** | Auto-calculated from price, down %, term, APR |
| Daily rate | $600–$2,200 depending on city / desk vs Turo |
| Rented days / month | Start with 6–10 to stay realistic |
| Platform / host fee | ~10–25% |
| Host / commercial insurance | Often $800–$2,000+/month for exotics |
| Security deposit (renter hold) | $3,000–$10,000 — not revenue |
| Maint + detail reserves | Budget per rented day |
| Storage / registration | Monthly fixed cost |

The calculator shows gross, **loan payment**, fees, cash flow after the note, annual cash flow, payback on down payment, and break-even rented days (including the monthly finance payment). Set down payment to 100% or term to 0 for an all-cash buy. Illustrative only — confirm lender terms (rental use may be restricted), insurance, licensing, taxes, and platform rules before buying to rent.

## Notes

Listing data is curated from public pages. Verify live pricing, VIN, title, and import rules before buying.
