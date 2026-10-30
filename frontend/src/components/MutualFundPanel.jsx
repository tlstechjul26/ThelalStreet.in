import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveSymbol } from '../store/slices/marketSlice';
import { createChart } from 'lightweight-charts';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine } from 'recharts';
import { Search, X, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Calculator, Pencil, Trash2 } from 'lucide-react';
import MfInvestmentCalculator from './MfInvestmentCalculator';
import TradingViewChart from './TradingViewChart';
import TimeframeSelector from './TimeframeSelector';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function MutualFundPanel({ initialScheme = null, region = 'india' }) {
  const dispatch = useDispatch();
  const { activeMfScheme } = useSelector(state => state.market);
  
  const [scheme, setScheme] = useState(initialScheme);
  const [navData, setNavData] = useState([]);
  const [earliestDate, setEarliestDate] = useState(null);
  const [holdingsData, setHoldingsData] = useState(null);
  
  const [chartInterval, setChartInterval] = useState('1y');
  const [chartType, setChartType] = useState('area');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoverCoord, setHoverCoord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Trendline state for double-tap / click measurement
  const [trendline, setTrendline] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState(null);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [activeDragHandle, setActiveDragHandle] = useState(null);
  
  const chartContainerRef = useRef(null);
  const svgOverlayRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const baselineSeriesRef = useRef(null);
  const debounceRef = useRef(null);
  const lastTapTimeRef = useRef(0);

  // Load scheme details if activeMfScheme or initialScheme changes
  useEffect(() => {
    if (activeMfScheme) {
      loadScheme(activeMfScheme);
    } else if (initialScheme) {
      loadScheme(initialScheme.schemeCode || initialScheme.id);
    }
  }, [activeMfScheme, initialScheme]);

  const loadScheme = async (code) => {
    try {
      // If we don't have the scheme details, search it to get the name
      let schemeName = 'Loading...';
      const searchRes = await axios.get(`${API_BASE}/mf/search?q=${code}&region=${region}`);
      const found = searchRes.data.find(s => String(s.schemeCode || s.id) === String(code));
      if (found) {
        schemeName = found.name || found.schemeName;
        setScheme(found);
      } else {
        setScheme({ schemeCode: code, id: code, schemeName: `Scheme ${code}`, name: `Scheme ${code}`, region });
      }
      
      // Fetch holdings/profile
      const holdingsRes = await axios.get(`${API_BASE}/mf/${region}/${code}/profile`);
      setHoldingsData(holdingsRes.data);
      
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch NAV history when scheme or interval changes
  useEffect(() => {
    if (!scheme) return;
    
    const fetchNav = async () => {
      try {
        const code = scheme.schemeCode || scheme.id;
        const schemeRegion = scheme.region || region;
        const res = await axios.get(`${API_BASE}/mf/${schemeRegion}/${code}/nav?range=${encodeURIComponent(chartInterval)}`);
        if (res.headers['x-earliest-date']) {
          setEarliestDate(Number(res.headers['x-earliest-date']));
        }
        const items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setNavData(items);
        setHoveredPoint(null);
        setHoverCoord(null);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNav();
  }, [scheme, chartInterval]);

  // Handle Search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE}/mf/search?q=${encodeURIComponent(searchQuery.trim())}&region=${region}`);
        setSearchResults(res.data.slice(0, 10)); // limit to 10 for UI
      } catch (err) {
        console.error(err);
      }
      setSearching(false);
    }, 500);
  }, [searchQuery]);

  // Tickertape-Style Metrics & Stats
  const sortedData = useMemo(() => {
    return [...navData].sort((a, b) => a.time - b.time);
  }, [navData]);

  const uniqueData = useMemo(() => {
    return sortedData.filter((c, i, arr) => 
      i === 0 || Math.floor(c.time / 1000) > Math.floor(arr[i - 1].time / 1000)
    );
  }, [sortedData]);

  const startPoint = uniqueData[0];
  const startNav = startPoint ? startPoint.value : 0;
  const latestPoint = uniqueData[uniqueData.length - 1];
  const latestNav = latestPoint ? latestPoint.value : 0;
  const periodChange = latestNav - startNav;
  const periodChangePct = startNav > 0 ? (periodChange / startNav) * 100 : 0;
  const isPeriodGain = latestNav >= startNav;
  const themeColor = isPeriodGain ? '#00b386' : '#eb5b3c';

  const periodLow = useMemo(() => {
    if (uniqueData.length === 0) return 0;
    return Math.min(...uniqueData.map(c => c.value));
  }, [uniqueData]);

  const periodHigh = useMemo(() => {
    if (uniqueData.length === 0) return 0;
    return Math.max(...uniqueData.map(c => c.value));
  }, [uniqueData]);

  const formatDate = (t) => {
    if (!t) return '';
    const d = typeof t === 'number' && t < 10000000000 ? new Date(t * 1000) : new Date(t);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const activeNav = hoveredPoint?.value ?? latestNav;
  const activeChange = hoveredPoint ? hoveredPoint.change : periodChange;
  const activeChangePct = hoveredPoint ? hoveredPoint.changePct : periodChangePct;
  const activeDate = hoveredPoint?.date || formatDate(latestPoint?.time);

  const monthlyReturns = useMemo(() => {
    if (!uniqueData || uniqueData.length < 2) return [];
    const monthGroups = new Map();
    uniqueData.forEach(pt => {
      const d = typeof pt.time === 'number' && pt.time < 10000000000 ? new Date(pt.time * 1000) : new Date(pt.time);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!monthGroups.has(key)) {
        monthGroups.set(key, { key, label, points: [] });
      }
      monthGroups.get(key).points.push(pt);
    });

    const result = [];
    monthGroups.forEach(({ label, points }) => {
      if (points.length === 0) return;
      const startVal = points[0].value;
      const endVal = points[points.length - 1].value;
      const diff = endVal - startVal;
      const returnPct = startVal > 0 ? Number(((diff / startVal) * 100).toFixed(2)) : 0;
      const isGain = returnPct >= 0;
      result.push({
        month: label,
        returnPct,
        startNav: startVal,
        endNav: endVal,
        diff: Number(diff.toFixed(2)),
        isGain,
        fill: isGain ? '#00b386' : '#eb5b3c'
      });
    });
    return result;
  }, [uniqueData]);

  // Construct Tickertape Chart
  useEffect(() => {
    if (!chartContainerRef.current || uniqueData.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 380,
      layout: {
        background: { color: '#0f172a' },
        textColor: '#94a3b8',
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(148, 163, 184, 0.08)' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: 'rgba(148, 163, 184, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1e293b',
        },
        horzLine: {
          color: 'rgba(148, 163, 184, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1e293b',
        },
      },
      timeScale: {
        timeVisible: true,
        borderColor: 'rgba(148, 163, 184, 0.15)',
      },
      priceScale: {
        borderColor: 'rgba(148, 163, 184, 0.15)',
      }
    });
    chartRef.current = chart;

    // Subtle Tickertape Baseline Reference Line at Start NAV
    if (startNav > 0 && uniqueData.length > 1) {
      const baselineSeries = chart.addLineSeries({
        color: 'rgba(148, 163, 184, 0.35)',
        lineWidth: 1,
        lineStyle: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      baselineSeries.setData(uniqueData.map(c => ({
        time: Math.floor(c.time / 1000),
        value: startNav
      })));
      baselineSeriesRef.current = baselineSeries;
    }

    let mainSeries;
    if (chartType === 'candlestick') {
      mainSeries = chart.addCandlestickSeries({
        upColor: '#00b386',
        downColor: '#eb5b3c',
        borderVisible: false,
        wickUpColor: '#00b386',
        wickDownColor: '#eb5b3c',
      });
      mainSeries.setData(uniqueData.map(d => ({
        time: Math.floor(d.time / 1000),
        open: d.value,
        high: d.value,
        low: d.value,
        close: d.value
      })));
    } else if (chartType === 'line') {
      mainSeries = chart.addLineSeries({
        color: themeColor,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: '#ffffff',
        crosshairMarkerBackgroundColor: themeColor,
      });
      mainSeries.setData(uniqueData.map(d => ({
        time: Math.floor(d.time / 1000),
        value: d.value
      })));
    } else {
      const topColor = isPeriodGain ? 'rgba(0, 179, 134, 0.25)' : 'rgba(235, 91, 60, 0.25)';
      const bottomColor = isPeriodGain ? 'rgba(0, 179, 134, 0.0)' : 'rgba(235, 91, 60, 0.0)';
      mainSeries = chart.addAreaSeries({
        lineColor: themeColor,
        topColor,
        bottomColor,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: '#ffffff',
        crosshairMarkerBackgroundColor: themeColor,
      });
      mainSeries.setData(uniqueData.map(d => ({
        time: Math.floor(d.time / 1000),
        value: d.value
      })));
    }
    seriesRef.current = mainSeries;

    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData || !param.point) {
        setHoveredPoint(null);
        setHoverCoord(null);
        return;
      }
      const seriesData = param.seriesData.get(mainSeries);
      if (!seriesData) {
        setHoveredPoint(null);
        setHoverCoord(null);
        return;
      }
      const val = chartType === 'candlestick' ? seriesData.close : seriesData.value;
      if (val === undefined || isNaN(val)) {
        setHoveredPoint(null);
        setHoverCoord(null);
        return;
      }

      let dateFormatted = '';
      if (typeof param.time === 'number') {
        const d = new Date(param.time * 1000);
        dateFormatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      } else if (param.time && typeof param.time === 'object') {
        const { year, month, day } = param.time;
        const d = new Date(year, month - 1, day);
        dateFormatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }

      const change = val - startNav;
      const changePct = startNav > 0 ? (change / startNav) * 100 : 0;
      setHoveredPoint({ value: val, change, changePct, date: dateFormatted });
      setHoverCoord({ x: param.point.x, y: param.point.y });
    });

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === chartContainerRef.current && chartRef.current) {
          chartRef.current.resize(entry.contentRect.width, 380);
        }
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [uniqueData, chartType, themeColor, isPeriodGain, startNav]);

  return (
    <div className="flex flex-col gap-5">
      {/* Search Header */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-xl flex items-center gap-4 relative z-20">
        <div className="flex-1 max-w-xl relative">
          <div className="flex items-center bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] px-3 py-2">
            <Search size={16} className="text-[var(--text-muted)] mr-2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Mutual Funds (e.g. Parag Parikh Flexi Cap)..."
              className="bg-transparent border-none outline-none text-sm text-[var(--text-primary)] w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-2">
                <X size={14} />
              </button>
            )}
          </div>
          
          {searchQuery.length >= 3 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
              {searching ? (
                <div className="p-4 text-sm text-[var(--text-muted)]">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-sm text-[var(--text-muted)]">No schemes found.</div>
              ) : (
                searchResults.map(s => (
                  <button 
                    key={s.schemeCode || s.id}
                    onClick={() => {
                      setScheme(s);
                      setSearchQuery('');
                      setNavData([]);
                      setEarliestDate(null);
                      setHoldingsData(null);
                      loadScheme(s.schemeCode || s.id);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex flex-col"
                  >
                    <span className="text-sm font-medium text-[var(--text-primary)]">{s.schemeName || s.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">{s.fundHouse || s.family} • Code: {s.schemeCode || s.id}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {!scheme ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-12 rounded-xl flex flex-col items-center justify-center text-[var(--text-muted)] gap-4">
          <PieChartIcon size={48} className="opacity-20" />
          <p>Search and select a mutual fund to view its portfolio and NAV history.</p>
        </div>
      ) : (
        <>
          {/* Main Chart Area */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 gap-0.5">
                <button
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    chartType !== 'monthly' ? 'bg-[#16B85A] text-white shadow-xs font-bold' : 'text-[#64748b] hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  Performance Chart
                </button>
                <button
                  onClick={() => setChartType('monthly')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    chartType === 'monthly' ? 'bg-[#16B85A] text-white shadow-xs font-bold' : 'text-[#64748b] hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  Monthly Breakdown
                </button>
              </div>
            </div>

            {chartType === 'monthly' ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 text-slate-900">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Monthly Historical Return Breakdown</h3>
                <div className="h-[360px] w-full">
                  {monthlyReturns.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyReturns} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                        <XAxis
                          dataKey="month"
                          stroke="#cbd5e1"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <YAxis
                          stroke="#cbd5e1"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length > 0) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs font-sans text-slate-900 dark:text-slate-100">
                                  <div className="text-[#64748b] font-medium mb-1">{d.month} Historical Return</div>
                                  <div className={`text-base font-extrabold font-mono ${d.isGain ? 'text-[#16B85A]' : 'text-[#eb5b3c]'}`}>
                                    {d.isGain ? '▲ +' : '▼ '}{d.returnPct.toFixed(2)}%
                                  </div>
                                  <div className="text-slate-500 font-mono text-[11px] mt-1 space-y-0.5">
                                    <div>Start NAV: ₹{d.startNav.toFixed(2)}</div>
                                    <div>End NAV: ₹{d.endNav.toFixed(2)}</div>
                                    <div>Change: {d.diff >= 0 ? '+' : ''}₹{d.diff.toFixed(2)}</div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine y={0} stroke="rgba(148, 163, 184, 0.45)" strokeDasharray="2 2" />
                        <Bar dataKey="returnPct" radius={[4, 4, 0, 0]}>
                          {monthlyReturns.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.isGain ? '#16B85A' : '#eb5b3c'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                      Monthly breakdown requires historical NAV data.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <TradingViewChart schemeCode={scheme?.schemeCode || scheme?.id} fund={scheme} assetType="mf" region={region} height={380} />
            )}
          </div>

          {/* Interactive Calculator */}
          {navData && navData.length > 0 && (
            <MfInvestmentCalculator 
              navData={navData} 
              currency={scheme.currency || (region === 'global' ? 'USD' : 'INR')} 
            />
          )}

          {/* Holdings Area */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex justify-between items-center">
              <h3 className="font-semibold text-[var(--text-primary)]">Portfolio Holdings</h3>
              {holdingsData?.asOfDate && (
                <span className="text-xs text-[var(--text-muted)]">As of {holdingsData.asOfDate}</span>
              )}
            </div>
            
            {!holdingsData ? (
              <div className="p-8 text-center text-[var(--text-muted)] text-sm">Loading portfolio...</div>
            ) : !holdingsData.available ? (
              <div className="p-8 text-center text-[var(--text-muted)] text-sm">Holdings data not available for this scheme.</div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--bg-card)] sticky top-0 shadow-sm">
                    <tr>
                      <th className="px-5 py-3 text-[var(--text-muted)] font-medium">Stock/Asset</th>
                      <th className="px-5 py-3 text-[var(--text-muted)] font-medium">Sector</th>
                      <th className="px-5 py-3 text-[var(--text-muted)] font-medium text-right">LTP (Change)</th>
                      <th className="px-5 py-3 text-[var(--text-muted)] font-medium text-right">Allocation (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {holdingsData.holdings.map((h, i) => {
                      const hasQuote = h.ltp !== undefined;
                      const isUp = hasQuote && h.changePercent > 0;
                      const isDown = hasQuote && h.changePercent < 0;

                      return (
                        <tr 
                          key={i} 
                          onClick={() => {
                            if (h.symbol) {
                              dispatch(setActiveSymbol(h.symbol));
                            }
                          }}
                          className={`transition-colors ${h.symbol ? 'cursor-pointer hover:bg-[var(--bg-secondary)]' : 'hover:bg-[var(--bg-secondary)]/50'}`}
                        >
                          <td className="px-5 py-3">
                            <div className="font-medium text-[var(--text-primary)]">{h.stock}</div>
                            {h.symbol && <div className="text-xs text-[var(--text-muted)]">{h.symbol}</div>}
                          </td>
                          <td className="px-5 py-3 text-[var(--text-muted)] text-xs">{h.sector}</td>
                          <td className="px-5 py-3 text-right">
                            {hasQuote ? (
                              <div>
                                <div className="font-mono text-sm font-medium text-[var(--text-primary)]">
                                  {holdingsData?.currency === 'USD' ? '$' : holdingsData?.currency === 'EUR' ? '€' : holdingsData?.currency === 'GBP' ? '£' : ''}
                                  {h.ltp?.toLocaleString(holdingsData?.currency === 'USD' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2 })}
                                </div>
                                <div className={`flex items-center justify-end gap-0.5 font-mono text-xs ${isUp ? 'text-gain' : isDown ? 'text-loss' : 'text-[var(--text-muted)]'}`}>
                                  {isUp ? <ArrowUpRight size={12} /> : isDown ? <ArrowDownRight size={12} /> : null}
                                  {isUp ? '+' : ''}{h.changePercent?.toFixed(2)}%
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-[var(--text-muted)]">—</div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[var(--text-primary)] font-medium">{h.allocationPct.toFixed(2)}%</span>
                              <div className="w-16 h-1.5 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-color)]">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${h.allocationPct}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
