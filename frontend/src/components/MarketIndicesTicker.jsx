import { useSelector } from 'react-redux';
import { TrendingUp, TrendingDown } from 'lucide-react';

const INDEX_KEYS = [
  { key: 'NIFTY 50', label: 'NIFTY 50' },
  { key: 'NIFTY 100', label: 'NIFTY 100' },
  { key: 'NIFTY NEXT 50', label: 'NIFTY NEXT 50' },
  { key: 'NIFTY 500', label: 'NIFTY 500' },
  { key: 'SENSEX', label: 'SENSEX' },
  { key: 'BANK NIFTY', label: 'BANK NIFTY' },
  { key: 'BSE-150 Midcap', label: 'BSE-150 Midcap' },
  { key: 'BSE-250 SMALLCAP', label: 'BSE-250 SMALLCAP' },
  { key: 'BSE-250 MICROCAP', label: 'BSE-250 MICROCAP' },
  { key: 'NIFTY 150-MIDCAP', label: 'NIFTY 150-MIDCAP' },
  { key: 'NIFTY 250-SMALLCAP', label: 'NIFTY 250-SMALLCAP' }
];

export default function MarketIndicesTicker() {
  const indices = useSelector(state => state.market.indices);
  
  // Build display items from indices object
  const items = INDEX_KEYS.map(({ key, label }) => {
    const idx = indices?.[key];
    if (!idx) return { label, value: '—', change: 0, changePercent: 0 };
    return {
      label,
      value: typeof idx.value === 'number' ? idx.value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—',
      change: idx.change || 0,
      changePercent: idx.changePercent || 0
    };
  });

  const renderItem = (item, i) => (
    <div key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 whitespace-nowrap">
      <span className="font-medium text-[9px] sm:text-[10px]" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
      <span className="text-[9.5px] sm:text-[10.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
      <span className={`inline-flex items-center gap-0.5 text-[8.5px] sm:text-[9.5px] font-medium ${item.changePercent >= 0 ? 'text-gain' : 'text-loss'}`}>
        {item.changePercent >= 0 
          ? <TrendingUp size={8} /> 
          : <TrendingDown size={8} />
        }
        {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
      </span>
    </div>
  );

  return (
    <div className="ticker-scroll-container w-full border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
      <div className="ticker-scroll-content">
        {items.map(renderItem)}
        {/* Duplicate for seamless loop */}
        {items.map((item, i) => renderItem(item, i + items.length))}
      </div>
    </div>
  );
}
