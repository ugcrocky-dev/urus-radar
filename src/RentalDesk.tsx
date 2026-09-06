import { useMemo, useState } from "react";
import { formatMoney } from "./data/listings";

/** Rough market ranges for planning — not a guarantee of earnings. */
const DEFAULTS = {
  purchasePrice: 220000,
  dailyRate: 950,
  rentedDaysPerMonth: 8,
  platformFeePct: 15, // Turo-like host fee ballpark
  commercialInsuranceMonthly: 1200,
  maintenanceReservePerDay: 75, // pads/tires/detailing amortised
  registrationStorageMonthly: 350,
  cleaningPerRental: 120,
  milesPerRentalDay: 100,
  excessWearReservePerMile: 0.35,
  depositHold: 5000, // renter hold, not your income
};

export function RentalDesk({ seedPurchasePrice }: { seedPurchasePrice?: number }) {
  const [purchasePrice, setPurchasePrice] = useState(
    seedPurchasePrice && seedPurchasePrice > 0 ? seedPurchasePrice : DEFAULTS.purchasePrice,
  );
  const [dailyRate, setDailyRate] = useState(DEFAULTS.dailyRate);
  const [daysPerMonth, setDaysPerMonth] = useState(DEFAULTS.rentedDaysPerMonth);
  const [platformFeePct, setPlatformFeePct] = useState(DEFAULTS.platformFeePct);
  const [insuranceMonthly, setInsuranceMonthly] = useState(
    DEFAULTS.commercialInsuranceMonthly,
  );
  const [maintPerDay, setMaintPerDay] = useState(DEFAULTS.maintenanceReservePerDay);
  const [storageMonthly, setStorageMonthly] = useState(
    DEFAULTS.registrationStorageMonthly,
  );
  const [cleaningPerRental, setCleaningPerRental] = useState(
    DEFAULTS.cleaningPerRental,
  );

  const math = useMemo(() => {
    const gross = dailyRate * daysPerMonth;
    const platformFee = gross * (platformFeePct / 100);
    const maintenance = maintPerDay * daysPerMonth;
    const cleaning = cleaningPerRental * daysPerMonth; // assume 1 rental-day ≈ 1 trip for simple model
    const mileageReserve =
      daysPerMonth * DEFAULTS.milesPerRentalDay * DEFAULTS.excessWearReservePerMile;
    const fixedMonthly = insuranceMonthly + storageMonthly;
    const variable = platformFee + maintenance + cleaning + mileageReserve;
    const totalCosts = fixedMonthly + variable;
    const net = gross - totalCosts;
    const annualNet = net * 12;
    const paybackMonths = net > 0 ? purchasePrice / net : null;
    const occupancy = (daysPerMonth / 30) * 100;
    const breakEvenDays =
      dailyRate - maintPerDay - cleaningPerRental - dailyRate * (platformFeePct / 100) >
      0
        ? Math.ceil(
            fixedMonthly /
              (dailyRate -
                maintPerDay -
                cleaningPerRental -
                dailyRate * (platformFeePct / 100) -
                DEFAULTS.milesPerRentalDay * DEFAULTS.excessWearReservePerMile),
          )
        : null;

    return {
      gross,
      platformFee,
      maintenance,
      cleaning,
      mileageReserve,
      fixedMonthly,
      totalCosts,
      net,
      annualNet,
      paybackMonths,
      occupancy,
      breakEvenDays,
    };
  }, [
    purchasePrice,
    dailyRate,
    daysPerMonth,
    platformFeePct,
    insuranceMonthly,
    maintPerDay,
    storageMonthly,
    cleaningPerRental,
  ]);

  return (
    <section className="panel money-desk" id="make-money">
      <div className="money-head">
        <div>
          <h2>Make money renting it</h2>
          <p>
            If you buy a used Urus, short rentals (Turo / exotic desks / weekend
            packages) can offset ownership. Model a few rented days/month —
            insurance and fees eat a big chunk of the sticker rate.
          </p>
        </div>
        <div className="money-pill">
          Est. net / month
          <strong className={math.net >= 0 ? "up" : "down"}>
            {formatMoney(math.net)}
          </strong>
        </div>
      </div>

      <div className="money-grid">
        <label className="money-field">
          <span>Purchase price (USD)</span>
          <input
            type="number"
            min={100000}
            step={1000}
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
          />
        </label>
        <label className="money-field">
          <span>Your daily rate (USD)</span>
          <input
            type="number"
            min={200}
            step={25}
            value={dailyRate}
            onChange={(e) => setDailyRate(Number(e.target.value) || 0)}
          />
          <small>Peer-to-peer often $600–$1,200 · exotic desks $1,000–$2,200</small>
        </label>
        <label className="money-field">
          <span>Rented days / month</span>
          <input
            type="range"
            min={0}
            max={20}
            value={daysPerMonth}
            onChange={(e) => setDaysPerMonth(Number(e.target.value))}
          />
          <strong>{daysPerMonth} days · {math.occupancy.toFixed(0)}% occupancy</strong>
        </label>
        <label className="money-field">
          <span>Platform / host fee %</span>
          <input
            type="number"
            min={0}
            max={40}
            step={1}
            value={platformFeePct}
            onChange={(e) => setPlatformFeePct(Number(e.target.value) || 0)}
          />
          <small>Turo-style host fees often ~10–25% depending on plan</small>
        </label>
        <label className="money-field">
          <span>Commercial / host insurance (monthly)</span>
          <input
            type="number"
            min={0}
            step={50}
            value={insuranceMonthly}
            onChange={(e) => setInsuranceMonthly(Number(e.target.value) || 0)}
          />
          <small>Exotic host policies commonly $800–$2,000+/mo — get quotes</small>
        </label>
        <label className="money-field">
          <span>Maint. reserve / rented day</span>
          <input
            type="number"
            min={0}
            step={5}
            value={maintPerDay}
            onChange={(e) => setMaintPerDay(Number(e.target.value) || 0)}
          />
          <small>Brakes, tires, oil, unexpected wear</small>
        </label>
        <label className="money-field">
          <span>Storage + registration / mo</span>
          <input
            type="number"
            min={0}
            step={25}
            value={storageMonthly}
            onChange={(e) => setStorageMonthly(Number(e.target.value) || 0)}
          />
        </label>
        <label className="money-field">
          <span>Detailing / turnaround per rental</span>
          <input
            type="number"
            min={0}
            step={10}
            value={cleaningPerRental}
            onChange={(e) => setCleaningPerRental(Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <div className="money-breakdown">
        <div>
          <label>Gross rental revenue</label>
          <strong>{formatMoney(math.gross)}</strong>
        </div>
        <div>
          <label>Platform fees</label>
          <strong>−{formatMoney(math.platformFee)}</strong>
        </div>
        <div>
          <label>Insurance + storage (fixed)</label>
          <strong>−{formatMoney(math.fixedMonthly)}</strong>
        </div>
        <div>
          <label>Maint + detail + mile reserve</label>
          <strong>
            −{formatMoney(math.maintenance + math.cleaning + math.mileageReserve)}
          </strong>
        </div>
        <div className="total">
          <label>Net / month</label>
          <strong className={math.net >= 0 ? "up" : "down"}>
            {formatMoney(math.net)}
          </strong>
        </div>
        <div>
          <label>Net / year (simple ×12)</label>
          <strong>{formatMoney(math.annualNet)}</strong>
        </div>
        <div>
          <label>Payback on purchase</label>
          <strong>
            {math.paybackMonths
              ? `${math.paybackMonths.toFixed(1)} months`
              : "— (not profitable)"}
          </strong>
        </div>
        <div>
          <label>Break-even rented days / mo</label>
          <strong>
            {math.breakEvenDays != null && Number.isFinite(math.breakEvenDays) && math.breakEvenDays < 31
              ? `~${math.breakEvenDays} days`
              : "Check costs"}
          </strong>
        </div>
      </div>

      <div className="money-notes">
        <h3>Fees & insurance to plan for</h3>
        <ul>
          <li>
            <strong>Renter security deposit / hold:</strong> typically{" "}
            {formatMoney(DEFAULTS.depositHold)}–$10,000 on their card — not your
            revenue; covers damage disputes.
          </li>
          <li>
            <strong>Host insurance:</strong> personal auto usually excludes
            rentals. Use platform protection + a commercial/host exotic policy.
            Budget deductibles of $2,500–$10,000.
          </li>
          <li>
            <strong>Platform fees:</strong> keep {100 - platformFeePct}% of the
            trip price in this model after a {platformFeePct}% fee — confirm your
            marketplace plan.
          </li>
          <li>
            <strong>Mileage caps:</strong> common 75–200 mi/day; overage $1–$5/mi
            to guests, but you still eat tire/brake wear.
          </li>
          <li>
            <strong>Delivery / airport / events:</strong> charge extra ($150–$500+)
            or it comes out of net.
          </li>
          <li>
            <strong>Taxes & licensing:</strong> sales/tourism tax, possible
            business license, and some cities restrict peer-to-peer exotics.
          </li>
          <li>
            <strong>Depreciation & downtime:</strong> one claim, track day, or
            slow month can wipe several “good” rental weeks — keep reserves.
          </li>
        </ul>
        <p className="disclaimer">
          Illustrative only. Rates and insurance vary by city, credit, driving
          record, and vehicle year. Verify with a broker, CPA, and the platform’s
          current host terms before buying to rent.
        </p>
      </div>
    </section>
  );
}
