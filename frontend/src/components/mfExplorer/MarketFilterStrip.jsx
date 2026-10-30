import React from 'react';
import { MARKET_FILTERS } from '../../config/mutualFundCategories';

export default function MarketFilterStrip({ 
  activeFilter, 
  onSelectFilter, 
  rankMode = 'aum', 
  onRankModeChange = null,
  isAllFundsMode = false 
}) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800/80 px-1.5 sm:px-4 py-1.5 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 shadow-2xs overflow-x-auto no-scrollbar scrollbar-none flex-nowrap">
      
      {/* Horizontal Market Filters - Kept strictly in one single row on mobile with small font */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 py-0.5">
        <span className="text-[9px] sm:text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider mr-1 sm:mr-2 flex items-center gap-1 shrink-0">
          MARKET FILTER:
        </span>
        {MARKET_FILTERS.map(filter => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => onSelectFilter(filter.id)}
              className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Rank By selector (AUM vs Performance Composite) */}
      {onRankModeChange && (
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="text-[9px] sm:text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider shrink-0">
            RANK BY:
          </span>
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-lg">
            <button
              onClick={() => onRankModeChange('aum')}
              className={`px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-bold rounded transition-colors whitespace-nowrap ${
                rankMode === 'aum'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              AUM ↓
            </button>
            <button
              onClick={() => onRankModeChange('performance')}
              className={`px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-bold rounded transition-colors whitespace-nowrap ${
                rankMode === 'performance'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Performance
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
