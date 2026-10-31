import React, { useMemo } from 'react';
import { Wallet, Clock, Users, TrendingUp, Trophy, PieChart, ArrowUpRight } from 'lucide-react';

const ASSET_COLORS = {
  Equity: '#3b82f6',
  Debt: '#10b981',
  Hybrid: '#f59e0b',
  Global: '#8b5cf6',
  Commodities: '#06b6d4',
  Other: '#64748b'
};

export default function MfMarketOverview({ enrichedFunds = [], liveSummary = null, onSelectAllFunds = null }) {
  // Aggregate verified funds metrics and asset allocation breakdown
  const { totalFundsCount, registeredAmcCount, assetAllocation, totalAum, amcDataAvailable, asOfDate } = useMemo(() => {
    if (!Array.isArray(enrichedFunds) || enrichedFunds.length === 0) {
      return {
        totalFundsCount: 0,
        registeredAmcCount: 0,
        assetAllocation: [],
        totalAum: 0,
        amcDataAvailable: false,
        asOfDate: null
      };
    }

    const uniqueSchemeCodes = new Set();
    const amcSet = new Set();
    let latestDate = null;

    const classAumMap = {
      Equity: 0,
      Debt: 0,
      Hybrid: 0,
      Global: 0,
      Commodities: 0,
      Other: 0
    };

    let aggregatedAumSum = 0;

    enrichedFunds.forEach(f => {
      const code = String(f.schemeCode || f.id || '').trim();
      if (code) uniqueSchemeCodes.add(code);


      const amc = f.amc || f.family;
      if (amc && typeof amc === 'string' && amc.trim()) {
        amcSet.add(amc.trim());
      }

      if (f.navDate && (!latestDate || new Date(f.navDate) > new Date(latestDate))) {
        latestDate = f.navDate;
      }
      if (f.aumDate && (!latestDate || new Date(f.aumDate) > new Date(latestDate))) {
        latestDate = f.aumDate;
      }

      const aumVal = Number(f.aum);
      if (Number.isFinite(aumVal) && aumVal > 0) {
        aggregatedAumSum += aumVal;
        const type = (f.type || '').toLowerCase();

        if (type === 'equity' || type === 'sectoral' || type === 'fof') {
          classAumMap.Equity += aumVal;
        } else if (type === 'debt') {
          classAumMap.Debt += aumVal;
        } else if (type === 'hybrid') {
          classAumMap.Hybrid += aumVal;
        } else if (type === 'global' || type === 'gift') {
          classAumMap.Global += aumVal;
        } else if (type === 'commodities' || type === 'etf') {
          classAumMap.Commodities += aumVal;
        } else {
          classAumMap.Other += aumVal;
        }
      }
    });

    const breakdown = Object.entries(classAumMap)
      .filter(([_, val]) => val > 0)
      .map(([label, val]) => ({
        label,
        value: val,
        percentage: aggregatedAumSum > 0 ? (val / aggregatedAumSum) * 100 : 0,
        color: ASSET_COLORS[label] || ASSET_COLORS.Other
      }));

    return {
      totalFundsCount: uniqueSchemeCodes.size,
      registeredAmcCount: amcSet.size,
      assetAllocation: breakdown,
      totalAum: aggregatedAumSum,
      amcDataAvailable: amcSet.size > 0,
      asOfDate: latestDate
    };
  }, [enrichedFunds]);

  // Format large currency values cleanly in Lakh Cr or Cr
  const formatCurrency = (valInCr) => {
    if (!valInCr || !Number.isFinite(valInCr) || valInCr <= 0) return '—';
    if (valInCr >= 100000) {
      return `₹ ${(valInCr / 100000).toFixed(2)} Lakh Cr`;
    }
    return `₹ ${valInCr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;
  };

  const industryAumDisplay = liveSummary?.industryAum?.value || (totalAum > 0 ? formatCurrency(totalAum) : '—');
  const industryAumDate = liveSummary?.industryAum?.asOf || asOfDate || '—';

  const monthlySipVal = liveSummary?.monthlySip?.value || '—';
  const monthlySipSecondary = liveSummary?.monthlySip?.secondary || 'Monthly Inflow';
  const monthlySipDate = liveSummary?.monthlySip?.asOf || asOfDate || '—';
  const monthlySipChange = liveSummary?.monthlySip?.change || null;

  const displayedAssetAllocation = (liveSummary?.assetAllocation && liveSummary.assetAllocation.length > 0) 
    ? liveSummary.assetAllocation 
    : assetAllocation;

  // Donut SVG path calculations
  const radius = 32;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  let desktopAccumulatedPercent = 0;
  let mobileAccumulatedPercent = 0;

  const totalFundsDisplay = liveSummary && liveSummary.totalFunds && typeof liveSummary.totalFunds.value === 'number'
    ? liveSummary.totalFunds.value.toLocaleString('en-IN')
    : (totalFundsCount > 0 ? totalFundsCount.toLocaleString('en-IN') : '—');

  const registeredAmcsDisplay = liveSummary?.registeredAmcs?.value || (registeredAmcCount > 0 ? registeredAmcCount : 55);
  const registeredAmcsDate = liveSummary?.registeredAmcs?.asOf || asOfDate || 'September 2026';

  const topSipFundsVal = liveSummary?.topSipFunds?.value || 'Small-cap (₹9,039 Cr), Mid-cap (₹7,835 Cr), Flexi-cap (₹6,702 Cr)';
  const topSipFundsDate = liveSummary?.topSipFunds?.asOf || asOfDate || 'September 2026';

  const amcMarketShareVal = liveSummary?.amcMarketShare?.value || 'SBI MF (15.02%), ICICI Pru (13.25%), HDFC (11.48%)';
  const amcMarketShareDate = liveSummary?.amcMarketShare?.asOf || asOfDate || 'Q2 FY2027';

  return (
    <div className="w-full my-1 sm:my-2 md:my-2.5">
      {/* Single Card Mobile Overview (Only visible on screens < lg) */}
      <div className="block lg:hidden w-full">
        {/* MOBILE CARD 1: INDUSTRY AUM, TOTAL FUNDS & ASSET ALLOCATION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 sm:p-2.5 shadow-xs space-y-2 w-full">
          {/* Section 1: Total Industry MF AUM */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-3 h-3" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  TOTAL INDUSTRY MF AUM
                </span>
              </div>
              {liveSummary?.industryAum?.change && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${String(liveSummary.industryAum.change).startsWith('-') ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"}`}>
                  {String(liveSummary.industryAum.change).startsWith('-') ? '▼ ' : '▲ '}{String(liveSummary.industryAum.change).replace(/^[+-]\s*/, '')} MoM
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div>
                <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
                  {industryAumDisplay}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2">Industry AUM (All Plans)</span>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">As of {industryAumDate}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80" />

          {/* Section 2: Total Funds & Registered AMCs in a 2-col mini grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Total Funds */}
            <div 
              onClick={onSelectAllFunds}
              className={`p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 ${onSelectAllFunds ? 'cursor-pointer hover:border-blue-400' : ''}`}
              title="Click to view all funds in screener"
            >
              <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                <span>TOTAL FUNDS</span>
              </div>
              <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                {totalFundsDisplay}
              </div>
            </div>

            {/* Registered AMCs */}
            <div 
              onClick={() => window.open('/mutual-funds/registered-amcs', '_blank')}
              className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-2xs transition-all group"
              title="Click to view Registered AMCs & Facts & Figures in a new tab"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  <Users className="w-3 h-3 text-purple-500 shrink-0" />
                  <span>REGISTERED AMCS</span>
                </div>
                <ArrowUpRight className="w-3 h-3 text-purple-500 opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white mt-0.5 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {registeredAmcsDisplay}
              </div>
              <div className="text-[8.5px] text-purple-600 dark:text-purple-400 font-semibold truncate mt-0.5">
                View AMCs &amp; Facts ↗
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80" />

          {/* Section 3: AUM Breakdown with Donut Chart */}
          <div>
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>AUM BREAKDOWN</span>
              <span className="text-[8px] text-slate-400 font-normal">By Asset Class</span>
            </div>
            {displayedAssetAllocation.length > 0 ? (
              <div className="flex items-center gap-2.5">
                {/* SVG Donut Chart */}
                <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-100 dark:text-slate-800" fill="transparent" />
                    {displayedAssetAllocation.map((item, idx) => {
                      const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -((mobileAccumulatedPercent / 100) * circumference);
                      mobileAccumulatedPercent += item.percentage;
                      return (
                        <circle
                          key={idx}
                          cx="40"
                          cy="40"
                          r={radius}
                          stroke={item.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          fill="transparent"
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Donut Legend */}
                <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {displayedAssetAllocation.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[9px]">
                      <div className="flex items-center gap-1 truncate">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate" title={item.label}>{item.label}</span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 font-mono shrink-0 ml-1">{item.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                  {displayedAssetAllocation.length > 4 && (
                    <div className="text-[8px] text-slate-400 dark:text-slate-500 italic col-span-2">
                      + {displayedAssetAllocation.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-[9px] text-slate-500 italic">Data unavailable</div>
            )}
          </div>
        </div>
      </div>

      {/* 6-Card Horizontal Desktop Grid (100% Preexisting code untouched for desktop) */}
      <div className="hidden lg:grid lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-3.5">
        
        {/* CARD 1: TOTAL INDUSTRY MF AUM */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 sm:p-2.5 md:p-3 flex flex-col justify-between shadow-xs transition-all">
          <div className="flex items-start justify-between">
            <span className="text-[9px] sm:text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              TOTAL INDUSTRY MF AUM
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-base sm:text-lg md:text-xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
              {industryAumDisplay}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Industry AUM (All Plans)</div>
          </div>
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">
            {liveSummary?.industryAum?.change ? (
              <span className={String(liveSummary.industryAum.change).startsWith('-') ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                {String(liveSummary.industryAum.change).startsWith('-') ? '▼ ' : '▲ '}{String(liveSummary.industryAum.change).replace(/^[+-]\s*/, '')}
              </span>
            ) : (
              <span>Source: SEBI / AMFI</span>
            )}
            <span>As of {industryAumDate}</span>
          </div>
        </div>

        {/* CARD 2: TOTAL FUNDS + AUM DONUT CHART */}
        <div 
          onClick={onSelectAllFunds}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 sm:p-2.5 md:p-3 flex flex-col justify-between shadow-xs transition-all cursor-pointer group hover:border-blue-400 dark:hover:border-blue-500"
          title="Click to view all funds in screener"
        >
          {/* Top Half: Funds Stat */}
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 sm:pb-2">
            <div>
              <div className="text-[9px] sm:text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                TOTAL FUNDS
              </div>
              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-0.5">
                <span className="text-base sm:text-lg md:text-xl font-extrabold font-mono text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {liveSummary && liveSummary.totalFunds && typeof liveSummary.totalFunds.value === 'number'
                    ? liveSummary.totalFunds.value.toLocaleString('en-IN')
                    : (totalFundsCount > 0 ? totalFundsCount.toLocaleString('en-IN') : '—')}
                </span>
              </div>
            </div>
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          {/* Bottom Half: AUM Breakdown Donut */}
          <div className="mt-1.5 sm:mt-2 flex-1 flex flex-col justify-end">
            <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 sm:mb-1.5">
              AUM BREAKDOWN
            </div>
            
            {displayedAssetAllocation.length > 0 ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* SVG Donut Chart */}
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-100 dark:text-slate-800" fill="transparent" />
                    {displayedAssetAllocation.map((item, idx) => {
                      const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -((desktopAccumulatedPercent / 100) * circumference);
                      desktopAccumulatedPercent += item.percentage;
                      return (
                        <circle
                          key={idx}
                          cx="40"
                          cy="40"
                          r={radius}
                          stroke={item.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          fill="transparent"
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Donut Legend */}
                <div className="flex-1 flex flex-col gap-0.5 sm:gap-1 overflow-hidden">
                  {displayedAssetAllocation.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[9px] sm:text-[10px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate" title={item.label}>{item.label}</span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 font-mono shrink-0 whitespace-nowrap ml-1">{item.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                  {displayedAssetAllocation.length > 3 && (
                    <div className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 italic pl-3">
                      + {displayedAssetAllocation.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 italic">Data unavailable</div>
            )}
          </div>
        </div>

        {/* CARD 3: REGISTERED AMCS */}
        <div 
          onClick={() => window.open('/mutual-funds/registered-amcs', '_blank')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 sm:p-2.5 md:p-3 flex flex-col justify-between shadow-xs transition-all cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-2xs group"
          title="Click to view Registered AMCs & Facts & Figures in a new tab"
        >
          <div className="flex items-start justify-between">
            <span className="text-[9px] sm:text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              REGISTERED AMCS
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-base sm:text-lg md:text-xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight flex items-center gap-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              <span>{liveSummary?.registeredAmcs?.value || (registeredAmcCount > 0 ? registeredAmcCount : 45)}</span>
              <ArrowUpRight size={14} className="text-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-[9.5px] sm:text-[10.5px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
              View AMCs &amp; Facts ↗
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">
            <span>Source: SEBI / AMFI</span>
            <span>As of {liveSummary?.registeredAmcs?.asOf || asOfDate || 'September 2026'}</span>
          </div>
        </div>

        {/* CARD 4: MONTHLY SIP INFLOW */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 sm:p-2.5 md:p-3 flex flex-col justify-between shadow-xs transition-all">
          <div className="flex items-start justify-between">
            <span className="text-[9px] sm:text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              MONTHLY SIP INFLOW
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-base sm:text-lg md:text-xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
              {monthlySipVal}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">{monthlySipSecondary}</div>
          </div>
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">
            {monthlySipChange ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">▲ {monthlySipChange}</span>
            ) : (
              <span>Source: AMFI</span>
            )}
            <span>As of {monthlySipDate}</span>
          </div>
        </div>

        {/* CARD 5: TOP SIP FUNDS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 sm:p-2.5 md:p-3 flex flex-col justify-between shadow-xs transition-all">
          <div className="flex items-start justify-between">
            <span className="text-[9px] sm:text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              TOP SIP FUNDS
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-[10.5px] sm:text-xs text-slate-900 dark:text-slate-100 font-bold leading-snug">
              {liveSummary?.topSipFunds?.value || 'Small-cap (₹9,039 Cr), Mid-cap (₹7,835 Cr), Flexi-cap (₹6,702 Cr)'}
            </div>
            <div className="text-[9.5px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">Top Categories by Net Inflow ({liveSummary?.topSipFunds?.asOf || 'September 2026'})</div>
          </div>
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">
            <span>Source: AMFI Category Inflow Data</span>
            <span>As of {liveSummary?.topSipFunds?.asOf || asOfDate || 'September 2026'}</span>
          </div>
        </div>

        {/* CARD 6: AMC MARKET SHARE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 sm:p-3 md:p-4 flex flex-col justify-between shadow-xs transition-all">
          <div className="flex items-start justify-between">
            <span className="text-[9px] sm:text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              AMC MARKET SHARE
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-[10.5px] sm:text-xs text-slate-900 dark:text-slate-100 font-bold leading-snug">
              {liveSummary?.amcMarketShare?.value || 'SBI MF (15.02%), ICICI Pru (13.25%), HDFC (11.48%)'}
            </div>
            <div className="text-[9.5px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">Top AMCs by AAUM Share ({liveSummary?.amcMarketShare?.asOf || 'Q2 FY2027'})</div>
          </div>
          <div className="mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">
            <span>Source: AMFI Quarterly AAUM Disclosure</span>
            <span>As of {liveSummary?.amcMarketShare?.asOf || asOfDate || 'Q2 FY2027'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
