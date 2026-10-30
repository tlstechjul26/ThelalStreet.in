/**
 * Calculates historical Systematic Investment Plan (SIP) performance
 * using actual historical prices or NAVs.
 * 
 * Rules:
 * - On the first available trading day of each month, a fixed contribution is invested.
 * - Units purchased = monthlyAmount / priceOnDate
 * - Cumulative units and cumulative invested capital are tracked.
 * - On each date t, portfolio value = cumulativeUnits * price_t
 * - Handles market holidays, weekends, and missing dates gracefully by using the first available trading day of each month.
 */
export function calculateSipPerformance(historicalPoints, monthlyAmount = 1000) {
  if (!historicalPoints || !Array.isArray(historicalPoints) || historicalPoints.length === 0) {
    return {
      sipData: [],
      totalInvested: 0,
      currentValue: 0,
      absoluteGain: 0,
      returnPct: 0,
      isGain: false
    };
  }

  // Ensure points are sorted ascending by time and normalize timestamp
  const sorted = [...historicalPoints]
    .map(p => {
      let t = p.time ?? p.date;
      if (typeof t === 'string') {
        t = new Date(t).getTime();
      }
      const rawPrice = Number(p.close ?? p.value ?? p.nav ?? p.price);
      return {
        ...p,
        time: t,
        normalizedPrice: rawPrice
      };
    })
    .filter(p => typeof p.time === 'number' && !isNaN(p.time) && p.normalizedPrice > 0)
    .sort((a, b) => a.time - b.time);

  if (sorted.length === 0) {
    return {
      sipData: [],
      totalInvested: 0,
      currentValue: 0,
      absoluteGain: 0,
      returnPct: 0,
      isGain: false
    };
  }

  let totalInvested = 0;
  let cumulativeUnits = 0;
  let lastInvestedMonthKey = null;

  const sipData = [];

  for (let i = 0; i < sorted.length; i++) {
    const pt = sorted[i];
    const price = pt.normalizedPrice;
    const epochMs = pt.time > 10000000000 ? pt.time : pt.time * 1000;
    const epochSec = Math.floor(epochMs / 1000);
    const dateObj = new Date(epochMs);
    const monthKey = `${dateObj.getFullYear()}-${dateObj.getMonth()}`;

    // If this is the first trading day of a new month, execute monthly SIP contribution
    if (monthKey !== lastInvestedMonthKey) {
      totalInvested += monthlyAmount;
      const unitsBought = monthlyAmount / price;
      cumulativeUnits += unitsBought;
      lastInvestedMonthKey = monthKey;
    }

    const value = cumulativeUnits * price;
    sipData.push({
      time: epochSec, // lightweight-charts epoch seconds
      rawTime: epochMs,
      price,
      invested: Number(totalInvested.toFixed(2)),
      value: Number(value.toFixed(2)),
      units: cumulativeUnits,
      date: dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    });
  }

  const latest = sipData[sipData.length - 1];
  const currentValue = latest ? latest.value : 0;
  const finalInvested = latest ? latest.invested : 0;
  const absoluteGain = currentValue - finalInvested;
  const returnPct = finalInvested > 0 ? (absoluteGain / finalInvested) * 100 : 0;
  const isGain = absoluteGain >= 0;

  return {
    sipData,
    totalInvested: finalInvested,
    currentValue,
    absoluteGain: Number(absoluteGain.toFixed(2)),
    returnPct: Number(returnPct.toFixed(2)),
    isGain
  };
}
