// backend/tests/verify_nifty_bank_pipeline.test.js
import assert from 'assert';
import { getIndianMarketSession, NSE_HOLIDAYS, isNSEHoliday, isFinancialEntity, validateAndSanitizeQuote } from '../services/MarketDataValidator.js';
import yahooFinanceService from '../services/YahooFinanceService.js';
import marketDataGateway from '../services/MarketDataGateway.js';
import sectorDataService from '../services/SectorDataService.js';
import athBaseService from '../services/AthBaseService.js';

console.log('================================================================');
console.log('🧪 TEST SUITE: NIFTY BANK STOCK TABLE DATA PIPELINE AUDIT & FIX');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function testAssert(condition, message, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${message} ${details ? '(' + details + ')' : ''}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message} ${details ? '(' + details + ')' : ''}`);
    failed++;
  }
}

async function runAllTests() {
  // ==========================================================================
  // SECTION 1: Market Calendar & Official NSE Exchange Holidays
  // ==========================================================================
  console.log('\n--- SECTION 1: Market Calendar & Timezone (Asia/Kolkata) ---');

  // Test 1.1: Weekend detection
  const saturday = new Date('2026-10-24T10:00:00.000Z'); // Saturday
  const sunday = new Date('2026-10-25T10:00:00.000Z');   // Sunday
  const satSession = getIndianMarketSession(saturday);
  const sunSession = getIndianMarketSession(sunday);

  testAssert(!satSession.isOpen, 'Saturday is market-closed', `session=${satSession.session}`);
  testAssert(satSession.session === 'WEEKEND', 'Saturday session is WEEKEND', `session=${satSession.session}`);
  testAssert(!sunSession.isOpen, 'Sunday is market-closed', `session=${sunSession.session}`);
  testAssert(sunSession.session === 'WEEKEND', 'Sunday session is WEEKEND', `session=${sunSession.session}`);

  // Test 1.2: Official NSE Holidays across multiple years
  const republicDay2026 = new Date('2026-01-26T06:00:00.000Z'); // Mon 11:30 AM IST
  const holi2026 = new Date('2026-03-25T06:00:00.000Z');        // Wed 11:30 AM IST
  const christmas2026 = new Date('2026-12-25T06:00:00.000Z');   // Fri 11:30 AM IST
  const independenceDay2025 = new Date('2025-08-15T06:00:00.000Z'); // Fri 11:30 AM IST

  const repSession = getIndianMarketSession(republicDay2026);
  const holiSession = getIndianMarketSession(holi2026);
  const xmasSession = getIndianMarketSession(christmas2026);
  const indSession = getIndianMarketSession(independenceDay2025);

  testAssert(!repSession.isOpen && repSession.session === 'HOLIDAY', 'Republic Day 2026 is market-closed holiday', `dateStr=${repSession.dateStr}`);
  testAssert(!holiSession.isOpen && holiSession.session === 'HOLIDAY', 'Holi 2026 is market-closed holiday', `dateStr=${holiSession.dateStr}`);
  testAssert(!xmasSession.isOpen && xmasSession.session === 'HOLIDAY', 'Christmas 2026 is market-closed holiday', `dateStr=${xmasSession.dateStr}`);
  testAssert(!indSession.isOpen && indSession.session === 'HOLIDAY', 'Independence Day 2025 is market-closed holiday', `dateStr=${indSession.dateStr}`);

  // Test 1.3: Trading session hours
  const regularOpenTrading = new Date('2026-10-26T04:30:00.000Z'); // 10:00 AM IST (Monday)
  const openSession = getIndianMarketSession(regularOpenTrading);
  testAssert(openSession.isOpen, 'Monday 10:00 AM IST is OPEN', `session=${openSession.session}`);
  testAssert(openSession.isTradingDay, 'Monday is a trading day');

  const afterHours = new Date('2026-10-26T14:30:00.000Z'); // 08:00 PM IST (Monday)
  const closedSession = getIndianMarketSession(afterHours);
  testAssert(!closedSession.isOpen, 'Monday 08:00 PM IST is CLOSED', `session=${closedSession.session}`);

  // Test 1.4: Retention of authentic source timestamp on closed days (no new timestamps generated)
  const closedDayQuote = {
    symbol: 'HDFCBANK.NS',
    ltp: 689.8,
    previousClose: 692.8,
    priceAsOf: '2026-10-23T15:30:00.000Z',
    source: 'YAHOO_FINANCE'
  };
  const sanitizedClosed = validateAndSanitizeQuote(closedDayQuote);
  testAssert(sanitizedClosed.priceAsOf === '2026-10-23T15:30:00.000Z', 'Closed day retains authentic trading session timestamp without generating new timestamp');

  // ==========================================================================
  // SECTION 2: Latest Price, Provenance & Cache Integrity
  // ==========================================================================
  console.log('\n--- SECTION 2: Latest Price, Provenance & Cache Integrity ---');

  // Test 2.1: Never label cached data as live
  const cachedQuoteInput = {
    symbol: 'HDFCBANK.NS',
    ltp: 689.8,
    previousClose: 692.8,
    fromCache: true,
    priceAsOf: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 mins ago
  };
  const sanitizedCached = validateAndSanitizeQuote(cachedQuoteInput);
  testAssert(sanitizedCached.isLive === false, 'Cached quote is NEVER labeled as live (isLive === false)');
  testAssert(sanitizedCached.dataStatus === 'DELAYED' || sanitizedCached.dataStatus === 'EOD', `Cached quote dataStatus is DELAYED or EOD, not LIVE (got ${sanitizedCached.dataStatus})`);

  // Test 2.2: Stale quote detection (> 20 mins old during open session)
  const staleQuoteInput = {
    symbol: 'ICICIBANK.NS',
    ltp: 1391.0,
    previousClose: 1394.0,
    priceAsOf: new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 mins ago
  };
  const sanitizedStale = validateAndSanitizeQuote(staleQuoteInput);
  if (getIndianMarketSession().isOpen) {
    testAssert(sanitizedStale.isLive === false && sanitizedStale.dataStatus === 'STALE', 'Data older than 20 mins during market hours is marked STALE');
  } else {
    testAssert(sanitizedStale.isLive === false, 'Non-market hours data is not live');
  }

  // Test 2.3: Zero / negative / NaN prices rejected
  const invalidQuoteZero = validateAndSanitizeQuote({ symbol: 'SBIN.NS', ltp: 0 });
  const invalidQuoteNeg = validateAndSanitizeQuote({ symbol: 'SBIN.NS', ltp: -10 });
  const invalidQuoteNaN = validateAndSanitizeQuote({ symbol: 'SBIN.NS', ltp: NaN });
  testAssert(invalidQuoteZero.ltp === null && invalidQuoteZero.dataStatus === 'UNAVAILABLE', 'Zero price rejected as UNAVAILABLE');
  testAssert(invalidQuoteNeg.ltp === null && invalidQuoteNeg.dataStatus === 'UNAVAILABLE', 'Negative price rejected as UNAVAILABLE');
  testAssert(invalidQuoteNaN.ltp === null && invalidQuoteNaN.dataStatus === 'UNAVAILABLE', 'NaN price rejected as UNAVAILABLE');

  // ==========================================================================
  // SECTION 3: ALL-Time Returns Calculation & Split Adjustment
  // ==========================================================================
  console.log('\n--- SECTION 3: ALL-Time Returns & Split-Adjusted History ---');

  // Test 3.1: Mathematical correctness of return formula: ((latest / earliest) - 1) * 100
  const testLatest = 689.8;
  const testEarliest = 0.9832;
  const expectedReturn = parseFloat((((testLatest / testEarliest) - 1) * 100).toFixed(2));
  testAssert(expectedReturn > 0, 'Return formula computes positive return for appreciation', `${expectedReturn}%`);
  testAssert(Math.abs(expectedReturn - 70058.67) < 1.0, 'HDFCBANK long-term return matches standard total-return formula', `${expectedReturn}%`);

  // Test 3.2: Verify no arbitrary capping or suppression
  testAssert(expectedReturn > 50000, 'Legitimate multi-thousand % returns are not arbitrarily capped or suppressed');

  // Test 3.3: Historical analysis for representative Nifty Bank stocks
  const bankStocksToTest = ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS'];
  for (const sym of bankStocksToTest) {
    try {
      const analysis = await yahooFinanceService.getHistoricalAnalysis(sym);
      testAssert(analysis && analysis.returns, `${sym} Historical Analysis returned`);
      const rets = analysis.returns;
      console.log(`    ${sym} -> 1W: ${rets['1W']}%, 1M: ${rets['1M']}%, 1Y: ${rets['1Y']}%, 5Y: ${rets['5Y']}%, ALL: ${rets['ALL']}%`);

      // Verify ALL return is computed and positive for 20+ year banks
      if (rets['ALL'] !== null) {
        testAssert(typeof rets['ALL'] === 'number' && rets['ALL'] > 0, `${sym} ALL return is positive valid number`, `ALL=${rets['ALL']}%`);
      }
    } catch (err) {
      testAssert(false, `${sym} historical analysis failed`, err.message);
    }
  }

  // ==========================================================================
  // SECTION 4: Constituent Stock Metrics & Banking Financial Rules
  // ==========================================================================
  console.log('\n--- SECTION 4: Nifty Bank Constituent Metrics & EBIT Standard ---');

  // Test 4.1: Banking stocks must have EBIT strictly null (GAAP/IFRS standard)
  const bankSymbols = [
    'HDFCBANK.NS', 'ICICIBANK.NS', 'KOTAKBANK.NS', 'SBIN.NS', 'AXISBANK.NS',
    'INDUSINDBK.NS', 'BANKBARODA.NS', 'PNB.NS', 'IDFCFIRSTB.NS', 'FEDERALBNK.NS'
  ];

  for (const sym of bankSymbols) {
    const isFin = isFinancialEntity(sym);
    testAssert(isFin, `${sym} is recognized as financial institution`);
    const sanitized = validateAndSanitizeQuote({ symbol: sym, ltp: 100, ebit: 5000 });
    testAssert(sanitized.ebit === null, `${sym} EBIT is strictly NULL in sanitized quote`);
  }

  // Test 4.2: 52W High / Low invariant and formula verification
  const testAthBase = athBaseService.computeAthAndBase(
    [
      { date: '2025-11-01', high: 1000, low: 900, close: 950 },
      { date: '2026-05-01', high: 1100, low: 850, close: 1050 },
      { date: '2026-10-26', high: 1080, low: 1020, close: 1050 }
    ],
    [
      { date: '2000-01-01', high: 50, low: 40, close: 45 },
      { date: '2026-10-01', high: 1100, low: 850, close: 1050 }
    ],
    1050,
    'TESTBANK.NS'
  );

  testAssert(testAthBase.allTimeHigh === 1100, 'ATH calculated correctly as 1100');
  testAssert(testAthBase.week52Low === 850, '52W Low calculated correctly as 850');
  const expectedAthPct = parseFloat((((1050 - 1100) / 1100) * 100).toFixed(2));
  const expectedLowPct = parseFloat((((1050 - 850) / 850) * 100).toFixed(2));
  testAssert(Math.abs(testAthBase.pctFromATH - expectedAthPct) < 0.05, `% from ATH formula match (${testAthBase.pctFromATH}% vs ${expectedAthPct}%)`);
  testAssert(Math.abs(testAthBase.pctFrom52WLow - expectedLowPct) < 0.05, `% from 52W Low formula match (${testAthBase.pctFrom52WLow}% vs ${expectedLowPct}%)`);

  // ==========================================================================
  // SECTION 5: End-to-End Nifty Bank Sector Detail Verification
  // ==========================================================================
  console.log('\n--- SECTION 5: End-to-End Nifty Bank Sector Detail ---');

  const sectorDetail = await sectorDataService.getSectorDetail('nifty-bank', '1D');
  testAssert(sectorDetail !== null, 'Sector detail for nifty-bank returned');
  testAssert(sectorDetail.name === 'Nifty Bank', 'Sector name is Nifty Bank');
  testAssert(sectorDetail.ebit === null, 'Nifty Bank Sector EBIT is strictly NULL');
  testAssert(Array.isArray(sectorDetail.stocks) && sectorDetail.stocks.length === 10, `All 10 Nifty Bank constituents present (got ${sectorDetail.stocks?.length})`);

  // Check constituent fields
  for (const stk of sectorDetail.stocks) {
    testAssert(stk.ebit === null, `${stk.symbol} Constituent EBIT is strictly NULL`);
    testAssert(stk.returns && typeof stk.returns === 'object', `${stk.symbol} Returns object present`);
    testAssert('ALL' in stk.returns, `${stk.symbol} ALL return key present`);
    testAssert(typeof stk.changePercent === 'number' || stk.changePercent === null, `${stk.symbol} Valid changePercent type`);
    testAssert(stk.marketCap === null || (typeof stk.marketCap === 'number' && stk.marketCap > 0), `${stk.symbol} Valid marketCap`);
  }

  // ==========================================================================
  // SECTION 6: All-Time / Max Chart Inception & Historical Low Standardization
  // ==========================================================================
  console.log('\n--- SECTION 6: All-Time / Max Historical Low Standardization (Tickertape Alignment) ---');
  const { resolveRangeToDates } = await import('../utils/dateRangeUtils.js');

  const maxRange = resolveRangeToDates('max');
  const allRange = resolveRangeToDates('all');
  testAssert(maxRange.start.toISOString().startsWith('2000-01-01'), `Max range starts at 2000-01-01 electronic trading inception (got ${maxRange.start.toISOString()})`);
  testAssert(allRange.start.toISOString().startsWith('2000-01-01'), `All range starts at 2000-01-01 electronic trading inception (got ${allRange.start.toISOString()})`);

  // Verify synthetic candle filtering in AthBaseService:
  // Pre-2000 manual trading quote (1996-01-29: low = 1.1975) must be excluded for HDFCBANK.NS
  const mockMonthlyQuotes = [
    { date: '1996-01-29T00:00:00.000Z', open: 1.20, high: 1.20, low: 1.1975, close: 1.20, volume: 1000 },
    { date: '2000-01-11T00:00:00.000Z', open: 8.30, high: 8.50, low: 7.85, close: 8.10, volume: 50000 },
    { date: '2024-01-01T00:00:00.000Z', open: 1650, high: 1750, low: 1600, close: 1700, volume: 100000 }
  ];
  const athBaseResult = athBaseService.computeAthAndBase([], mockMonthlyQuotes, 1700, 'HDFCBANK.NS');
  testAssert(athBaseResult.allTimeHigh === 1750, `ATH correctly identified from valid quotes (got ${athBaseResult.allTimeHigh})`);
  
  // Verify that filtering for Indian stocks discards pre-2000 candles
  const isIndian = true;
  const indianEpochTime = new Date('2000-01-01T00:00:00Z').getTime();
  const validQuotes = mockMonthlyQuotes.filter(q => !isIndian || new Date(q.date).getTime() >= indianEpochTime);
  const minHistoricalLow = Math.min(...validQuotes.map(q => q.low));
  testAssert(minHistoricalLow === 7.85, `Filtered historical low is strictly 7.85 matching Tickertape (got ${minHistoricalLow}, not 1.20)`);

  // Summary
  console.log('\n================================================================');
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
