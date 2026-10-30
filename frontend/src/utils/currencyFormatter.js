export const isGlobalSymbol = (symbol) => {
  if (!symbol) return false;
  const sym = String(symbol).toUpperCase().trim();
  // Indian benchmarks
  if (sym.startsWith('^NSE') || sym.startsWith('^BSE') || sym.startsWith('^CRSL') || sym.startsWith('^INDIA') || sym.includes('NIFTY') || sym.includes('SENSEX')) {
    return false;
  }
  // US / Global benchmarks
  if (sym === '^GSPC' || sym === '^IXIC' || sym === '^DJI' || sym === '^FTSE' || sym === '^N225' || sym === 'S&P 500') {
    return true;
  }
  // Indian stocks typically have .NS or .BO suffix, or are 6-digit MF codes
  if (sym.endsWith('.NS') || sym.endsWith('.BO')) return false;
  if (/^\d{5,6}$/.test(sym)) return false; // Indian MF scheme codes
  // Global stocks/ETFs are alphabetic with optional hyphen/dot without Indian exchange suffixes (e.g. AAPL, BRK-B, SPY)
  if (/^[A-Z0-9.-]+$/i.test(sym)) return true;
  return false;
};

export const formatPrice = (price, symbol) => {
  if (price === null || price === undefined) return '—';
  
  const isGlobal = isGlobalSymbol(symbol);
  
  return new Intl.NumberFormat(isGlobal ? 'en-US' : 'en-IN', {
    style: 'currency',
    currency: isGlobal ? 'USD' : 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

export const formatMarketCap = (marketCapVal, symbol) => {
  if (marketCapVal === null || marketCapVal === undefined || isNaN(marketCapVal)) return '—';
  const isGlobal = isGlobalSymbol(symbol);
  const prefix = isGlobal ? '$' : '₹';
  const suffix = isGlobal ? 'B' : ' Cr';
  
  let val = Number(marketCapVal);
  if (!isGlobal && val > 1e8) {
    val = Math.round(val / 10000000);
  }
  
  let formatted = val.toLocaleString(isGlobal ? 'en-US' : 'en-IN');
  return `${prefix}${formatted}${suffix}`;
};
