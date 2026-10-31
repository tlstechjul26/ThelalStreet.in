import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import TrendSparkline from './TrendSparkline';

export default function StockWeightageTable({
  stocks = [],
  pagination = {},
  selectedStockSymbol = null,
  sortBy = 'fundCount',
  sortOrder = 'desc',
  onSort = () => {},
  onSelectStock = () => {},
  onPageChange = () => {},
  onPageSizeChange = () => {},
  loading = false
}) {
  const { currentPage = 1, totalPages = 1, totalStocks = 0, pageSize = 10 } = pagination;
  const startCount = totalStocks > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endCount = Math.min(currentPage * pageSize, totalStocks);

  const renderSortIcon = (columnKey) => {
    if (sortBy === columnKey) {
      return sortOrder === 'asc' 
        ? <ArrowUp size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        : <ArrowDown size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />;
    }
    return <ArrowUpDown size={11} className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />;
  };

  const formatCurrencyCr = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const num = Number(val);
    return `₹ ${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;
  };

  const formatPrice = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  // Generate page numbers with ellipsis matching reference: < 1 2 3 4 5 ... 239 >
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="rounded-2xl border overflow-hidden flex flex-col bg-white dark:bg-[var(--bg-card)] border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all">
      
      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b text-[10.5px] md:text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 select-none">
              <th className="py-2 px-1 md:px-1.5 w-6 min-w-6 max-w-6 md:w-8 md:min-w-8 md:max-w-8 text-center text-slate-400 sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">#</th>
              
              {/* Stock Column */}
              <th 
                onClick={() => onSort('name')}
                className="py-2 px-1.5 md:px-2.5 cursor-pointer group min-w-[80px] max-w-[95px] md:min-w-[125px] md:max-w-none sticky left-6 md:left-8 z-20 bg-slate-50 dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]"
              >
                <div className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <span>Stock</span>
                  {renderSortIcon('name')}
                </div>
              </th>

              {/* Sector Column */}
              <th 
                onClick={() => onSort('sector')}
                className="py-2 md:py-2.5 px-1.5 md:px-2 min-w-[70px] md:min-w-[90px] cursor-pointer group font-semibold"
              >
                <div className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <span>Sector</span>
                  {renderSortIcon('sector')}
                </div>
              </th>

              {/* Number of Funds Holdings Column */}
              <th 
                onClick={() => onSort('fundCount')}
                className="py-2 md:py-2.5 px-1 md:px-2 text-center cursor-pointer group min-w-[75px] md:min-w-[95px]"
                title="Number of Funds Holdings"
              >
                <div className="flex items-center justify-center gap-0.5 text-[#0D6B58] dark:text-emerald-400 font-extrabold hover:opacity-80 transition-opacity">
                  <span className="truncate">Funds Holding</span>
                  {renderSortIcon('fundCount')}
                </div>
              </th>

              {/* MF Universe Weightage Column */}
              <th 
                onClick={() => onSort('universeWeightPct')}
                className="py-2 md:py-2.5 px-1 md:px-2 text-right cursor-pointer group min-w-[70px] md:min-w-[85px]"
                title="MF Universe Weightage"
              >
                <div className="flex items-center justify-end gap-0.5 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <span className="truncate">Universe Wt %</span>
                  {renderSortIcon('universeWeightPct')}
                </div>
              </th>

              {/* Total AUM Exposure Column */}
              <th 
                onClick={() => onSort('holdingValue')}
                className="py-2 md:py-2.5 px-1.5 md:px-2 text-right cursor-pointer group min-w-[75px] md:min-w-[90px]"
                title="Total AUM Exposure"
              >
                <div className="flex items-center justify-end gap-0.5 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <span className="truncate">AUM Exposure</span>
                  {renderSortIcon('holdingValue')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="py-3.5 px-3">
                    <div className="h-5 bg-slate-200/70 dark:bg-slate-800/70 rounded-md w-full" />
                  </td>
                </tr>
              ))
            ) : stocks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-500 dark:text-slate-400 text-xs">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">No stocks found</span>
                    <span className="text-[11px] text-slate-400">Try adjusting your filters or search criteria.</span>
                  </div>
                </td>
              </tr>
            ) : (
              stocks.map((stock) => {
                const isSelected = selectedStockSymbol && 
                  String(selectedStockSymbol).toUpperCase() === String(stock.symbol).toUpperCase();

                const universeWeight = stock.universeWeightPct != null 
                  ? Number(stock.universeWeightPct) 
                  : (stock.mfUniverseWeightage != null ? Number(stock.mfUniverseWeightage) : null);

                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock)}
                    className={`cursor-pointer transition-colors duration-150 select-none group ${
                      isSelected 
                        ? 'bg-[#F0F7FF] dark:bg-blue-950/30 border-l-[3.5px] border-l-[#2563EB]' 
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-l-[3.5px] border-l-transparent'
                    }`}
                  >
                    {/* # Rank */}
                    <td className={`py-1.5 md:py-2 px-1 md:px-1.5 text-center text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 w-6 min-w-6 max-w-6 md:w-8 md:min-w-8 md:max-w-8 sticky left-0 z-10 ${
                      isSelected ? 'bg-[#F0F7FF] dark:bg-blue-950/60' : 'bg-white dark:bg-[var(--bg-card)] group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/40'
                    }`}>
                      {stock.rank}
                    </td>

                    {/* Stock Name and Symbol (Logo removed for compact fit without scrolling) */}
                    <td className={`py-1.5 md:py-2 px-1.5 md:px-2.5 min-w-[80px] max-w-[95px] md:min-w-[125px] md:max-w-none sticky left-6 md:left-8 z-10 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] ${
                      isSelected ? 'bg-[#F0F7FF] dark:bg-blue-950/60' : 'bg-white dark:bg-[var(--bg-card)] group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/40'
                    }`}>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[75px] sm:max-w-[95px] md:max-w-[160px] text-[10.5px] md:text-[11.5px] leading-tight" title={stock.name}>
                          {stock.name}
                        </div>
                        <div className="text-[9px] md:text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 truncate">
                          {stock.symbol}
                        </div>
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="py-1.5 md:py-2 px-1.5 md:px-2 text-slate-700 dark:text-slate-300 font-medium">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] md:text-[10.5px] font-medium bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60 max-w-[85px] md:max-w-[120px] truncate" title={stock.sector}>
                        {stock.sector || 'Diversified'}
                      </span>
                    </td>

                    {/* Number of Funds Holdings */}
                    <td className="py-1.5 md:py-2 px-1 md:px-2 text-center">
                      <div className="inline-flex flex-col items-center leading-tight">
                        <span className="font-extrabold text-[12px] md:text-[13px] text-[#059669] dark:text-emerald-400 leading-tight">
                          {stock.mutualFundsHolding?.toLocaleString('en-IN') || 0}
                        </span>
                        {stock.totalUniverseFunds ? (
                          <span className="text-[8.5px] md:text-[9px] font-medium text-slate-400 dark:text-slate-500 leading-tight">
                            of {stock.totalUniverseFunds}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* MF Universe Weightage */}
                    <td className="py-1.5 md:py-2 px-1 md:px-2 text-right">
                      <div className="flex flex-col items-end justify-center leading-tight">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] md:text-[11.5px] leading-tight">
                          {universeWeight != null ? `${universeWeight.toFixed(2)}%` : '—'}
                        </span>
                        <div className="w-12 md:w-14 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-0.5">
                          <div 
                            className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all" 
                            style={{ width: `${Math.min(100, Math.max(4, (universeWeight || 0) * 20))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Total AUM Exposure */}
                    <td className="py-1.5 md:py-2 px-1.5 md:px-2 text-right font-mono font-bold text-slate-900 dark:text-white text-[11px] md:text-[11.5px]">
                      {formatCurrencyCr(stock.totalAumExposureCr ?? stock.totalHoldingValueCr)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching reference image: Showing 1–10 of 2,384 stocks | < 1 2 3 4 5 ... 239 > | Rows per page: 10 */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[var(--bg-card)]">
        <div>
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{startCount}–{endCount}</span> of <span className="font-semibold text-slate-800 dark:text-slate-200">{totalStocks.toLocaleString('en-IN')}</span> stocks
        </div>

        {/* Page Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || loading}
            className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Previous page"
          >
            <ChevronLeft size={14} />
          </button>

          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1 text-slate-400 select-none">
                  ...
                </span>
              );
            }
            const isActive = currentPage === p;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                disabled={loading}
                className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0D6B58] text-white shadow-xs font-bold'
                    : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || loading}
            className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

    </div>
  );
}
