import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  ShieldCheck, 
  FileText, 
  ArrowLeft, 
  Search, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  BarChart2, 
  Star, 
  PieChart as PieChartIcon, 
  Info, 
  Copy, 
  Check, 
  Layers, 
  Building2,
  Database,
  Scale,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function DocumentationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFormula, setCopiedFormula] = useState(null);

  useEffect(() => {
    const rawHash = (location.hash || window.location.hash || '').replace('#', '');
    if (rawHash === 'terms-of-use') {
      navigate('/terms-of-use');
      return;
    }
    if (rawHash) {
      setActiveSection(rawHash);
      const timer = setTimeout(() => {
        const element = document.getElementById(rawHash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.hash, navigate]);

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedFormula(key);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-200 text-slate-900 dark:text-slate-100">
      
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Zero-Fabrication Standard (SEBI &amp; AMFI Aligned)
          </span>
          <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Version 3.2.0
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div 
        className="rounded-3xl p-6 sm:p-10 border shadow-sm relative overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Official Engineering &amp; Methodology Guide
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Platform: The Lal Street
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display text-slate-900 dark:text-white">
              Platform Documentation &amp; Data Guide
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Complete reference manual covering verified market data provenance, institutional ranking engines, 
              mathematical calculation formulas, risk ratio definitions, and the Stock Weightage Screener.
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
            <BookOpen size={36} />
          </div>
        </div>

        {/* Quick Jump Pills */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
            Calculations:
          </span>
          {[
            { id: 'stocks-calculations', label: '1. Stocks Data Calculations', icon: TrendingUp },
            { id: 'mutual-funds-calculations', label: '2. Mutual Funds Calculations', icon: BarChart2 },
            { id: 'stock-weightage-screener', label: '3. Stock Weightage Screener', icon: PieChartIcon },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Icon size={13} className="text-slate-500 dark:text-slate-400" />
              <span>{label}</span>
            </button>
          ))}

          <button
            onClick={() => { navigate('/terms-of-use'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all cursor-pointer sm:ml-auto"
            title="Open separate Terms of Use page"
          >
            <Scale size={13} />
            <span>Terms of Use (Separate Page) &rarr;</span>
          </button>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* SECTION 1: STOCKS DATA CALCULATIONS */}
      {/* ========================================================================================= */}
      <section id="stocks-calculations" className="scroll-mt-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              1. Stocks Data Calculations
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              National market cap ranking methodology, financial statement equations, and 52W High/Low formulas
            </p>
          </div>
        </div>

        {/* About Stocks Page */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Info size={16} className="text-slate-500 dark:text-slate-400" />
            <span>About the Stocks Module</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The Lal Street Stocks Module tracks <strong className="font-bold text-slate-900 dark:text-white">12,536 listed Indian equities</strong> across both the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE), categorized into 30 standardized economic sectors (e.g., Nifty Bank, Nifty IT, Nifty Automobile, Nifty FMCG). It delivers real-time market data, interactive TradingView charts, quarterly financial statements, and multi-factor valuation screeners.
          </p>
        </div>

        {/* Ranking Method Explained with Concrete Example */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              National Market Cap Model
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
              India Stock Rank Methodology (<code className="text-xs font-mono text-slate-900 dark:text-white">indiaStockRank</code>)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Every listed company is assigned a single, permanent numerical rank from #1 to #12,536 based strictly on full Market Capitalization descending.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">1. Scope &amp; Order</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Sorted strictly by <strong className="font-bold text-slate-900 dark:text-white">Market Cap DESC</strong>. Dual-listed NSE/BSE securities (e.g. RELIANCE.NS &amp; 500325) are deduplicated into a single canonical entry.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">2. Filter Invariance</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Filtering by sector (e.g. Nifty Bank) <strong className="font-bold text-slate-900 dark:text-white">never renumbers ranks</strong>. HDFC Bank stays #3 nationally, ICICI Bank stays #4, and SBI stays #5.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">3. Deterministic Ties</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                If two companies possess identical market caps, ties are broken deterministically by alphabetical symbol ASC.
              </p>
            </div>
          </div>

          {/* Concrete Ranking Example Table */}
          <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-100/70 dark:bg-slate-800/70 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white">
              Concrete Example: Top 5 National Ranks
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-3">National Rank</th>
                    <th className="py-2 px-3">Company Name</th>
                    <th className="py-2 px-3">NSE Ticker</th>
                    <th className="py-2 px-3">Market Cap (₹ Cr)</th>
                    <th className="py-2 px-3">SEBI Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#1</td>
                    <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white">Reliance Industries Ltd.</td>
                    <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-medium">RELIANCE</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">₹ 19,42,850 Cr</td>
                    <td className="py-2 px-3 font-sans"><span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-700">Large Cap</span></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#2</td>
                    <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white">Tata Consultancy Services Ltd.</td>
                    <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-medium">TCS</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">₹ 14,28,400 Cr</td>
                    <td className="py-2 px-3 font-sans"><span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-700">Large Cap</span></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#3</td>
                    <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white">HDFC Bank Ltd.</td>
                    <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-medium">HDFCBANK</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">₹ 12,85,620 Cr</td>
                    <td className="py-2 px-3 font-sans"><span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-700">Large Cap</span></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#4</td>
                    <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white">ICICI Bank Ltd.</td>
                    <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-medium">ICICIBANK</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">₹ 8,92,300 Cr</td>
                    <td className="py-2 px-3 font-sans"><span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-700">Large Cap</span></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#5</td>
                    <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white">State Bank of India</td>
                    <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-medium">SBIN</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">₹ 7,65,400 Cr</td>
                    <td className="py-2 px-3 font-sans"><span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-700">Large Cap</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Core Mathematical Formulas for Stocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Market Cap */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Valuation</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Market Capitalization (₹ Cr)</h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200/60 dark:border-slate-700">
              Market Cap (₹ Cr) = (Current Share Price × Total Outstanding Shares) ÷ 10,000,000
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              1 Crore = 10,000,000 INR. Outstanding share count is ingested directly from official exchange registrar records.
            </p>
          </div>

          {/* Day Change */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Price Action</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Day Change (₹) &amp; Day Change %</h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200/60 dark:border-slate-700">
              Day Change % = ((Current LTP − Previous Close) ÷ Previous Close) × 100
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              Previous Close is the official closing price from 3:30 PM IST on the preceding trading session.
            </p>
          </div>

          {/* Operating Profit (EBIT) & Banking Rule */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Profitability</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Reported Operating Profit (EBIT in ₹ Cr)</h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200/60 dark:border-slate-700">
              EBIT (₹ Cr) = (Reported TTM Revenue × TTM Operating Margin) ÷ 10,000,000
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              <strong className="font-bold text-slate-900 dark:text-white">The Financial Institutions Rule:</strong> Commercial Banks, NBFCs, and insurance firms evaluate EBIT to <code className="font-mono text-xs text-slate-900 dark:text-white">—</code> because interest expense is a cost of raw inventory under Ind AS/IFRS.
            </p>
          </div>

          {/* Same-Quarter YoY Growth */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Corporate Growth</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Quarterly Revenue &amp; Net Profit YoY %</h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200/60 dark:border-slate-700">
              YoY % = ((Current Qtr Metric − Same Qtr Last Year) ÷ |Same Qtr Last Year|) × 100
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              <strong className="font-bold text-slate-900 dark:text-white">The Same-Quarter Rule:</strong> Compares Q1 FY27 with Q1 FY26 (never sequential QoQ), preventing false seasonality distortion.
            </p>
          </div>

        </div>

        {/* 52W High/Low Method (Detailed Explanation & Examples) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              52-Week Range &amp; ATH Metrics
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
              52-Week Recovery % &amp; ATH Drawdown % Methods
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Calculates where the stock stands relative to its 1-year boundaries (52-week low/high) and its lifetime peak (All-Time High).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 52W Low Recovery Formula */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">52-Week Recovery %</span>
                <span className="text-[10px] font-mono text-slate-400">Boundary: ≥ 0.00%</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200 dark:border-slate-700">
                Recovery from 52W Low % = ((Current Price − 52W Low) ÷ 52W Low) × 100
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong className="font-bold text-slate-900 dark:text-white">Example:</strong> If a stock has a Current Price of ₹1,500 and a 52-Week Low of ₹1,200:
              </p>
              <div className="font-mono text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/70 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
                ((1,500 − 1,200) ÷ 1,200) × 100 = <strong className="font-bold text-slate-900 dark:text-white">+25.00%</strong>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Meaning: The stock has rebounded 25% from its cheapest level in the past 52 weeks.
              </p>
            </div>

            {/* ATH Drawdown Formula */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">All-Time High (ATH) Drawdown %</span>
                <span className="text-[10px] font-mono text-slate-400">Boundary: ≤ 0.00%</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200 dark:border-slate-700">
                Drawdown from ATH % = ((Current Price − All-Time High) ÷ All-Time High) × 100
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong className="font-bold text-slate-900 dark:text-white">Example:</strong> If a stock has a Current Price of ₹1,500 and an All-Time High of ₹1,800:
              </p>
              <div className="font-mono text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/70 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
                ((1,500 − 1,800) ÷ 1,800) × 100 = <strong className="font-bold text-slate-900 dark:text-white">-16.67%</strong>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Meaning: The stock is currently trading 16.67% below its historical peak price.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================================= */}
      {/* SECTION 2: MUTUAL FUNDS DATA CALCULATIONS */}
      {/* ========================================================================================= */}
      <section id="mutual-funds-calculations" className="scroll-mt-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <BarChart2 size={20} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              2. Mutual Funds Data Calculations
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Institutional AUM ranking hierarchy, multi-period CAGR, RBI-aligned Sharpe &amp; Sortino ratios, and Star Mark algorithm
            </p>
          </div>
        </div>

        {/* About Mutual Funds */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Info size={16} className="text-slate-500 dark:text-slate-400" />
            <span>About the Mutual Funds Explorer</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The Lal Street tracks <strong className="font-bold text-slate-900 dark:text-white">2,743 active Direct-Growth mutual fund schemes</strong> across 43 Asset Management Companies (AMCs) in India. All funds strictly adhere to the <strong className="font-bold text-slate-900 dark:text-white">Direct Plan &amp; Growth Option</strong> universe. Direct plans eliminate distributor trail commissions, while Growth options eliminate IDCW dividend tax distortions, ensuring genuine apples-to-apples performance comparisons.
          </p>
        </div>

        {/* Mutual Funds Ranking Method */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              Institutional AUM Hierarchy &amp; Composite Scoring
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
              Multi-Tier Ranking Hierarchy
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">1. Global AUM Rank (<code className="font-mono text-xs text-slate-900 dark:text-white">indiaMfRank</code>)</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ranks all 2,743 schemes nationally from #1 to #N purely by total Assets Under Management (AUM) in descending order. Parag Parikh Flexi Cap, HDFC Top 100, and SBI Bluechip occupy the top national ranks.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">2. Subcategory AUM Rank (<code className="font-mono text-xs text-slate-900 dark:text-white">indiaMfSubcategoryRank</code>)</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Independently starts at #1 for each subcategory by AUM. For example, in Flexi Cap, Parag Parikh is #1 and HDFC Flexi Cap is #2. In Small Cap, Nippon India Small Cap is #1.
              </p>
            </div>
          </div>

          {/* Composite Scoring Model */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">3. Deterministic Composite Scoring Model</span>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200 dark:border-slate-700">
              Ranking Score = (normSinceInceptionCAGR × 0.45) + (normRiskAdjustedScore × 0.35) + (norm1YReturn × 0.20)
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Where <code className="font-mono text-slate-900 dark:text-white">normRiskAdjustedScore = 0.5 × normSharpe + 0.5 × normSortino</code>. Normalization occurs strictly within each peer subcategory using min-max scaling [0, 1]: <code className="font-mono text-slate-900 dark:text-white">minMaxNormalize(val, min, max) = (val − min) ÷ (max − min)</code>.
            </p>
          </div>
        </div>

        {/* Data Calculations: CAGR, Sharpe, Sortino */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Compound Annual Growth Rate (CAGR) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Long-Term Returns</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Compound Annual Growth Rate (CAGR)</h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200/60 dark:border-slate-700">
              CAGR = (NAV_end ÷ NAV_start)^(1 ÷ T) − 1
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              Applied for horizons &ge; 1 year (3Y, 5Y, and Inception). T = (Exact Calendar Days / 365.25). Horizons &lt; 1 year (1D, 1W, 1M, 3M, 6M) use absolute simple point-to-point percentage changes.
            </p>
          </div>

          {/* Sharpe Ratio */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Volatility Risk</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sharpe Ratio (3-Year Monthly)</h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200/60 dark:border-slate-700">
              Sharpe = ((Mean Monthly Return − Rf_monthly) ÷ Total Monthly StdDev) × √12
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              Uses 36 monthly returns from &ge; 37 month-end NAV observations. Rf is aligned with the verified RBI 91-Day T-Bill rate (~6.50%). Penalizes all volatility (both upward and downward).
            </p>
          </div>

          {/* Sortino Ratio */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Downside Risk Focus</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sortino Ratio &amp; Downside Deviation</h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200/60 dark:border-slate-700">
              Sortino = ((Mean Monthly Return − Rf_monthly) ÷ Downside Deviation) × √12
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              Downside Deviation = SquareRoot((1/N) × ∑ min(Ri − Rf, 0)²) × √12. Penalizes <strong className="font-bold text-slate-900 dark:text-white">only negative downside returns</strong> below the RBI T-Bill rate. Upward volatility is never penalized.
            </p>
          </div>

          {/* Net Asset Value (NAV) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Per-Unit Price</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Net Asset Value (NAV) &amp; Daily Delta</h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200/60 dark:border-slate-700">
              NAV Delta = NAV_today − NAV_yesterday
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              Official daily market valuation published by AMFI after market close. Delta shows the absolute rupee and percentage change from the preceding business session.
            </p>
          </div>

        </div>

        {/* Star Mark Method and Formula */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              The 3-Way Star Qualification Algorithm
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
              <Star size={18} className="text-slate-500 dark:text-slate-400" />
              <span>Mutual Fund Star Mark Method &amp; Formula</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              How The Lal Street objectively qualifies and assigns a star (⭐) to top mutual funds.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="font-mono text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold">
              Star Criteria = Top 10 (5Y CAGR) ∩ Top 10 (Since Inception CAGR) ──&gt; Top 3 by AUM (DESC)
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px] border border-slate-300 dark:border-slate-700">1</span>
                <div>
                  <strong className="font-bold text-slate-900 dark:text-white">Step 1 — 5-Year CAGR Horizon:</strong> Filters all schemes in the subcategory with verified 5-year returns and ranks them descending to identify the <strong className="font-bold text-slate-900 dark:text-white">Top 10 funds in 5Y performance</strong>.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px] border border-slate-300 dark:border-slate-700">2</span>
                <div>
                  <strong className="font-bold text-slate-900 dark:text-white">Step 2 — Since-Inception CAGR Horizon:</strong> Independently filters all schemes in the subcategory with verified lifetime returns and identifies the <strong className="font-bold text-slate-900 dark:text-white">Top 10 funds in Since Inception performance</strong>.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px] border border-slate-300 dark:border-slate-700">3</span>
                <div>
                  <strong className="font-bold text-slate-900 dark:text-white">Step 3 — Mathematical Intersection:</strong> Identifies the intersection of common funds present in <strong className="font-bold text-slate-900 dark:text-white">BOTH Top 10 lists</strong>.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px] border border-slate-300 dark:border-slate-700">4</span>
                <div>
                  <strong className="font-bold text-slate-900 dark:text-white">Step 4 — AUM Sort &amp; Star Award:</strong> Common funds are sorted by Assets Under Management (AUM) in descending order. The <strong className="font-bold text-slate-900 dark:text-white">Top 3 largest AUM funds</strong> receive the permanent <span className="font-bold text-slate-900 dark:text-white">⭐ Star Mark</span>.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px] border border-slate-300 dark:border-slate-700">5</span>
                <div>
                  <strong className="font-bold text-slate-900 dark:text-white">Fallback Rule:</strong> If fewer than 3 funds appear in both top 10 lists, the remaining slots are filled from the Top 10 5Y list by AUM descending until 3 stars are awarded.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================================= */}
      {/* SECTION 3: STOCKS WEIGHTAGE SCREENER CALCULATIONS */}
      {/* ========================================================================================= */}
      <section id="stock-weightage-screener" className="scroll-mt-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <PieChartIcon size={20} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              3. Stocks Weightage Screener Calculations
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Institutional ownership aggregation, bi-directional relational analytics, and mathematical invariants
            </p>
          </div>
        </div>

        {/* About the Screener in Brief */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Info size={16} className="text-slate-500 dark:text-slate-400" />
            <span>About the Stock Weightage Screener</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Traditional tools only let investors inspect a single fund at a time. The <strong className="font-bold text-slate-900 dark:text-white">Stock Weightage Screener</strong> inverts mutual fund analysis to evaluate the market from the <strong className="font-bold text-slate-900 dark:text-white">STOCK&apos;s perspective</strong>:
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc pl-4">
            <li>Reveals exactly which equities are held by the highest number of mutual fund schemes.</li>
            <li>Aggregates the total institutional rupee value (₹ Cr) deployed by fund managers into each individual stock.</li>
            <li>Calculates the average, maximum, and minimum portfolio weightings assigned to the stock.</li>
            <li>Restricted strictly to the <strong className="font-bold text-slate-900 dark:text-white">5 target active equity categories</strong> (Large Cap, Mid Cap, Small Cap, Contra, Value) in <strong className="font-bold text-slate-900 dark:text-white">Direct-Growth</strong> plans.</li>
          </ul>
        </div>

        {/* Sorting and Ranking Method */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
            Institutional Consensus Model
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Sorting &amp; Ranking Methodology
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The screener establishes a multi-parameter ranking pipeline:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Default Rank: Funds Count</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Primary ranking sorts equities by <strong className="font-bold text-slate-900 dark:text-white">Funds Holding Count (Ni) DESC</strong>. The most widely held stock (e.g. HDFC Bank, ICICI Bank) appears at #1.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Multi-Column Sorting</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Users can re-sort by <strong className="font-bold text-slate-900 dark:text-white">Average Weightage %</strong>, <strong className="font-bold text-slate-900 dark:text-white">Total Holding Value (₹ Cr)</strong>, or <strong className="font-bold text-slate-900 dark:text-white">Fund AUM Exposure</strong>.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Search &amp; Sector Filters</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Filtering by sector or searching for a ticker filters rows instantly without modifying mathematical aggregations.
              </p>
            </div>
          </div>
        </div>

        {/* Screener Mathematical Formulas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Funds Holding Count */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Institutional Consensus</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Funds Holding Count (Ni)</h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200/60 dark:border-slate-700">
              N_i = ∑ (1) for all qualifying schemes holding stock i
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              Distinct count of qualifying Direct-Growth mutual fund schemes reporting a non-zero position in stock i.
            </p>
          </div>

          {/* Average Weightage */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Portfolio Allocation</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Average Weightage % (Avg Weight)</h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200/60 dark:border-slate-700">
              Avg Weightage % = (1 ÷ N_i) × ∑ (Weightage_i,j)
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              Arithmetic mean of portfolio weightages among <strong className="font-bold text-slate-900 dark:text-white">only those funds that actually hold the stock</strong>. Never diluted by non-holding schemes.
            </p>
          </div>

          {/* Aggregate Holding Value */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Institutional Capital</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Total Holding Value (₹ Cr)</h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200/60 dark:border-slate-700">
              Total Holding Value (₹ Cr) = ∑ (Market Value of Stock i in Fund j)
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              Combined rupee market value in ₹ Crores of stock i held across all reporting qualifying mutual funds.
            </p>
          </div>

          {/* Fund AUM Exposure */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Capital Pool Size</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Fund AUM Exposure (₹ Cr)</h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl font-mono text-xs text-slate-900 dark:text-white font-semibold border border-slate-200/60 dark:border-slate-700">
              Fund AUM Exposure (₹ Cr) = ∑ (Total Scheme AUM_j)
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              Sum of the total AUM of all mutual funds that hold the stock, representing the total institutional capital pool managing direct exposure.
            </p>
          </div>

        </div>

        {/* Sum of Percentages Prohibition Callout */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wide">
            <AlertTriangle size={16} className="text-slate-500 dark:text-slate-400" />
            <span>Strict Mathematical Invariant: Prohibition on Summing Percentages</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The Lal Street <strong className="underline font-bold text-slate-900 dark:text-white">NEVER</strong> sums fund-level weight percentages across different mutual funds to fabricate a &quot;total percentage&quot;. 
            A fund allocation of 8% in Fund A and 7% in Fund B does <strong className="underline font-bold text-slate-900 dark:text-white">NOT</strong> mean mutual funds hold &quot;15% of the stock&quot;. 
            It means Fund A allocates 8% of its portfolio and Fund B allocates 7% of its portfolio, producing an average weightage of 7.50% and specific rupee holding values.
          </p>
        </div>
      </section>

      {/* Footer Back Button */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Return to Dashboard</span>
        </button>

        <span className="text-xs text-slate-400 font-mono">
          The Lal Street Documentation • Authoritative Source: Data Guide &amp; Methodology v3.2.0
        </span>
      </div>

    </div>
  );
}
