import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "./data/listings";

/** Rough market ranges for planning — not a guarantee of earnings. */
const DEFAULTS = {
  purchasePrice: 220000,
  downPaymentPct: 20,
  loanTermMonths: 60,
  aprPct: 8.99, // used-exotic / non-prime ballpark — shop your quote
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

/** Standard amortizing monthly payment. Returns 0 for cash / invalid loans. */
function monthlyLoanPayment(principal: number, aprPct: number, termMonths: number) {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (aprPct <= 0) return principal / termMonths;
  const r = aprPct / 100 / 12;
  const factor = Math.pow(1 + r, termMonths);
  return (principal * r * factor) / (factor - 1);
}

export function RentalDesk({ seedPurchasePrice }: { seedPurchasePrice?: number }) {
  const [purchasePrice, setPurchasePrice] = useState(
    seedPurchasePrice && seedPurchasePrice > 0 ? seedPurchasePrice : DEFAULTS.purchasePrice,
  );
  const [downPaymentPct, setDownPaymentPct] = useState(DEFAULTS.downPaymentPct);
  const [loanTermMonths, setLoanTermMonths] = useState(DEFAULTS.loanTermMonths);
  const [aprPct, setAprPct] = useState(DEFAULTS.aprPct);
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

  useEffect(() => {
    if (seedPurchasePrice && seedPurchasePrice > 0) {
      setPurchasePrice(seedPurchasePrice);
    }
  }, [seedPurchasePrice]);

  const math = useMemo(() => {
    const clampedDown = Math.min(100, Math.max(0, downPaymentPct));
    const downPayment = purchasePrice * (clampedDown / 100);
    const loanAmount = Math.max(0, purchasePrice - downPayment);
    const financePayment = monthlyLoanPayment(loanAmount, aprPct, loanTermMonths);

    const gross = dailyRate * daysPerMonth;
    const platformFee = gross * (platformFeePct / 100);
    const maintenance = maintPerDay * daysPerMonth;
    const cleaning = cleaningPerRental * daysPerMonth; // assume 1 rental-day ≈ 1 trip
    const mileageReserve =
      daysPerMonth * DEFAULTS.milesPerRentalDay * DEFAULTS.excessWearReservePerMile;
    const fixedOps = insuranceMonthly + storageMonthly;
    const fixedMonthly = fixedOps + financePayment;
    const variable = platformFee + maintenance + cleaning + mileageReserve;
    const totalCosts = fixedMonthly + variable;
    const net = gross - totalCosts;
    const annualNet = net * 12;
    const cashOnCashMonths = net > 0 && downPayment > 0 ? downPayment / net : null;
    const paybackOnPurchase = net > 0 ? purchasePrice / net : null;
    const occupancy = (daysPerMonth / 30) * 100;
    const contributionPerDay =
      dailyRate -
      maintPerDay -
      cleaningPerRental -
      dailyRate * (platformFeePct / 100) -
      DEFAULTS.milesPerRentalDay * DEFAULTS.excessWearReservePerMile;
    const breakEvenDays =
      contributionPerDay > 0 ? Math.ceil(fixedMonthly / contributionPerDay) : null;

    return {
      downPayment,
      loanAmount,
      financePayment,
      gross,
      platformFee,
      maintenance,
      cleaning,
      mileageReserve,
      fixedOps,
      fixedMonthly,
      totalCosts,
      net,
      annualNet,
      cashOnCashMonths,
      paybackOnPurchase,
      occupancy,
      breakEvenDays,
    };
  }, [
    purchasePrice,
    downPaymentPct,
    loanTermMonths,
    aprPct,
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
            If you finance a used Urus, short rentals (Turo / exotic desks /
            weekend packages) have to clear the monthly loan payment plus
            insurance and fees. Model a few rented days/month against the note.
          </p>
        </div>
        <div className="money-pill">
          Est. cash flow / month
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
          <span>Down payment %</span>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(Number(e.target.value) || 0)}
          />
          <small>
            {formatMoney(math.downPayment)} down · {formatMoney(math.loanAmount)} financed
          </small>
        </label>
        <label className="money-field">
          <span>Loan term (months)</span>
          <input
            type="number"
            min={0}
            max={84}
            step={12}
            value={loanTermMonths}
            onChange={(e) => setLoanTermMonths(Number(e.target.value) || 0)}
          />
          <small>Common used terms: 36–72 months · set 0 for cash</small>
        </label>
        <label className="money-field">
          <span>APR %</span>
          <input
            type="number"
            min={0}
            max={30}
            step={0.1}
            value={aprPct}
            onChange={(e) => setAprPct(Number(e.target.value) || 0)}
          />
          <small>Used exotic / specialty finance often ~7–12%+ — get a quote</small>
        </label>
        <label className="money-field">
          <span>Finance payment (monthly)</span>
          <input type="number" readOnly value={Math.round(math.financePayment)} />
          <small>Calculated from price, down %, term, and APR</small>
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
          <strong>
            {daysPerMonth} days · {math.occupancy.toFixed(0)}% occupancy
          </strong>
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
          <label>Finance / loan payment</label>
          <strong>−{formatMoney(math.financePayment)}</strong>
        </div>
        <div>
          <label>Platform fees</label>
          <strong>−{formatMoney(math.platformFee)}</strong>
        </div>
        <div>
          <label>Insurance + storage</label>
          <strong>−{formatMoney(math.fixedOps)}</strong>
        </div>
        <div>
          <label>Maint + detail + mile reserve</label>
          <strong>
            −{formatMoney(math.maintenance + math.cleaning + math.mileageReserve)}
          </strong>
        </div>
        <div className="total">
          <label>Cash flow / month (after loan)</label>
          <strong className={math.net >= 0 ? "up" : "down"}>
            {formatMoney(math.net)}
          </strong>
        </div>
        <div>
          <label>Cash flow / year (simple ×12)</label>
          <strong>{formatMoney(math.annualNet)}</strong>
        </div>
        <div>
          <label>Payback on down payment</label>
          <strong>
            {math.cashOnCashMonths
              ? `${math.cashOnCashMonths.toFixed(1)} months`
              : "— (not covering costs)"}
          </strong>
        </div>
        <div>
          <label>Break-even rented days / mo</label>
          <strong>
            {math.breakEvenDays != null &&
            Number.isFinite(math.breakEvenDays) &&
            math.breakEvenDays < 31
              ? `~${math.breakEvenDays} days`
              : "Check costs / loan"}
          </strong>
        </div>
      </div>

      <div className="money-notes">
        <h3>Finance, fees & insurance to plan for</h3>
        <ul>
          <li>
            <strong>Monthly finance payment:</strong> this model uses a standard
            amortizing note (
            {formatMoney(math.loanAmount)} at {aprPct}% APR for {loanTermMonths || 0}{" "}
            months → {formatMoney(math.financePayment)}/mo). Lenders may require
            higher down payments, shorter terms, or decline rental use — confirm
            before you buy.
          </li>
          <li>
            <strong>Cash vs financed:</strong> set down payment to 100% (or term to
            0) for an all-cash buy. Financed deals need more rented days to break
            even because the note is a fixed monthly burn.
          </li>
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
            slow month can wipe several “good” rental weeks — keep reserves
            beyond the loan payment.
          </li>
        </ul>
        <p className="disclaimer">
          Illustrative only. Loan rates, insurance, and rental demand vary by
          credit, city, driving record, and vehicle year. Verify with a lender,
          broker, CPA, and the platform’s current host terms before buying to
          rent.
        </p>
      </div>
    </section>
  );
}
