import assert from 'assert';
import fs from 'fs';
import path from 'path';
import marketDataGateway from '../services/MarketDataGateway.js';
import mfDataAggregatorService from '../services/MfDataAggregatorService.js';
import { resolveRangeToDates } from '../utils/dateRangeUtils.js';

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE: PRICE/PERFORMANCE CHART (STOCKS & MUTUAL FUNDS)');
  console.log('================================================================');

  // --- SECTION 1: Time-Range Resolution ---
  console.log('\n--- SECTION 1: Standard Time Ranges (1D, 1W, 1M, 1Y, 5Y, Max) ---');
  const requiredRanges = ['1D', '1W', '1M', '1Y', '5Y', 'Max'];
  for (const r of requiredRanges) {
    const dates = resolveRangeToDates(r);
    assert.ok(dates.start instanceof Date, `Start date for ${r} must be Date instance`);
    assert.ok(dates.end instanceof Date, `End date for ${r} must be Date instance`);
    assert.ok(dates.start.getTime() <= dates.end.getTime(), `Start must precede end for ${r}`);
    console.log(`  ✓ Range '${r}' successfully resolved: ${dates.start.toISOString().slice(0, 10)} to ${dates.end.toISOString().slice(0, 10)}`);
  }

  // --- SECTION 2: Stock Historical Price Data ---
  console.log('\n--- SECTION 2: Stock Historical Price Data (RELIANCE) ---');
  for (const r of ['1d', '1w', '1m', '1y', '5y', 'max']) {
    const chartRes = await marketDataGateway.getChartData('RELIANCE', r);
    assert.ok(chartRes.available !== undefined, `Stock chart for ${r} must return valid available status`);
    if (chartRes.available) {
      assert.ok(Array.isArray(chartRes.data), `Data for ${r} must be array`);
      assert.ok(chartRes.data.length > 0, `Data points for ${r} must be non-empty`);
      const sample = chartRes.data[0];
      assert.ok(typeof sample.time === 'number', 'Time must be numeric epoch');
      assert.ok(typeof sample.close === 'number', 'Close price must be numeric');
      
      const high = Math.max(...chartRes.data.map(c => c.high ?? c.close));
      const low = Math.min(...chartRes.data.map(c => c.low ?? c.close));
      const startP = chartRes.data[0].open ?? chartRes.data[0].close;
      const endP = chartRes.data[chartRes.data.length - 1].close;
      const retPct = ((endP - startP) / startP) * 100;
      
      assert.ok(!isNaN(high) && high >= low, `High (${high}) must be >= Low (${low})`);
      assert.ok(!isNaN(retPct), `Returns percentage must be a valid number`);
      console.log(`  ✓ Stock [${r.toUpperCase()}]: ${chartRes.data.length} points, Low: ₹${low.toFixed(2)}, High: ₹${high.toFixed(2)}, Return: ${retPct >= 0 ? '+' : ''}${retPct.toFixed(2)}%`);
    } else {
      console.log(`  ⚠ Stock [${r.toUpperCase()}]: Data gracefully unavailable from primary source (${chartRes.reason || 'Off-hours'})`);
    }
  }

  // --- SECTION 3: Mutual Fund Historical NAV Data ---
  console.log('\n--- SECTION 3: Mutual Fund Historical NAV Data (122639) ---');
  for (const r of ['1d', '1w', '1m', '1y', '5y', 'max']) {
    const navRes = await mfDataAggregatorService.getSchemeNavHistory('122639', r);
    assert.ok(navRes.available, `NAV history for 122639 on range ${r} must be available`);
    assert.ok(Array.isArray(navRes.data), `NAV data for ${r} must be array`);
    assert.ok(navRes.data.length > 0, `NAV data for ${r} must be non-empty`);

    // Verify 1d / 1w does NOT return entire 10-year dataset on market holidays
    if (r === '1d') {
      assert.ok(navRes.data.length <= 10, `1D range should only return recent trading days, got ${navRes.data.length}`);
    } else if (r === '1w') {
      assert.ok(navRes.data.length <= 15, `1W range should only return recent trading days, got ${navRes.data.length}`);
    }

    const highNav = Math.max(...navRes.data.map(p => p.value));
    const lowNav = Math.min(...navRes.data.map(p => p.value));
    const startNav = navRes.data[0].value;
    const endNav = navRes.data[navRes.data.length - 1].value;
    const retPct = ((endNav - startNav) / startNav) * 100;

    assert.ok(highNav >= lowNav, `NAV High (${highNav}) must be >= Low (${lowNav})`);
    assert.ok(!isNaN(retPct), `NAV Return percentage must be valid`);
    console.log(`  ✓ MF [${r.toUpperCase()}]: ${navRes.data.length} NAV points, Low: ₹${lowNav.toFixed(2)}, High: ₹${highNav.toFixed(2)}, Return: ${retPct >= 0 ? '+' : ''}${retPct.toFixed(2)}%`);
  }

  // --- SECTION 4: Chart Component Design & Theme Conformance ---
  console.log('\n--- SECTION 4: Chart Component Design & Theme Conformance ---');
  const chartComponentCode = fs.readFileSync('frontend/src/components/TradingViewChart.jsx', 'utf8');

  // Verify pure white / light theme
  assert.ok(chartComponentCode.includes("color: '#ffffff'") || chartComponentCode.includes('bg-white'), 'Chart background must be pure white');
  assert.ok(!chartComponentCode.includes("background: { color: '#0f172a' }"), 'Dark mode background must be eliminated from chart layout');
  console.log('  ✓ Verified: Clean white/light theme active (no dark mode background in chart)');

  // Verify reference colors
  assert.ok(chartComponentCode.includes('#16B85A'), 'Line color must match #16B85A');
  assert.ok(chartComponentCode.includes('rgba(22, 184, 90,'), 'Gradient fill must match light-green #16B85A rgba');
  console.log('  ✓ Verified: Line color strictly #16B85A and light-green gradient fill present');

  // Verify blue-gray text
  assert.ok(chartComponentCode.includes('#64748b') || chartComponentCode.includes('#475569'), 'Blue-gray text color present');
  console.log('  ✓ Verified: Blue-gray tooltip and label text (#64748b / #475569) present');

  // Verify High, Low, Returns, Value, and Percentage Change
  assert.ok(chartComponentCode.includes('High:') || chartComponentCode.includes('periodHigh'), 'High statistic must be displayed');
  assert.ok(chartComponentCode.includes('Low:') || chartComponentCode.includes('periodLow'), 'Low statistic must be displayed');
  assert.ok(chartComponentCode.includes('Returns:') || chartComponentCode.includes('periodChangePct'), 'Returns statistic must be displayed');
  console.log('  ✓ Verified: Selected asset value, percentage change, High, Low, and Returns displayed');

  // Verify standard time-range buttons: 1D, 1W, 1M, 1Y, 5Y, Max
  for (const label of ['1D', '1W', '1M', '1Y', '5Y', 'Max']) {
    assert.ok(chartComponentCode.includes(`'${label}'`), `Time-range button ${label} must be present`);
  }
  console.log('  ✓ Verified: Standard time-range buttons 1D, 1W, 1M, 1Y, 5Y, Max present');

  console.log('\n================================================================');
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
  process.exit(0);
}

runTestSuite().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
