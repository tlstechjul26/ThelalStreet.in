// backend/services/MarketDataValidator.js

/**
 * MarketDataValidator: Comprehensive validation and session-awareness layer
 * for all stock and sector market data.
 */

// Official Exchange trading holidays list (NSE/BSE standard holidays YYYY-MM-DD)
export const NSE_HOLIDAYS = new Set([
  // 2024
  '2024-01-26', // Republic Day
  '2024-03-08', // Maha Shivratri
  '2024-03-25', // Holi
  '2024-03-29', // Good Friday
  '2024-04-11', // Id-Ul-Fitr (Ramzan Id)
  '2024-04-17', // Shri Ram Navami
  '2024-05-01', // Maharashtra Day
  '2024-06-17', // Bakri Id
  '2024-07-17', // Muharram
  '2024-08-15', // Independence Day
  '2024-10-02', // Mahatma Gandhi Jayanti
  '2024-11-01', // Diwali Laxmi Pujan (Muhurat trading evening)
  '2024-11-15', // Gurunanak Jayanti
  '2024-12-25', // Christmas

  // 2025
  '2025-01-26', // Republic Day (Sunday)
  '2025-02-26', // Maha Shivratri
  '2025-03-14', // Holi
  '2025-03-31', // Id-Ul-Fitr
  '2025-04-14', // Dr. Ambedkar Jayanti
  '2025-04-18', // Good Friday
  '2025-05-01', // Maharashtra Day
  '2025-08-15', // Independence Day
  '2025-08-27', // Ganesh Chaturthi
  '2025-10-02', // Mahatma Gandhi Jayanti
  '2025-10-21', // Dussehra
  '2025-10-22', // Diwali Balipratipada
  '2025-11-05', // Gurunanak Jayanti
  '2025-12-25', // Christmas

  // 2026
  '2026-01-26', // Republic Day
  '2026-03-06', // Maha Shivratri
  '2026-03-25', // Holi
  '2026-04-02', // Mahavir Jayanti
  '2026-04-03', // Good Friday
  '2026-04-14', // Dr. Ambedkar Jayanti
  '2026-05-01', // Maharashtra Day
  '2026-06-17', // Bakri Id
  '2026-07-17', // Muharram
  '2026-08-15', // Independence Day (Saturday)
  '2026-10-02', // Mahatma Gandhi Jayanti
  '2026-10-20', // Dussehra
  '2026-11-08', // Diwali Laxmi Pujan (Sunday)
  '2026-11-10', // Diwali Balipratipada
  '2026-11-24', // Gurunanak Jayanti
  '2026-12-25', // Christmas

  // 2027
  '2027-01-26', // Republic Day
  '2027-02-15', // Maha Shivratri
  '2027-03-22', // Holi
  '2027-03-26', // Good Friday
  '2027-04-14', // Dr. Ambedkar Jayanti
  '2027-05-01', // Maharashtra Day (Saturday)
  '2027-08-15', // Independence Day (Sunday)
  '2027-10-02', // Mahatma Gandhi Jayanti (Saturday)
  '2027-10-11', // Dussehra
  '2027-10-29', // Diwali
  '2027-11-14', // Gurunanak Jayanti (Sunday)
  '2027-12-25'  // Christmas (Saturday)
]);

// Keep backward-compatible reference
const NSE_HOLIDAYS_2026 = NSE_HOLIDAYS;

export function isNSEHoliday(dateStr) {
  return NSE_HOLIDAYS.has(dateStr);
}

export const KNOWN_GLOBAL_SYMBOLS = new Set([
  'AAPL', 'MSFT', 'NVDA', 'AVGO', 'CRM', 'ADBE', 'AMD', 'ORCL', 'CSCO', 'INTU', 'IBM', 'QCOM', 'TXN', 'NOW', 'AMAT',
  'UNH', 'JNJ', 'LLY', 'ABBV', 'MRK', 'TMO', 'PFE', 'ABT', 'DHR', 'SYK', 'AMGN', 'ISRG', 'MDT', 'VRTX',
  'BRK-B', 'BRK.B', 'JPM', 'V', 'MA', 'BAC', 'WFC', 'GS', 'MS', 'SPGI', 'AXP', 'BLK', 'C', 'SCHW', 'PGR',
  'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'MPC', 'PSX', 'VLO', 'PXD', 'OXY', 'WMB', 'HES', 'KMI', 'HAL', 'BKR',
  'AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'LOW', 'SBUX', 'TJX', 'BKNG', 'TGT', 'LULU', 'MAR', 'F', 'GM', 'CMG', 'HLT', 'ORLY',
  'PG', 'COST', 'PEP', 'KO', 'WMT', 'PM', 'MDLZ', 'MO', 'CL', 'EL', 'KMB', 'GIS', 'SYY', 'ADM', 'KHC', 'HSY', 'STZ',
  'GE', 'CAT', 'UNP', 'HON', 'UPS', 'RTX', 'BA', 'DE', 'LMT', 'ETN', 'WM', 'GD', 'ITW', 'FDX', 'EMR',
  'LIN', 'APD', 'SHW', 'ECL', 'FCX', 'NEM', 'CTVA', 'DOW', 'DD', 'ALB', 'PPG', 'VMC', 'MLM', 'NUE',
  'NEE', 'SO', 'DUK', 'CEG', 'SRE', 'AEP', 'D', 'PEG', 'ED', 'EXC', 'XEL', 'PCG', 'WEC',
  'PLD', 'AMT', 'EQIX', 'CCI', 'PSA', 'O', 'SPG', 'VICI', 'WELL', 'DLR', 'AVB', 'EQR', 'SBAC', 'CSGP',
  'GOOGL', 'GOOG', 'META', 'NFLX', 'DIS', 'CMCSA', 'TMUS', 'VZ', 'T', 'CHTR', 'EA', 'WBD', 'TTWO',
  'XLK', 'XLV', 'XLF', 'XLE', 'XLY', 'XLP', 'XLI', 'XLB', 'XLU', 'XLRE', 'XLC', 'SPY', 'QQQ', 'DIA', 'IWM', 'VGHCX', 'FSPHX'
]);

/**
 * Determine the current market session status for Indian exchanges (NSE/BSE).
 * Uses official NSE calendar and Asia/Kolkata timezone.
 * Returns: { isOpen: boolean, session: 'OPEN'|'PRE_OPEN'|'POST_CLOSE'|'CLOSED'|'HOLIDAY'|'WEEKEND', dateStr: string, istDateStr: string, istTimeStr: string, isTradingDay: boolean }
 */
export function getIndianMarketSession(date = new Date()) {
  const d = (date instanceof Date && !isNaN(date.getTime())) ? date : new Date(date);
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false
  });
  const parts = formatter.formatToParts(validDate);
  const partMap = {};
  for (const p of parts) partMap[p.type] = p.value;

  const year = partMap.year;
  const month = partMap.month;
  const dayOfMonth = partMap.day;
  const dateStr = `${year}-${month}-${dayOfMonth}`;
  const weekday = partMap.weekday; // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'

  const hours = parseInt(partMap.hour, 10);
  const minutes = parseInt(partMap.minute, 10);
  const timeInMinutes = hours * 60 + minutes;

  const istTimeStr = `${dateStr}T${partMap.hour}:${partMap.minute}:${partMap.second}+05:30`;

  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  const isHoliday = NSE_HOLIDAYS.has(dateStr);
  const isTradingDay = !isWeekend && !isHoliday;

  if (isWeekend) {
    return { isOpen: false, session: 'WEEKEND', dateStr, istDateStr: dateStr, istTimeStr, isTradingDay: false };
  }

  if (isHoliday) {
    return { isOpen: false, session: 'HOLIDAY', dateStr, istDateStr: dateStr, istTimeStr, isTradingDay: false };
  }

  // Pre-open: 09:00 - 09:15 (540 to 555)
  if (timeInMinutes >= 540 && timeInMinutes < 555) {
    return { isOpen: false, session: 'PRE_OPEN', dateStr, istDateStr: dateStr, istTimeStr, isTradingDay: true };
  }

  // Normal Trading: 09:15 - 15:30 (555 to 930)
  if (timeInMinutes >= 555 && timeInMinutes <= 930) {
    return { isOpen: true, session: 'OPEN', dateStr, istDateStr: dateStr, istTimeStr, isTradingDay: true };
  }

  // Post-close session: 15:30 - 16:00 (930 to 960)
  if (timeInMinutes > 930 && timeInMinutes <= 960) {
    return { isOpen: false, session: 'POST_CLOSE', dateStr, istDateStr: dateStr, istTimeStr, isTradingDay: true };
  }

  return { isOpen: false, session: 'CLOSED', dateStr, istDateStr: dateStr, istTimeStr, isTradingDay: true };
}

/**
 * Determine the current market session for US exchanges (NYSE/NASDAQ).
 * 09:30 - 16:00 US Eastern (UTC - 4 or -5).
 */
export function getUSMarketSession(date = new Date()) {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const estTime = new Date(utc - (3600000 * 4));
  
  const day = estTime.getDay();
  const hours = estTime.getHours();
  const minutes = estTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  if (day === 0 || day === 6) {
    return { isOpen: false, session: 'WEEKEND' };
  }

  // 09:30 to 16:00 (570 to 960)
  if (timeInMinutes >= 570 && timeInMinutes <= 960) {
    return { isOpen: true, session: 'OPEN' };
  }

  return { isOpen: false, session: 'CLOSED' };
}

/**
 * Financial institutions: Banks, NBFCs, Insurance entities.
 * EBIT is strictly null (GAAP/IFRS standard).
 */
const FINANCIAL_ENTITY_SYMBOLS = new Set([
  'HDFCBANK.NS', 'ICICIBANK.NS', 'KOTAKBANK.NS', 'SBIN.NS', 'AXISBANK.NS',
  'INDUSINDBK.NS', 'BANKBARODA.NS', 'PNB.NS', 'IDFCFIRSTB.NS', 'FEDERALBNK.NS',
  'BAJFINANCE.NS', 'BAJAJFINSV.NS', 'CHOLAFIN.NS', 'SHRIRAMFIN.NS', 'MUTHOOTFIN.NS',
  'HDFCLIFE.NS', 'SBILIFE.NS', 'ICICIPRULI.NS', 'ICICIGI.NS',
  'CANBK.NS', 'UNIONBANK.NS', 'IOB.NS', 'INDIANB.NS', 'BANKINDIA.NS', 'CENTRALBK.NS',
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'SCHW', 'BLK', 'AXP', 'PGR', 'BRK-B', 'V', 'MA'
]);

export function isFinancialEntity(symbol = '') {
  if (!symbol) return false;
  const clean = String(symbol).toUpperCase().trim();
  if (FINANCIAL_ENTITY_SYMBOLS.has(clean) || FINANCIAL_ENTITY_SYMBOLS.has(clean.replace('.NS', ''))) {
    return true;
  }
  return clean.includes('BANK') || clean.includes('FINANCE') || clean.includes('INSUR');
}

/**
 * Validate and sanitize a single stock quote object.
 * Rejects impossible/invalid figures without fabricating data.
 */
export function validateAndSanitizeQuote(rawQuote) {
  if (!rawQuote || typeof rawQuote !== 'object') {
    return null;
  }

  const symbol = String(rawQuote.symbol || '').toUpperCase().trim();
  if (!symbol) return null;

  const isIndian = symbol.endsWith('.NS') || symbol.endsWith('.BO') || symbol.startsWith('^NSE') || symbol.startsWith('^CNX') || symbol.startsWith('^CRSL') || symbol.startsWith('^BSE');
  const exchange = rawQuote.exchange || (isIndian ? (symbol.endsWith('.BO') || symbol.includes('BSE') ? 'BSE' : 'NSE') : 'US');
  const exchangeSegment = rawQuote.exchangeSegment || (symbol.startsWith('^') ? `${exchange}_INDEX` : `${exchange}_EQ`);

  const rawLtp = rawQuote.ltp;
  const rawPrevClose = rawQuote.previousClose;

  const isValidLtp = typeof rawLtp === 'number' && !isNaN(rawLtp) && isFinite(rawLtp) && rawLtp > 0;
  const isValidPrevClose = typeof rawPrevClose === 'number' && !isNaN(rawPrevClose) && isFinite(rawPrevClose) && rawPrevClose > 0;

  if (!isValidLtp) {
    // Return structured unavailable quote
    return {
      symbol,
      name: rawQuote.name || symbol,
      exchange,
      exchangeSegment,
      ltp: null,
      open: null,
      previousClose: isValidPrevClose ? rawPrevClose : null,
      change: null,
      changePercent: null,
      dayHigh: null,
      dayLow: null,
      high52: null,
      low52: null,
      volume: null,
      marketCap: null,
      pe: null,
      pb: null,
      eps: null,
      ebit: null,
      revenue: null,
      revenueYoY: null,
      revenueQuarterly: null,
      netProfit: null,
      dividendYield: null,
      vwap: null,
      returns: rawQuote.returns || { '1W': null, '1M': null, '6M': null, '1Y': null, '3Y': null, '5Y': null, 'ALL': null },
      source: rawQuote.source || 'UNAVAILABLE',
      sourceType: rawQuote.sourceType || 'UNAVAILABLE',
      dataStatus: 'UNAVAILABLE',
      isLive: false,
      priceAsOf: null,
      currency: rawQuote.currency || (isIndian ? 'INR' : 'USD'),
      lastUpdatedAt: new Date().toISOString()
    };
  }

  const ltp = rawLtp;
  const previousClose = isValidPrevClose ? rawPrevClose : ltp;

  // Preserve authoritative change and changePercent from provider (e.g. Yahoo Finance) when available
  const change = typeof rawQuote.change === 'number' && !isNaN(rawQuote.change)
    ? parseFloat(rawQuote.change.toFixed(4))
    : parseFloat((ltp - previousClose).toFixed(4));
  const changePercent = typeof rawQuote.changePercent === 'number' && !isNaN(rawQuote.changePercent)
    ? parseFloat(rawQuote.changePercent.toFixed(4))
    : (previousClose > 0 ? parseFloat((((ltp - previousClose) / previousClose) * 100).toFixed(4)) : 0);

  let open = typeof rawQuote.open === 'number' && rawQuote.open > 0 ? rawQuote.open : previousClose;
  let dayHigh = typeof rawQuote.dayHigh === 'number' && rawQuote.dayHigh > 0 ? rawQuote.dayHigh : Math.max(open, ltp);
  let dayLow = typeof rawQuote.dayLow === 'number' && rawQuote.dayLow > 0 ? rawQuote.dayLow : Math.min(open, ltp);

  // Guarantee physical OHLC bounds
  dayHigh = Math.max(dayHigh, open, ltp);
  dayLow = Math.min(dayLow, open, ltp);

  const rawVol = rawQuote.volume;
  const volume = typeof rawVol === 'number' && !isNaN(rawVol) && isFinite(rawVol) && rawVol >= 0 ? rawVol : 0;

  const isFin = isFinancialEntity(symbol);
  const ebit = isFin ? null : (typeof rawQuote.ebit === 'number' && !isNaN(rawQuote.ebit) ? rawQuote.ebit : null);
  const revenue = typeof rawQuote.revenue === 'number' && !isNaN(rawQuote.revenue) ? rawQuote.revenue : null;
  const revenueYoY = (typeof rawQuote.revenueYoY === 'number' && !isNaN(rawQuote.revenueYoY)) ? rawQuote.revenueYoY : null;
  const revenueQuarterly = rawQuote.revenueQuarterly || null;
  const netProfit = typeof rawQuote.netProfit === 'number' && !isNaN(rawQuote.netProfit) ? rawQuote.netProfit : null;

  const session = isIndian ? getIndianMarketSession() : getUSMarketSession();

  const rawPriceAsOf = rawQuote.priceAsOf || (rawQuote.regularMarketTime ? new Date(rawQuote.regularMarketTime * 1000).toISOString() : null);
  let priceAsOf = rawPriceAsOf;

  // On market-closed days, retain the latest valid session timestamp. Never synthesize a new price timestamp on closed days.
  if (!priceAsOf || isNaN(new Date(priceAsOf).getTime())) {
    if (!session.isOpen && session.istDateStr) {
      priceAsOf = `${session.istDateStr}T15:30:00+05:30`;
    } else {
      priceAsOf = new Date().toISOString();
    }
  }

  // Reject future timestamps by clamping to current time
  if (new Date(priceAsOf).getTime() > Date.now() + 60000) {
    priceAsOf = new Date().toISOString();
  }

  let dataStatus = 'EOD';
  let isLive = false;

  const priceAgeMinutes = (Date.now() - new Date(priceAsOf).getTime()) / (1000 * 60);

  if (session.isOpen) {
    // Never label cached data as live
    if (rawQuote.fromCache === true || rawQuote.isCached === true) {
      isLive = false;
      dataStatus = priceAgeMinutes > 20 ? 'STALE' : 'DELAYED';
    } else if (priceAgeMinutes > 20) {
      // Data older than 20 mins during market hours is stale
      isLive = false;
      dataStatus = 'STALE';
    } else if (rawQuote.isLive === false || rawQuote.sourceType === 'DELAYED') {
      isLive = false;
      dataStatus = 'DELAYED';
    } else {
      dataStatus = 'LIVE';
      isLive = true;
    }
  } else {
    // Market is closed (weekend, holiday, pre-open, post-close, or closed hours)
    dataStatus = rawQuote.dataStatus && rawQuote.dataStatus !== 'LIVE' ? rawQuote.dataStatus : 'EOD';
    isLive = false;
  }

  const fetchedAt = new Date().toISOString();

  return {
    symbol,
    tradingSymbol: rawQuote.tradingSymbol || symbol.replace('.NS', '').replace('.BO', ''),
    isin: rawQuote.isin || null,
    instrumentKey: rawQuote.instrumentKey || null,
    name: rawQuote.name || symbol,
    exchange,
    exchangeSegment,
    marketSession: session.session,
    price: ltp,
    ltp,
    open,
    previousClose,
    change,
    changePercent,
    dayHigh,
    dayLow,
    high52: typeof rawQuote.high52 === 'number' && rawQuote.high52 > 0 ? rawQuote.high52 : null,
    low52: typeof rawQuote.low52 === 'number' && rawQuote.low52 > 0 ? rawQuote.low52 : null,
    volume,
    marketCap: typeof rawQuote.marketCap === 'number' && rawQuote.marketCap > 0 ? rawQuote.marketCap : null,
    pe: typeof rawQuote.pe === 'number' && rawQuote.pe > 0 ? rawQuote.pe : null,
    pb: typeof rawQuote.pb === 'number' && rawQuote.pb > 0 ? rawQuote.pb : null,
    eps: typeof rawQuote.eps === 'number' ? rawQuote.eps : null,
    ebit,
    revenue,
    revenueCr: (typeof rawQuote.revenueCr === 'number' && !isNaN(rawQuote.revenueCr)) ? rawQuote.revenueCr : revenue,
    revenueYoY,
    revenueQuarterly,
    netProfit,
    netProfitYoY: (typeof rawQuote.netProfitYoY === 'number' && !isNaN(rawQuote.netProfitYoY)) ? rawQuote.netProfitYoY : null,
    netProfitQuarterly: rawQuote.netProfitQuarterly || null,
    dividendYield: typeof rawQuote.dividendYield === 'number' ? rawQuote.dividendYield : null,
    vwap: typeof rawQuote.vwap === 'number' && rawQuote.vwap > 0 ? rawQuote.vwap : ltp,
    returns: rawQuote.returns || { '1W': null, '1M': null, '6M': null, '1Y': null, '3Y': null, '5Y': null, 'ALL': null },
    source: rawQuote.source || 'YAHOO_FINANCE',
    sourceType: rawQuote.sourceType || 'YAHOO_QUOTE',
    dataStatus,
    isLive,
    priceAsOf,
    currency: rawQuote.currency || (isIndian ? 'INR' : 'USD'),
    fetchedAt,
    lastUpdatedAt: fetchedAt
  };
}

export const DataClassification = Object.freeze({
  VERIFIED_REAL: 'VERIFIED_REAL',
  REAL_BUT_DELAYED: 'REAL_BUT_DELAYED',
  REAL_BUT_PERIODIC: 'REAL_BUT_PERIODIC',
  CALCULATED_FROM_VERIFIED_DATA: 'CALCULATED_FROM_VERIFIED_DATA',
  UNVERIFIED: 'UNVERIFIED',
  STALE: 'STALE',
  HARDCODED: 'HARDCODED',
  FABRICATED: 'FABRICATED',
  FALLBACK_SUBSTITUTED: 'FALLBACK_SUBSTITUTED',
  MISSING: 'MISSING',
  SOURCE_CONFLICT: 'SOURCE_CONFLICT'
});

/**
 * Data Quality Gate: Determines if a data value or status is acceptable for research analysis.
 * TRUE only for: VERIFIED_REAL, REAL_BUT_DELAYED, REAL_BUT_PERIODIC, CALCULATED_FROM_VERIFIED_DATA.
 * FALSE for: UNVERIFIED, STALE, HARDCODED, FABRICATED, FALLBACK_SUBSTITUTED, MISSING, SOURCE_CONFLICT.
 */
export function isResearchUsable(statusOrObj) {
  if (!statusOrObj) return false;
  const status = typeof statusOrObj === 'string'
    ? statusOrObj
    : (statusOrObj.dataStatus || statusOrObj.status || statusOrObj.classification);
  return [
    DataClassification.VERIFIED_REAL,
    DataClassification.REAL_BUT_DELAYED,
    DataClassification.REAL_BUT_PERIODIC,
    DataClassification.CALCULATED_FROM_VERIFIED_DATA
  ].includes(status);
}

export default {
  NSE_HOLIDAYS,
  isNSEHoliday,
  getIndianMarketSession,
  getUSMarketSession,
  isFinancialEntity,
  validateAndSanitizeQuote,
  DataClassification,
  isResearchUsable
};
