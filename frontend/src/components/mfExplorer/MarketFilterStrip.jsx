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
    <div className="w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800/80 px-1.5 sm:px-4 py-1.5 sm:py-2.5 flex items-center gap-1.5 sm:gap-2 shadow-2xs overflow-x-auto no-scrollbar scrollbar-none flex-nowrap">
      
      {/* Horizontal Category / Fund Filters - Kept strictly in one single row on mobile with small font */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 py-0.5">
        {MARKET_FILTERS.map(filter => {
          const isActive = filter.id === 'all_funds'
            ? isAllFundsMode
            : filter.id === 'all'
              ? (!isAllFundsMode && (activeFilter === 'all' || !activeFilter))
              : (!isAllFundsMode && activeFilter === filter.id);
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
    </div>
  );
}
