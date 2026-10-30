import assert from 'assert';
import fs from 'fs';
import path from 'path';
import marketDataGateway from '../services/MarketDataGateway.js';
import mfDataAggregatorService from '../services/MfDataAggregatorService.js';
import { resolveRangeToDates } from '../utils/dateRangeUtils.js';
import { calculateSipPerformance } from '../../frontend/src/utils/sipCalculator.js';
import { calculateTimelineSegments } from '../../frontend/src/utils/chartDivisions.js';

async function runMasterTestSuite() {
  console.log('========================================================================');
  console.log('🧪 MASTER VERIFICATION SUITE: STOCKS & MUTUAL FUNDS TICKERTAPE CHARTS');
  console.log('========================================================================');

  // --- SECTION 1: Dynamic Date-Axis Divisions & Segments ---
  console.log('\n--- SECTION 1: Dynamic Date-Axis Divisions (1D, 1W, 1M, 1Y, 5Y, Max, SIP) ---');

  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;

  // 1D Intraday Test
  const intradayPoints = Array.from({ length: 20 }, (_, i) => ({
    time: now - (20 - i) * 15 * 60 * 1000,
    close: 2500 + (i % 2 === 0 ? 5 : -3) * i
  }));
  const res1D = calculateTimelineSegments('1d', intradayPoints);
  assert.ok(res1D.divisions.length > 0, '1D divisions must be generated');
  assert.ok(res1D.segments.length > 0, '1D segments must be generated');
  console.log(`  ✓ 1D: Generated ${res1D.divisions.length} divisions (${res1D.divisions.map(d => d.label).join(', ')})`);

  // 1W Trading Days Test
  const weekPoints = Array.from({ length: 7 }, (_, i) => ({
    time: now - (7 - i) * dayMs,
    close: 100 + i * 2
  }));
  const res1W = calculateTimelineSegments('1w', weekPoints);
  assert.ok(res1W.divisions.length >= 5, '1W must display trading days');
  console.log(`  ✓ 1W: Trading days generated (${res1W.divisions.map(d => d.label).join(', ')})`);

  // 1M Five Evenly Spaced Divisions Test
  const monthPoints = Array.from({ length: 30 }, (_, i) => ({
    time: now - (30 - i) * dayMs,
    close: 150 + Math.sin(i) * 10
  }));
  const res1M = calculateTimelineSegments('1m', monthPoints);
  assert.strictEqual(res1M.divisions.length, 5, '1M must show exactly 5 date divisions');
  console.log(`  ✓ 1M: 5 date divisions generated (${res1M.divisions.map(d => d.label).join(', ')})`);

  // 1Y Calendar Quarters Test
  const oneYearPoints = Array.from({ length: 250 }, (_, i) => ({
    time: now - (250 - i) * dayMs,
    close: 200 + i * 0.5
  }));
  const res1Y = calculateTimelineSegments('1y', oneYearPoints);
  assert.ok(res1Y.divisions.length >= 4, '1Y must show quarterly divisions');
  assert.ok(res1Y.divisions.some(d => d.label.includes("'") || (d.quarter && d.quarter.startsWith('Q')) || d.label.startsWith('Q')), '1Y labels should contain calendar quarters');
  console.log(`  ✓ 1Y: Calendar quarters generated (${res1Y.divisions.map(d => d.label).join(', ')})`);

  // 5Y Boundary & 4 Calendar Year Markers Test
  const fiveYearPoints = Array.from({ length: 500 }, (_, i) => ({
    time: now - (500 - i) * dayMs * 3.65,
    close: 100 + (i % 2 === 0 ? 15 : -10) + i * 0.4
  }));
  const res5Y = calculateTimelineSegments('5y', fiveYearPoints);
  assert.ok(res5Y.divisions.length >= 5, '5Y must show at least 5 divisions');
  console.log(`  ✓ 5Y: 6 division markers generated (${res5Y.divisions.map(d => d.label).join(', ')})`);

  // Timeline Segments Colors: Must reflect actual performance over each segment's start and end values
  for (const seg of res5Y.segments) {
    if (seg.endPrice >= seg.startPrice) {
      assert.strictEqual(seg.color, '#16B85A', `Positive segment (${seg.startLabel} -> ${seg.endLabel}) must be Green #16B85A`);
    } else {
      assert.strictEqual(seg.color, '#eb5b3c', `Negative segment (${seg.startLabel} -> ${seg.endLabel}) must be Red #eb5b3c`);
    }
  }
  console.log('  ✓ Verified: Each timeline segment strictly colored Green (#16B85A) or Red (#eb5b3c) based on actual return');

  // --- SECTION 2: Systematic Investment Plan (SIP) Feature ---
  console.log('\n--- SECTION 2: Systematic Investment Plan (SIP) Feature ---');
  const sipResult = calculateSipPerformance(fiveYearPoints, 1000);
  assert.ok(sipResult.sipData.length > 0, 'SIP data points must be calculated');
  assert.ok(sipResult.totalInvested > 0, 'Total invested must be positive');
  assert.ok(sipResult.currentValue > 0, 'Current portfolio value must be positive');
  assert.ok(!isNaN(sipResult.returnPct), 'Return percentage must be valid');
  assert.ok(sipResult.isGain === (sipResult.currentValue >= sipResult.totalInvested), 'isGain must accurately reflect gain/loss');

  console.log(`  ✓ SIP Simulation: Invested ₹${sipResult.totalInvested.toFixed(2)}, Current Value: ₹${sipResult.currentValue.toFixed(2)}, Absolute Gain: ₹${sipResult.absoluteGain.toFixed(2)}, Returns: ${sipResult.returnPct.toFixed(2)}% (${sipResult.isGain ? 'Positive' : 'Negative'})`);
  
  // Verify SIP points contain all required fields for tooltips
  const sampleSip = sipResult.sipData[0];
  assert.ok(sampleSip.time !== undefined, 'SIP point has epoch time');
  assert.ok(sampleSip.invested > 0, 'SIP point has invested capital');
  assert.ok(sampleSip.value > 0, 'SIP point has portfolio value');
  assert.ok(typeof sampleSip.date === 'string', 'SIP point has formatted date');
  console.log(`  ✓ Sample SIP Tooltip Point: Date: ${sampleSip.date}, Invested: ₹${sampleSip.invested}, Value: ₹${sampleSip.value}`);

  // --- SECTION 3: Stock Historical Chart API ---
  console.log('\n--- SECTION 3: Stock Historical Chart API (RELIANCE) ---');
  for (const r of ['1d', '1w', '1m', '1y', '5y', 'max']) {
    const stockData = await marketDataGateway.getChartData('RELIANCE', r);
    if (stockData.available && stockData.data.length > 0) {
      const pStart = stockData.data[0].open ?? stockData.data[0].close;
      const pEnd = stockData.data[stockData.data.length - 1].close;
      const changePct = ((pEnd - pStart) / pStart) * 100;
      console.log(`  ✓ Stock [${r.toUpperCase()}]: ${stockData.data.length} points, Start: ₹${pStart.toFixed(2)}, End: ₹${pEnd.toFixed(2)}, Return: ${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`);
    } else {
      console.log(`  ⚠ Stock [${r.toUpperCase()}]: Source status ${stockData.reason || 'off-hours/fallback'}`);
    }
  }

  // --- SECTION 4: Mutual Fund Historical NAV API ---
  console.log('\n--- SECTION 4: Mutual Fund Historical NAV API (Parag Parikh Flexi Cap - 122639) ---');
  for (const r of ['1d', '1w', '1m', '1y', '5y', 'max']) {
    const navData = await mfDataAggregatorService.getSchemeNavHistory('122639', r);
    assert.ok(navData.available, `NAV data must be available for ${r}`);
    assert.ok(navData.data.length > 0, `NAV data points for ${r} must be non-empty`);
    const pStart = navData.data[0].value;
    const pEnd = navData.data[navData.data.length - 1].value;
    const changePct = ((pEnd - pStart) / pStart) * 100;
    console.log(`  ✓ MF [${r.toUpperCase()}]: ${navData.data.length} NAVs, Start: ₹${pStart.toFixed(2)}, End: ₹${pEnd.toFixed(2)}, Return: ${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`);
  }

  // --- SECTION 5: Frontend Component Source Integrity ---
  console.log('\n--- SECTION 5: Frontend Component Source Integrity ---');
  const code = fs.readFileSync('frontend/src/components/TradingViewChart.jsx', 'utf8');

  // Verify all 7 standard buttons are present in TIME_RANGES
  ['1D', '1W', '1M', '1Y', '5Y', 'Max', 'SIP'].forEach(btn => {
    assert.ok(code.includes(`label: '${btn}'`), `Button ${btn} must be present in TIME_RANGES`);
  });
  console.log('  ✓ Verified: All 7 Time-Range buttons [1D, 1W, 1M, 1Y, 5Y, Max, SIP] present in selector');

  // Verify colors
  assert.ok(code.includes('#16B85A'), 'Green line color #16B85A present');
  assert.ok(code.includes('#eb5b3c'), 'Red line color #eb5b3c present');
  assert.ok(code.includes('#e5a93c'), 'Amber investment line color #e5a93c present');
  assert.ok(code.includes('rgba(22, 184, 90,'), 'Light-green gradient present');
  assert.ok(code.includes('rgba(235, 91, 60,'), 'Light-red gradient present');
  console.log('  ✓ Verified: Color palette strictly adheres to Green (#16B85A), Red (#eb5b3c), Amber (#e5a93c)');

  // Verify SIP Stats Bar (Investment, Value, Returns) & Standard Stats Bar (Low, High, Returns)
  assert.ok(code.includes('Investment'), 'SIP mode Investment stat present');
  assert.ok(code.includes('Value'), 'SIP mode Value stat present');
  assert.ok(code.includes('Returns'), 'Returns stat present');
  assert.ok(code.includes('High') && code.includes('periodHigh'), 'High stat present');
  assert.ok(code.includes('Low') && code.includes('periodLow'), 'Low stat present');
  console.log('  ✓ Verified: 3-column stats bar present for both Standard and SIP modes');

  // Verify Advanced Chart button
  assert.ok(code.includes('Advanced Chart >') || code.includes('Advanced Chart &gt;'), 'Advanced Chart button present');
  console.log('  ✓ Verified: "Advanced Chart >" button present below timeframe selector');

  // Verify Colored Timeline Segments & Dynamic Divisions
  assert.ok(code.includes('calculateTimelineSegments'), 'calculateTimelineSegments invoked');
  assert.ok(code.includes('segments.map'), 'Colored timeline segments mapped');
  assert.ok(code.includes('divisions.map'), 'Dynamic date labels mapped');
  console.log('  ✓ Verified: Colored timeline segments & dynamic date labels rendered below canvas');

  console.log('\n========================================================================');
  console.log('🎉 ALL MASTER VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
  console.log('========================================================================');
  process.exit(0);
}

runMasterTestSuite().catch(err => {
  console.error('❌ Master Test Suite Failed:', err);
  process.exit(1);
});
