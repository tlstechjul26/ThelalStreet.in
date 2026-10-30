import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setActiveSector, 
  setActiveSymbol, 
  setRegion, 
  setAssetClass, 
  setActiveView, 
  setHowToUseOpen,
  setIndices
} from '../store/slices/marketSlice';
import { 
  Search, 
  ArrowRight, 
  ArrowUpRight,
  BarChart3, 
  PieChart, 
  SlidersHorizontal, 
  Globe, 
  BookOpen, 
  TrendingUp, 
  TrendingDown,
  Grid3X3, 
  X,
  Layers
} from 'lucide-react';
import axios from 'axios';
import { MF_CATEGORIES, MARKET_FILTERS } from '../config/mutualFundCategories';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Live Market Benchmark definitions
const LIVE_BENCHMARKS = [
  { key: 'NIFTY 50', symbol: '^NSEI', label: 'NIFTY 50', shortLabel: 'NIFTY', market: 'NSE', category: 'Benchmark' },
  { key: 'SENSEX', symbol: '^BSESN', label: 'SENSEX', shortLabel: 'SENSEX', market: 'BSE', category: 'Benchmark' },
  { key: 'BANK NIFTY', symbol: '^NSEBANK', label: 'BANK NIFTY', shortLabel: 'BANK', market: 'NSE', category: 'Banking' },
  { key: 'NIFTY 500', symbol: '^CRSLDX', label: 'NIFTY 500', shortLabel: 'NIF 500', market: 'NSE', category: 'Broad Market' },
  { key: 'S&P 500', symbol: '^GSPC', label: 'S&P 500', shortLabel: 'S&P 500', market: 'US', category: 'Wall Street' },
  { key: 'India VIX', symbol: '^INDIAVIX', label: 'India VIX', shortLabel: 'VIX', market: 'NSE', category: 'Volatility' }
];

const FALLBACK_BENCHMARKS = {
  'NIFTY 50': { value: 23046.25, change: 109.5, changePercent: 0.48 },
  'SENSEX': { value: 74672.44, change: 521.4, changePercent: 0.70 },
  'BANK NIFTY': { value: 54758.75, change: -150.9, changePercent: -0.27 },
  'NIFTY 500': { value: 21906.3, change: -35.2, changePercent: -0.16 },
  'S&P 500': { value: 7720.39, change: -23.59, changePercent: -0.30 },
  'India VIX': { value: 15.51, change: 0.39, changePercent: 2.60 }
};

// Verified Indian Exchange Traded Funds (ETFs) for client-side search lookup
const CLIENT_ETF_UNIVERSE = [
  { symbol: 'HDFCNIFTY.NS', name: 'HDFC Nifty 50 ETF', amc: 'HDFC Mutual Fund', category: 'Index ETF', underlying: 'Nifty 50' },
  { symbol: 'HDFCMID150.NS', name: 'HDFC Nifty Midcap 150 ETF', amc: 'HDFC Mutual Fund', category: 'Index ETF', underlying: 'Nifty Midcap 150' },
  { symbol: 'HDFCSML250.NS', name: 'HDFC Nifty Smallcap 250 ETF', amc: 'HDFC Mutual Fund', category: 'Index ETF', underlying: 'Nifty Smallcap 250' },
  { symbol: 'HDFCGOLD.NS', name: 'HDFC Gold ETF', amc: 'HDFC Mutual Fund', category: 'Gold & Silver', underlying: 'Domestic Gold Price' },
  { symbol: 'HDFCSILVER.NS', name: 'HDFC Silver ETF', amc: 'HDFC Mutual Fund', category: 'Gold & Silver', underlying: 'Domestic Silver Price' },
  { symbol: 'NIFTYBEES.NS', name: 'Nippon India ETF Nifty 50 BeES', amc: 'Nippon India', category: 'Index ETF', underlying: 'Nifty 50' },
  { symbol: 'BANKBEES.NS', name: 'Nippon India ETF Nifty Bank BeES', amc: 'Nippon India', category: 'Banking ETF', underlying: 'Nifty Bank' },
  { symbol: 'GOLDBEES.NS', name: 'Nippon India ETF Gold BeES', amc: 'Nippon India', category: 'Gold & Silver', underlying: 'Domestic Gold Price' },
  { symbol: 'SILVERBEES.NS', name: 'Nippon India ETF Silver BeES', amc: 'Nippon India', category: 'Gold & Silver', underlying: 'Domestic Silver Price' },
  { symbol: 'ITBEES.NS', name: 'Nippon India ETF Nifty IT', amc: 'Nippon India', category: 'Sectoral ETF', underlying: 'Nifty IT' },
  { symbol: 'JUNIORBEES.NS', name: 'Nippon India ETF Nifty Next 50', amc: 'Nippon India', category: 'Index ETF', underlying: 'Nifty Next 50' },
  { symbol: 'MID150BEES.NS', name: 'Nippon India ETF Nifty Midcap 150', amc: 'Nippon India', category: 'Index ETF', underlying: 'Nifty Midcap 150' },
  { symbol: 'CPSEETF.NS', name: 'CPSE ETF', amc: 'Nippon India', category: 'Sectoral ETF', underlying: 'Nifty CPSE Index' },
  { symbol: 'SETFNIF50.NS', name: 'SBI ETF Nifty 50', amc: 'SBI Mutual Fund', category: 'Index ETF', underlying: 'Nifty 50' },
  { symbol: 'SETFNIFBK.NS', name: 'SBI ETF Nifty Bank', amc: 'SBI Mutual Fund', category: 'Banking ETF', underlying: 'Nifty Bank' },
  { symbol: 'SETFGOLD.NS', name: 'SBI ETF Gold', amc: 'SBI Mutual Fund', category: 'Gold & Silver', underlying: 'Domestic Gold Price' },
  { symbol: 'SBIETFIT.NS', name: 'SBI ETF IT', amc: 'SBI Mutual Fund', category: 'Sectoral ETF', underlying: 'Nifty IT' },
  { symbol: 'ICICIB22.NS', name: 'ICICI Prudential BHARAT 22 ETF', amc: 'ICICI Prudential', category: 'Sectoral ETF', underlying: 'S&P BSE BHARAT 22' },
  { symbol: 'ALPHA.NS', name: 'Kotak Nifty Alpha 50 ETF', amc: 'Kotak Mutual Fund', category: 'Smart Beta', underlying: 'Nifty Alpha 50' },
  { symbol: 'MON100.NS', name: 'Motilal Oswal Nasdaq 100 ETF', amc: 'Motilal Oswal', category: 'Global / US', underlying: 'NASDAQ 100 Index' },
  { symbol: 'MASPTOP50.NS', name: 'Mirae Asset S&P 500 Top 50 ETF', amc: 'Mirae Asset', category: 'Global / US', underlying: 'S&P 500 Top 50' },
  { symbol: 'GROWWNIFTY.NS', name: 'Groww Nifty 50 ETF', amc: 'Groww Mutual Fund', category: 'Index ETF', underlying: 'Nifty 50' }
];

export default function LandingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { indices } = useSelector(state => state.market);
  
  const [localQuery, setLocalQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [results, setResults] = useState({ sectors: [], stocks: [], funds: [], subcategories: [], etfs: [] });
  const [searching, setSearching] = useState(false);
  const [searchFilter, setSearchFilter] = useState('all'); // 'all' | 'index' | 'mf' | 'stocks' | 'etf'
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Client-side subcategory matching from verified taxonomy
  const clientSubcategories = useMemo(() => {
    if (!localQuery || localQuery.trim().length < 2) return [];
    const q = localQuery.toLowerCase().trim();
    const matches = [];

    Object.entries(MF_CATEGORIES).forEach(([catKey, subs]) => {
      subs.forEach(sub => {
        if (sub.id === 'all') return;
        const subLabel = sub.label.toLowerCase();
        const subId = sub.id.toLowerCase();
        if (subLabel.includes(q) || q.includes(subLabel) || subId.includes(q)) {
          const marketFilterObj = MARKET_FILTERS.find(m => m.id === catKey);
          matches.push({
            id: sub.id,
            subType: sub.id,
            label: sub.label,
            marketFilter: catKey,
            parentGroup: marketFilterObj?.label || catKey.toUpperCase()
          });
        }
      });
    });

    return matches.slice(0, 6);
  }, [localQuery]);

  const displaySubcategories = useMemo(() => {
    const apiSubs = results.subcategories || [];
    if (apiSubs.length > 0) return apiSubs;
    return clientSubcategories;
  }, [results.subcategories, clientSubcategories]);

  // Client-side ETF matching
  const clientEtfs = useMemo(() => {
    if (!localQuery || localQuery.trim().length < 2) return [];
    const q = localQuery.toLowerCase().trim();
    return CLIENT_ETF_UNIVERSE.filter(e => {
      const sym = e.symbol.toLowerCase();
      const n = e.name.toLowerCase();
      const amc = (e.amc || '').toLowerCase();
      const under = (e.underlying || '').toLowerCase();
      return sym.includes(q) || n.includes(q) || amc.includes(q) || under.includes(q);
    }).slice(0, 8);
  }, [localQuery]);

  const displayEtfs = useMemo(() => {
    const apiEtfs = results.etfs || [];
    if (apiEtfs.length > 0) return apiEtfs;
    return clientEtfs;
  }, [results.etfs, clientEtfs]);

  // Direct live market benchmarks fetching and auto-refresh for LandingPage
  useEffect(() => {
    let isMounted = true;
    const fetchLiveBenchmarks = async () => {
      try {
        const res = await axios.get(`${API_BASE}/market/indices`);
        if (isMounted && res.data && Object.keys(res.data).length > 0) {
          dispatch(setIndices(res.data));
        }
      } catch (err) {
        console.warn('Live benchmarks fetch error:', err.message);
      }
    };
    fetchLiveBenchmarks();
    const timer = setInterval(fetchLiveBenchmarks, 10000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [dispatch]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic querying unified backend search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!localQuery || localQuery.trim().length < 2) {
      setResults({ sectors: [], stocks: [], funds: [], subcategories: [], etfs: [] });
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE}/sectors/search?q=${encodeURIComponent(localQuery.trim())}`);
        setResults({
          sectors: res.data?.sectors || [],
          stocks: res.data?.stocks || [],
          funds: res.data?.funds || [],
          subcategories: res.data?.subcategories || [],
          etfs: res.data?.etfs || []
        });
      } catch (err) {
        console.error('Search error:', err);
      }
      setSearching(false);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [localQuery]);

  // Match market benchmarks for 'Index' search
  const matchingIndices = useMemo(() => {
    if (!localQuery || localQuery.trim().length < 2) return [];
    const q = localQuery.toLowerCase().trim();
    return LIVE_BENCHMARKS.filter(idx => idx.label.toLowerCase().includes(q) || idx.category.toLowerCase().includes(q));
  }, [localQuery]);

  // Filter funds with 'Index' in name
  const indexFunds = useMemo(() => {
    return (results.funds || []).filter(f => {
      const n = (f.name || '').toLowerCase();
      const c = (f.category || f.subLabel || '').toLowerCase();
      return n.includes('index') || n.includes('nifty') || n.includes('sensex') || c.includes('index');
    });
  }, [results.funds]);

  // Filter pure mutual funds (excluding pure ETFs)
  const nonEtfFunds = useMemo(() => {
    return (results.funds || []).filter(f => {
      const n = (f.name || '').toLowerCase();
      return !n.includes('etf') && !n.includes('bees');
    });
  }, [results.funds]);

  // Filter categories based on searchFilter tab
  const filteredSectors = useMemo(() => {
    if (searchFilter === 'stocks' || searchFilter === 'mf' || searchFilter === 'etf') return [];
    return results.sectors || [];
  }, [results.sectors, searchFilter]);

  const filteredStocks = useMemo(() => {
    if (searchFilter === 'index' || searchFilter === 'mf' || searchFilter === 'etf') return [];
    return results.stocks || [];
  }, [results.stocks, searchFilter]);

  const filteredFunds = useMemo(() => {
    if (searchFilter === 'stocks' || searchFilter === 'etf') return [];
    if (searchFilter === 'index') return indexFunds;
    return nonEtfFunds;
  }, [searchFilter, indexFunds, nonEtfFunds]);

  const filteredSubcategories = useMemo(() => {
    if (searchFilter === 'stocks' || searchFilter === 'etf' || searchFilter === 'index') return [];
    return displaySubcategories;
  }, [searchFilter, displaySubcategories]);

  const filteredEtfs = useMemo(() => {
    if (searchFilter === 'stocks' || searchFilter === 'mf' || searchFilter === 'index') return [];
    return displayEtfs;
  }, [searchFilter, displayEtfs]);

  // Match counts for category tabs
  const filterCounts = useMemo(() => {
    const idxCount = matchingIndices.length + (results.sectors?.length || 0) + indexFunds.length;
    const mfCount = nonEtfFunds.length + displaySubcategories.length;
    const stocksCount = (results.stocks?.length || 0);
    const etfCount = displayEtfs.length;
    const allCount = idxCount + mfCount + stocksCount + etfCount;
    return {
      all: allCount,
      index: idxCount,
      mf: mfCount,
      stocks: stocksCount,
      etf: etfCount
    };
  }, [matchingIndices, results.sectors, indexFunds, nonEtfFunds, displaySubcategories, results.stocks, displayEtfs]);

  const SEARCH_FILTER_TABS = useMemo(() => [
    { id: 'all', label: 'All', icon: Search, count: filterCounts.all },
    { id: 'index', label: 'Index', icon: TrendingUp, count: filterCounts.index },
    { id: 'mf', label: 'MF', icon: PieChart, count: filterCounts.mf },
    { id: 'stocks', label: 'Stocks', icon: BarChart3, count: filterCounts.stocks },
    { id: 'etf', label: 'ETF', icon: SlidersHorizontal, count: filterCounts.etf }
  ], [filterCounts]);

  // Benchmark click handler: Opens benchmark with live chart & statistics
  const handleBenchmarkClick = (benchmark) => {
    const isUS = benchmark.market === 'US';
    dispatch(setRegion(isUS ? 'global' : 'india'));
    dispatch(setAssetClass('stocks'));
    dispatch(setActiveSymbol(benchmark.symbol || benchmark.key));
    dispatch(setActiveView('stock-detail'));
    setSearchOpen(false);
    setLocalQuery('');
    navigate(isUS ? '/global-stocks' : '/stocks');
  };

  const handleSectorClick = (sectorId) => {
    dispatch(setActiveSector(sectorId));
    setSearchOpen(false);
    setLocalQuery('');
    navigate('/stocks');
  };

  const handleStockClick = (symbol) => {
    dispatch(setRegion('india'));
    dispatch(setAssetClass('stocks'));
    dispatch(setActiveSymbol(symbol));
    dispatch(setActiveView('stock-detail'));
    setSearchOpen(false);
    setLocalQuery('');
    navigate('/stocks');
  };

  const handleEtfClick = (etf) => {
    dispatch(setRegion('india'));
    dispatch(setAssetClass('stocks'));
    dispatch(setActiveSymbol(etf.symbol));
    dispatch(setActiveView('stock-detail'));
    setSearchOpen(false);
    setLocalQuery('');
    navigate('/stocks');
  };

  const handleSubcategoryClick = (sub) => {
    dispatch(setAssetClass('indian-mf'));
    dispatch(setActiveView('indian-mf'));
    setSearchOpen(false);
    setLocalQuery('');
    navigate(`/mutual-funds?market=${sub.marketFilter || 'all'}&sub=${sub.subType || sub.id || 'all'}`, {
      state: {
        activeMarketFilter: sub.marketFilter || 'all',
        selectedSubCategory: sub.subType || sub.id || 'all'
      }
    });
  };

  const handleFundClick = (fund) => {
    dispatch(setAssetClass('indian-mf'));
    dispatch(setActiveView('indian-mf'));
    setSearchOpen(false);
    setLocalQuery('');
    navigate(`/mutual-funds?q=${encodeURIComponent(fund.name || fund.schemeName)}&schemeCode=${fund.schemeCode || fund.id}`, {
      state: {
        searchQuery: fund.name || fund.schemeName,
        schemeCode: fund.schemeCode || fund.id,
        activeModalFund: fund
      }
    });
  };

  const handleSearchSubmit = () => {
    const q = localQuery.trim();
    if (!q) return;

    if (searchFilter === 'stocks' && filteredStocks.length > 0) {
      handleStockClick(filteredStocks[0].symbol);
      return;
    }
    if (searchFilter === 'etf' && filteredEtfs.length > 0) {
      handleEtfClick(filteredEtfs[0]);
      return;
    }
    if (searchFilter === 'mf') {
      if (filteredSubcategories.length > 0) {
        handleSubcategoryClick(filteredSubcategories[0]);
        return;
      }
      if (filteredFunds.length > 0) {
        handleFundClick(filteredFunds[0]);
        return;
      }
    }
    if (searchFilter === 'index') {
      if (matchingIndices.length > 0) {
        handleBenchmarkClick(matchingIndices[0]);
        return;
      }
      if (filteredSectors.length > 0) {
        handleSectorClick(filteredSectors[0].id);
        return;
      }
      if (filteredFunds.length > 0) {
        handleFundClick(filteredFunds[0]);
        return;
      }
    }

    // Default 'All' selection priority
    if (matchingIndices.length > 0) {
      handleBenchmarkClick(matchingIndices[0]);
      return;
    }
    if (displayEtfs.length > 0) {
      handleEtfClick(displayEtfs[0]);
      return;
    }
    if (displaySubcategories.length > 0) {
      handleSubcategoryClick(displaySubcategories[0]);
      return;
    }
    if (results.funds && results.funds.length > 0 && (!results.stocks || results.stocks.length === 0)) {
      handleFundClick(results.funds[0]);
      return;
    }
    if (results.stocks && results.stocks.length > 0 && (!results.funds || results.funds.length === 0)) {
      handleStockClick(results.stocks[0].symbol);
      return;
    }
    if (results.sectors && results.sectors.length > 0) {
      handleSectorClick(results.sectors[0].id);
      return;
    }
    dispatch(setAssetClass('indian-mf'));
    dispatch(setActiveView('indian-mf'));
    setSearchOpen(false);
    navigate(`/mutual-funds?q=${encodeURIComponent(q)}`, {
      state: { searchQuery: q }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
    }
  };

  const handleNavStocks = () => {
    dispatch(setRegion('india'));
    dispatch(setAssetClass('stocks'));
    dispatch(setActiveSector(null));
    dispatch(setActiveSymbol(null));
    dispatch(setActiveView('heatmap'));
    navigate('/stocks');
  };

  const handleNavMutualFunds = () => {
    dispatch(setAssetClass('indian-mf'));
    dispatch(setActiveSector(null));
    dispatch(setActiveSymbol(null));
    dispatch(setActiveView('indian-mf'));
    navigate('/mutual-funds');
  };

  const handleNavAnalytics = () => {
    dispatch(setAssetClass('analytics'));
    dispatch(setActiveSector(null));
    dispatch(setActiveSymbol(null));
    dispatch(setActiveView('mf-analytics'));
    navigate('/analytics');
  };

  const handleNavGlobalStocks = () => {
    dispatch(setRegion('global'));
    dispatch(setAssetClass('stocks'));
    dispatch(setActiveSector(null));
    dispatch(setActiveSymbol(null));
    dispatch(setActiveView('heatmap'));
    navigate('/global-stocks');
  };

  const quickPills = [
    { label: 'HDFC Bank', action: () => handleStockClick('HDFCBANK.NS') },
    { label: 'Reliance', action: () => handleStockClick('RELIANCE.NS') },
    { label: 'SBI', action: () => handleStockClick('SBIN.NS') },
    { label: 'Sensex', action: () => handleBenchmarkClick(LIVE_BENCHMARKS[1]) },
    { label: 'Nifty 50', action: () => handleBenchmarkClick(LIVE_BENCHMARKS[0]) },
    { label: 'Index Funds', action: handleNavMutualFunds },
  ];

  const hasFilteredResults = 
    filteredStocks.length > 0 ||
    filteredFunds.length > 0 ||
    filteredSubcategories.length > 0 ||
    filteredSectors.length > 0 ||
    filteredEtfs.length > 0 ||
    matchingIndices.length > 0;

  const formatIndexVal = (val, isUS = false, compact = false) => {
    if (!val || isNaN(val)) return '—';
    const num = Number(val);
    const prefix = isUS ? '$' : '₹';
    if (compact) {
      if (Math.abs(num) >= 1000) {
        return prefix + num.toLocaleString(isUS ? 'en-US' : 'en-IN', {
          maximumFractionDigits: 0
        });
      }
      return (num < 100 && !isUS ? '' : prefix) + num.toLocaleString(isUS ? 'en-US' : 'en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    return prefix + num.toLocaleString(isUS ? 'en-US' : 'en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 sm:space-y-16 py-4 sm:py-10 overflow-x-hidden animate-in fade-in duration-300">
      
      {/* ── HERO SECTION ── */}
      <section className="relative text-center max-w-4xl mx-auto px-3 sm:px-4 pt-2 sm:pt-8 space-y-4 sm:space-y-6 overflow-hidden w-full max-w-full">
        {/* Subtle Candlestick Background Silhouette */}
        <div className="absolute inset-0 -top-12 flex items-center justify-center pointer-events-none opacity-20 dark:opacity-15 overflow-hidden" aria-hidden="true">
          <svg className="w-full max-w-3xl h-64 text-blue-500/20 dark:text-cyan-500/20" viewBox="0 0 800 240" fill="none">
            <path d="M40 80v80M40 100h16v40H40zM100 60v100M100 80h16v60H100zM160 40v90M160 50h16v60H160zM220 90v110M220 110h16v70H220zM280 50v100M280 70h16v50H280zM340 30v120M340 50h16v70H340zM400 70v100M400 90h16v60H400zM460 40v110M460 60h16v70H460zM520 80v90M520 100h16v50H520zM580 30v130M580 50h16v80H580zM640 60v100M640 80h16v60H640zM700 40v110M700 60h16v70H700zM760 70v90M760 90h16v50H760z" stroke="currentColor" strokeWidth="2" fill="currentColor" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="font-display font-extrabold text-2xl sm:text-5xl md:text-6xl tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
          Invest Smarter with{' '}
          <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-300 text-transparent bg-clip-text">
            Data &amp; Insights
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-base md:text-xl font-normal max-w-2xl mx-auto px-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Stocks, Mutual Funds, Global Markets and Powerful Analytics — all in one place.
        </p>

        {/* Search Bar Container */}
        <div className="relative max-w-2xl mx-auto pt-2 w-full" ref={searchRef}>
          <div className="relative flex items-center shadow-lg rounded-2xl overflow-hidden border transition-all focus-within:ring-2 focus-within:ring-blue-500/30 w-full" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <Search size={18} className="ml-3 sm:ml-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search stocks, mutual funds, ETFs, sectors..."
              value={localQuery}
              onChange={(e) => { setLocalQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleKeyDown}
              className="w-full min-w-0 px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-base bg-transparent border-none outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            {localQuery && (
              <button onClick={() => { setLocalQuery(''); setSearchOpen(false); }} className="p-1 mr-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={15} />
              </button>
            )}
            <button 
              onClick={handleSearchSubmit}
              className="w-8 h-8 sm:w-10 sm:h-10 mr-1.5 sm:mr-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs cursor-pointer"
              title="Search"
            >
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Autocomplete Search Dropdown */}
          {searchOpen && localQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden shadow-2xl z-50 max-h-96 overflow-y-auto text-left border divide-y divide-[var(--border-color)] w-full max-w-full" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              
              {/* Sticky Filter Bar inside Dropdown */}
              <div className="sticky top-0 z-20 px-2 sm:px-3.5 py-1.5 sm:py-2 border-b flex items-center justify-between gap-1 overflow-x-auto w-full max-w-full" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  {SEARCH_FILTER_TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = searchFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearchFilter(tab.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)]'
                        }`}
                      >
                        <Icon size={11} className={isActive ? 'text-white' : 'text-[var(--text-muted)]'} />
                        <span>{tab.label}</span>
                        {tab.count !== undefined && tab.count > 0 && (
                          <span className={`text-[10px] font-mono px-1 rounded-full ${
                            isActive ? 'bg-blue-700 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {searching && (
                  <div className="text-[11px] flex items-center gap-1 shrink-0 ml-2 text-blue-500">
                    <span className="w-2.5 h-2.5 border-1.5 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Searching...</span>
                  </div>
                )}
              </div>

              {!searching && !hasFilteredResults && (
                <div className="px-4 py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  <div>No matching {searchFilter === 'all' ? 'results' : searchFilter.toUpperCase()} found for "{localQuery}"</div>
                  {searchFilter !== 'all' && (
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); setSearchFilter('all'); }}
                      className="mt-1 text-blue-500 hover:underline font-medium cursor-pointer"
                    >
                      Show All Categories ({filterCounts.all})
                    </button>
                  )}
                </div>
              )}

              {/* 1. Market Indices & Benchmarks */}
              {matchingIndices.length > 0 && (
                <div>
                  <div className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                    <span>Market Indices &amp; Benchmarks ({matchingIndices.length})</span>
                    <span className="text-[9px] font-mono text-emerald-500">Live Chart</span>
                  </div>
                  {matchingIndices.map(idx => (
                    <button
                      key={idx.key}
                      onClick={() => handleBenchmarkClick(idx)}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors hover:bg-[var(--bg-card-hover)] cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <TrendingUp size={15} className="text-emerald-500 shrink-0" />
                      <span className="font-semibold">{idx.label}</span>
                      <span className="text-xs ml-auto font-mono text-[var(--text-muted)]">{idx.market}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 2. Sectors */}
              {filteredSectors.length > 0 && (
                <div>
                  <div className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                    Sectors ({filteredSectors.length})
                  </div>
                  {filteredSectors.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSectorClick(s.id)}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors hover:bg-[var(--bg-card-hover)] cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Grid3X3 size={15} className="text-blue-500 shrink-0" />
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs ml-auto text-[var(--text-muted)]">{s.region === 'india' ? '🇮🇳 NSE' : '🌍 Global'}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 3. Index Mutual Funds (when Index filter active) */}
              {searchFilter === 'index' && indexFunds.length > 0 && (
                <div>
                  <div className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                    <span>Index Mutual Funds ({indexFunds.length})</span>
                    <span className="text-[9px] font-mono lowercase">passive index tracking</span>
                  </div>
                  {indexFunds.map(f => (
                    <button
                      key={f.schemeCode || f.id}
                      onClick={() => handleFundClick(f)}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors hover:bg-[var(--bg-card-hover)] cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <PieChart size={15} className="text-teal-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{f.name}</div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate flex items-center gap-2">
                          <span>{f.amc || f.family}</span>
                          {f.nav != null && <span>• NAV: ₹{Number(f.nav).toFixed(2)}</span>}
                        </div>
                      </div>
                      <span className="text-xs ml-auto shrink-0 font-mono text-[var(--text-muted)]">Index Fund</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 4. Stocks */}
              {filteredStocks.length > 0 && (
                <div>
                  <div className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                    Stocks ({filteredStocks.length})
                  </div>
                  {filteredStocks.slice(0, 8).map(s => (
                    <button
                      key={s.symbol}
                      onClick={() => handleStockClick(s.symbol)}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors hover:bg-[var(--bg-card-hover)] cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <TrendingUp size={15} className="text-cyan-500 shrink-0" />
                      <span className="font-semibold">{s.symbol}</span>
                      <span className="text-xs truncate ml-1 flex-1 text-[var(--text-muted)]">{s.name}</span>
                      <span className="text-xs ml-auto shrink-0 font-mono text-[var(--text-muted)]">{s.sectorName || 'Equity'}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 5. Exchange Traded Funds (ETFs) */}
              {filteredEtfs.length > 0 && (
                <div>
                  <div className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                    <span>Exchange Traded Funds ({filteredEtfs.length})</span>
                    <span className="text-[9px] font-mono text-purple-400">Live Stock Chart</span>
                  </div>
                  {filteredEtfs.slice(0, 8).map(etf => (
                    <button
                      key={etf.symbol}
                      onClick={() => handleEtfClick(etf)}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors hover:bg-[var(--bg-card-hover)] cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <SlidersHorizontal size={15} className="text-purple-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate flex items-center gap-1.5">
                          <span>{etf.symbol}</span>
                          <span className="text-[10px] px-1 rounded-sm bg-purple-500/20 text-purple-400 font-mono">ETF</span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate flex items-center gap-2">
                          <span>{etf.name}</span>
                          {etf.underlying && <span>• Tracks: {etf.underlying}</span>}
                        </div>
                      </div>
                      <span className="text-xs ml-auto shrink-0 font-mono text-[var(--text-muted)]">{etf.category || 'ETF'}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 6. Mutual Fund Subcategories */}
              {filteredSubcategories.length > 0 && (
                <div>
                  <div className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                    <span>Mutual Fund Subcategories</span>
                    <span className="text-[9px] font-mono lowercase">explore category</span>
                  </div>
                  {filteredSubcategories.map(sub => (
                    <button
                      key={`${sub.marketFilter}_${sub.id || sub.label}`}
                      onClick={() => handleSubcategoryClick(sub)}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors hover:bg-[var(--bg-card-hover)] cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Layers size={15} className="text-blue-500 shrink-0" />
                      <span className="font-semibold">{sub.label}</span>
                      <span className="text-xs ml-auto shrink-0 font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                        {sub.parentGroup || sub.marketFilter}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 7. Mutual Funds & Direct Schemes */}
              {filteredFunds.length > 0 && searchFilter !== 'index' && (
                <div>
                  <div className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                    <span>Mutual Funds &amp; Schemes</span>
                    <span className="text-[9px] font-mono lowercase">verified AMFI universe</span>
                  </div>
                  {filteredFunds.slice(0, 8).map(f => (
                    <button
                      key={f.schemeCode || f.id}
                      onClick={() => handleFundClick(f)}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors hover:bg-[var(--bg-card-hover)] cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <PieChart size={15} className="text-emerald-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{f.name}</div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate flex items-center gap-2">
                          <span>{f.amc || f.family}</span>
                          {f.nav != null && <span>• NAV: ₹{Number(f.nav).toFixed(2)}</span>}
                        </div>
                      </div>
                      <span className="text-xs ml-auto shrink-0 font-mono text-[var(--text-muted)]">
                        {f.subLabel || f.parentCategoryLabel || 'Fund'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* Quick Pill Filter Buttons */}
          <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 pt-3 px-1 w-full max-w-full">
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={pill.action}
                className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium border transition-all hover:scale-105 cursor-pointer shrink-0"
                style={{ 
                  background: 'var(--bg-card)', 
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)' 
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE MARKET BENCHMARKS SECTION ── */}
      <section className="px-1.5 sm:px-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <h2 className="text-xs sm:text-sm font-semibold tracking-wide uppercase font-mono" style={{ color: 'var(--text-secondary)' }}>
              Live Market Benchmarks
            </h2>
          </div>
          <span className="text-[11px] font-mono hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
            Click to view chart &amp; performance
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1 sm:gap-3 lg:gap-4 w-full">
          {LIVE_BENCHMARKS.map(item => {
            const rawIdx = indices?.[item.key] 
              || indices?.[item.symbol] 
              || indices?.[item.label] 
              || indices?.[item.shortLabel] 
              || FALLBACK_BENCHMARKS[item.key];
            const valNum = Number(rawIdx?.value ?? rawIdx?.price ?? rawIdx?.ltp ?? 0);
            const chgPct = Number(rawIdx?.changePercent ?? 0);
            const isIdxGain = chgPct >= 0;
            const rawChg = Number(rawIdx?.change ?? (rawIdx?.previousClose && valNum ? (valNum - rawIdx.previousClose) : (valNum * chgPct / 100)));
            const chgPts = Math.abs(rawChg) < 0.0001 ? 0 : rawChg;
            const hasData = Boolean(valNum > 0 || Math.abs(chgPct) > 0 || Math.abs(chgPts) > 0);

            return (
              <div
                key={item.key}
                onClick={() => handleBenchmarkClick(item)}
                className="group rounded-lg sm:rounded-2xl p-1 sm:p-3 lg:p-4 border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col justify-between min-w-0 w-full"
                style={{ 
                  background: 'var(--bg-card)', 
                  borderColor: 'var(--border-color)' 
                }}
                title={`Click to open ${item.label} with live chart`}
              >
                <div className="min-w-0 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-between gap-1 mb-0.5 sm:mb-1">
                    <span className="font-semibold text-[10px] sm:text-xs lg:text-sm truncate group-hover:text-blue-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      <span className="sm:hidden">{item.shortLabel || item.label}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </span>
                    <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                      {item.market}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-[10px] sm:text-base lg:text-lg tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                    {hasData ? (
                      <>
                        <span className="sm:hidden">{formatIndexVal(valNum, item.market === 'US', true)}</span>
                        <span className="hidden sm:inline">{formatIndexVal(valNum, item.market === 'US', false)}</span>
                      </>
                    ) : '—'}
                  </div>
                </div>

                <div className="flex items-center justify-center sm:justify-between pt-0.5 sm:pt-2 lg:pt-2.5 mt-0.5 sm:mt-1.5 lg:mt-2 border-t font-mono min-w-0" style={{ borderColor: 'var(--border-color)' }}>
                  {/* Mobile screen (< 640px): wrapped to ensure points are always visible */}
                  <div className={`sm:hidden flex flex-wrap items-center justify-center gap-x-0.5 font-semibold leading-tight text-[7.5px] w-full text-center ${isIdxGain ? 'text-gain' : 'text-loss'}`}>
                    <span className="inline-flex items-center gap-0.5 shrink-0">
                      {isIdxGain ? <TrendingUp size={7} className="shrink-0" /> : <TrendingDown size={7} className="shrink-0" />}
                      <span>{isIdxGain ? '+' : ''}{chgPct.toFixed(1)}%</span>
                    </span>
                    <span className="font-normal opacity-90 whitespace-nowrap shrink-0">
                      ({chgPts > 0 ? '+' : ''}{Math.abs(chgPts) >= 100 ? chgPts.toFixed(0) : chgPts.toFixed(1)})
                    </span>
                  </div>

                  {/* Tablet & Desktop screen (>= 640px): side-by-side with points on right of %age */}
                  <div className={`hidden sm:inline-flex items-center flex-wrap gap-x-1 font-semibold ${isIdxGain ? 'text-gain' : 'text-loss'} text-[9px] lg:text-[10px] min-w-0 leading-tight`}>
                    <span className="inline-flex items-center gap-0.5 shrink-0">
                      {isIdxGain ? <TrendingUp size={9} className="shrink-0" /> : <TrendingDown size={9} className="shrink-0" />}
                      <span>{isIdxGain ? '+' : ''}{chgPct.toFixed(2)}%</span>
                    </span>
                    <span className="font-normal opacity-90 whitespace-nowrap shrink-0">
                      ({chgPts > 0 ? '+' : ''}{chgPts.toFixed(2)})
                    </span>
                  </div>

                  <span className="text-[9.5px] hidden xl:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 font-sans font-medium shrink-0 ml-auto">
                    Chart <ArrowUpRight size={10} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4 FEATURE NAVIGATION CARDS ── */}
      <section className="px-3 sm:px-4 max-w-full overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5 w-full">
          {/* Card 1: Stocks */}
          <div
            onClick={handleNavStocks}
            className="group relative rounded-xl sm:rounded-2xl p-3 sm:p-6 border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden min-w-0"
            style={{ 
              background: 'var(--bg-card)', 
              borderColor: 'var(--border-color)' 
            }}
          >
            <svg className="absolute right-0 bottom-0 w-20 h-12 sm:w-36 sm:h-20 opacity-10 text-blue-500 group-hover:opacity-20 transition-opacity" viewBox="0 0 100 40" fill="none">
              <path d="M0 35 Q 25 30, 45 15 T 90 8 L 100 12" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>

            <div className="space-y-1.5 sm:space-y-3 relative z-10">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BarChart3 size={18} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm sm:text-xl truncate" style={{ color: 'var(--text-primary)' }}>
                  Stocks
                </h3>
                <p className="text-[11px] sm:text-sm mt-1 sm:mt-1.5 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none" style={{ color: 'var(--text-muted)' }}>
                  Track, analyze and discover Indian stocks with real-time data and insights.
                </p>
              </div>
            </div>

            <div className="pt-2.5 sm:pt-6 flex justify-end relative z-10">
              <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-blue-600/10 group-hover:bg-blue-600 group-hover:text-white text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all duration-200">
                <ArrowRight size={12} className="sm:w-4 sm:h-4" />
              </div>
            </div>
          </div>

          {/* Card 2: Mutual Funds */}
          <div
            onClick={handleNavMutualFunds}
            className="group relative rounded-xl sm:rounded-2xl p-3 sm:p-6 border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden min-w-0"
            style={{ 
              background: 'var(--bg-card)', 
              borderColor: 'var(--border-color)' 
            }}
          >
            <svg className="absolute right-0 bottom-0 w-20 h-12 sm:w-36 sm:h-20 opacity-10 text-emerald-500 group-hover:opacity-20 transition-opacity" viewBox="0 0 100 40" fill="none">
              <path d="M0 38 Q 30 20, 55 25 T 95 6 L 100 10" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>

            <div className="space-y-1.5 sm:space-y-3 relative z-10">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <PieChart size={18} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm sm:text-xl truncate" style={{ color: 'var(--text-primary)' }}>
                  Mutual Funds
                </h3>
                <p className="text-[11px] sm:text-sm mt-1 sm:mt-1.5 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none" style={{ color: 'var(--text-muted)' }}>
                  Explore and compare top mutual funds with detailed analytics.
                </p>
              </div>
            </div>

            <div className="pt-2.5 sm:pt-6 flex justify-end relative z-10">
              <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-emerald-600/10 group-hover:bg-emerald-600 group-hover:text-white text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all duration-200">
                <ArrowRight size={12} className="sm:w-4 sm:h-4" />
              </div>
            </div>
          </div>

          {/* Card 3: Analytics */}
          <div
            onClick={handleNavAnalytics}
            className="group relative rounded-xl sm:rounded-2xl p-3 sm:p-6 border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden min-w-0"
            style={{ 
              background: 'var(--bg-card)', 
              borderColor: 'var(--border-color)' 
            }}
          >
            <svg className="absolute right-0 bottom-0 w-20 h-12 sm:w-36 sm:h-20 opacity-10 text-purple-500 group-hover:opacity-20 transition-opacity" viewBox="0 0 100 40" fill="none">
              <path d="M0 32 Q 25 15, 60 28 T 92 4 L 100 9" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>

            <div className="space-y-1.5 sm:space-y-3 relative z-10">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <SlidersHorizontal size={18} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm sm:text-xl truncate" style={{ color: 'var(--text-primary)' }}>
                  Analytics
                </h3>
                <p className="text-[11px] sm:text-sm mt-1 sm:mt-1.5 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none" style={{ color: 'var(--text-muted)' }}>
                  Deep insights with our Stock Weightage Screener and advanced tools.
                </p>
              </div>
            </div>

            <div className="pt-2.5 sm:pt-6 flex justify-end relative z-10">
              <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-purple-600/10 group-hover:bg-purple-600 group-hover:text-white text-purple-600 dark:text-purple-400 flex items-center justify-center transition-all duration-200">
                <ArrowRight size={12} className="sm:w-4 sm:h-4" />
              </div>
            </div>
          </div>

          {/* Card 4: Global Stocks */}
          <div
            onClick={handleNavGlobalStocks}
            className="group relative rounded-xl sm:rounded-2xl p-3 sm:p-6 border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden min-w-0"
            style={{ 
              background: 'var(--bg-card)', 
              borderColor: 'var(--border-color)' 
            }}
          >
            <svg className="absolute right-0 bottom-0 w-20 h-12 sm:w-36 sm:h-20 opacity-10 text-amber-500 group-hover:opacity-20 transition-opacity" viewBox="0 0 100 40" fill="none">
              <path d="M0 30 Q 35 35, 50 18 T 95 10 L 100 15" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>

            <div className="space-y-1.5 sm:space-y-3 relative z-10">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Globe size={18} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm sm:text-xl truncate" style={{ color: 'var(--text-primary)' }}>
                  Global Stocks
                </h3>
                <p className="text-[11px] sm:text-sm mt-1 sm:mt-1.5 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none" style={{ color: 'var(--text-muted)' }}>
                  Track international markets and global stocks with ease.
                </p>
              </div>
            </div>

            <div className="pt-2.5 sm:pt-6 flex justify-end relative z-10">
              <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-amber-600/10 group-hover:bg-amber-600 group-hover:text-white text-amber-600 dark:text-amber-400 flex items-center justify-center transition-all duration-200">
                <ArrowRight size={12} className="sm:w-4 sm:h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW TO USE CALL-TO-ACTION BANNER ── */}
      <section className="px-3 sm:px-4 max-w-full overflow-hidden">
        <div 
          className="rounded-2xl p-4 sm:p-6 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm w-full min-w-0"
          style={{ 
            background: 'var(--bg-card)', 
            borderColor: 'var(--border-color)' 
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                New to The lal Street?
              </h3>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Learn how to use the platform with our step-by-step guide.
              </p>
            </div>
          </div>

          <button
            onClick={() => { dispatch(setHowToUseOpen(true)); navigate('/how-to-use'); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-xs shrink-0 self-stretch sm:self-auto justify-center cursor-pointer"
          >
            <span>How to Use</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

    </div>
  );
}
