import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scale, 
  Database, 
  ShieldCheck, 
  Activity, 
  Star, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  ArrowLeft, 
  FileText, 
  AlertTriangle,
  Lock,
  ExternalLink
} from 'lucide-react';

export default function TermsOfUsePage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-200 text-slate-900 dark:text-slate-100">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { navigate('/documentation'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <FileText size={14} />
            <span>View Calculations Documentation</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Effective: 2026
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="rounded-3xl p-6 sm:p-10 border shadow-sm relative overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Official User Agreement &amp; Governance
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                The Lal Street Wealth Managers Pvt. Ltd.
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display text-slate-900 dark:text-white">
              Terms of Use
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              These Terms of Use govern your access to and use of The Lal Street platform, quantitative analytical engines, 
              market data screeners, and calculation metrics. Please review them carefully.
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
            <Scale size={36} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="space-y-6">
        
        {/* 1. Authoritative Data Sources */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Database size={18} className="text-slate-500 dark:text-slate-400" />
            <span>1. Authoritative Data Sources</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The Lal Street aggregates quantitative financial figures strictly from authoritative public, exchange, and statutory institutional repositories:
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-5">
            <li>
              <strong className="font-bold text-slate-900 dark:text-white">Yahoo Finance / Exchange Gateway:</strong> Real-time and delayed equities quotes, intraday trades, volume, and market capitalization for 12,536 listed Indian equities across NSE and BSE.
            </li>
            <li>
              <strong className="font-bold text-slate-900 dark:text-white">AMFI (Association of Mutual Funds in India):</strong> Authoritative daily Net Asset Values (NAVs) across 2,743 active direct-growth mutual fund schemes.
            </li>
            <li>
              <strong className="font-bold text-slate-900 dark:text-white">FinAPI (Upvaly) &amp; AMC Portfolios:</strong> Statutory monthly portfolio disclosures covering underlying stock positions, sovereign debt holdings, and cash allocations across 43 AMCs.
            </li>
            <li>
              <strong className="font-bold text-slate-900 dark:text-white">BSE &amp; Corporate Regulatory Filings:</strong> Quarterly corporate financial statements (Revenue, Operating Margin, EBIT, Net Profit, and EPS).
            </li>
            <li>
              <strong className="font-bold text-slate-900 dark:text-white">Reserve Bank of India (RBI):</strong> Benchmark 91-Day Treasury Bill yields used as the verified risk-free benchmark (<code className="text-xs font-mono text-slate-900 dark:text-white">Rf</code>) for Sharpe &amp; Sortino calculations.
            </li>
          </ul>
        </div>

        {/* 2. Terms & Non-Advisory Nature */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <ShieldCheck size={18} className="text-slate-500 dark:text-slate-400" />
            <span>2. Terms &amp; Non-Advisory Nature</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The Lal Street operates exclusively as an educational, quantitative analytical, and market intelligence platform.
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-5">
            <li>
              <strong className="font-bold text-slate-900 dark:text-white">Zero Investment Advice:</strong> Nothing on this platform constitutes an endorsement, solicitation, or recommendation to buy, sell, or hold any security, derivative, or mutual fund unit. The platform does not provide personalized portfolio advisory services.
            </li>
            <li>
              <strong className="font-bold text-slate-900 dark:text-white">Zero-Fabrication Standard:</strong> The Lal Street adheres to a strict engineering zero-fabrication standard. We never fabricate synthetic quotes, placeholder earnings, or simulated NAVs. If data is unavailable from the official issuer or exchange, it is strictly displayed as <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-900 dark:text-white">—</code>.
            </li>
            <li>
              <strong className="font-bold text-slate-900 dark:text-white">Market Latency:</strong> Free equity price feeds carry standard exchange latency (typically 15-minute delayed). Official mutual fund NAVs are updated daily following AMFI publication.
            </li>
            <li>
              <strong className="font-bold text-slate-900 dark:text-white">SEBI Regulatory Notice:</strong> Users must conduct independent due diligence or consult a SEBI-registered Investment Advisor before committing capital.
            </li>
          </ul>
        </div>

        {/* 3. Rankings of Stocks */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Activity size={18} className="text-slate-500 dark:text-slate-400" />
            <span>3. Rankings of Stocks (Terms)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Every listed equity is assigned a canonical <strong className="font-bold text-slate-900 dark:text-white">India Stock Rank (#1 to #12,536)</strong> determined purely by full Market Capitalization in descending order.
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            This ranking is purely descriptive of company valuation size. It is <strong className="font-bold text-slate-900 dark:text-white">NOT</strong> a quality score, safety rating, or buy recommendation. Filters and table sorting never alter a stock&apos;s assigned national rank.
          </p>
        </div>

        {/* 4. Star Marking of Mutual Funds */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Star size={18} className="text-slate-500 dark:text-slate-400" />
            <span>4. Star Marking of Mutual Funds (Terms)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Stars (⭐) in The Lal Street are awarded purely on a deterministic mathematical formula across verified historical periods:
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            A fund must simultaneously rank in the <strong className="font-bold text-slate-900 dark:text-white">Top 10 in 5-Year CAGR</strong> and the <strong className="font-bold text-slate-900 dark:text-white">Top 10 in Since-Inception CAGR</strong>, with the highest AUM schemes receiving the star. Stars are not commercial endorsements or sponsored badges.
          </p>
        </div>

        {/* 5. 52W High / Low % Method */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <TrendingUp size={18} className="text-slate-500 dark:text-slate-400" />
            <span>5. 52W H/L % Method (Terms)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Measures relative price position within the 52-week trailing window:
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5">
            <li>
              <strong className="font-bold text-slate-900 dark:text-white">Recovery from 52W Low %:</strong> Percentage gain from the 52-week low. Always &ge; 0.00%. Formula: <code className="text-xs font-mono text-slate-900 dark:text-white font-semibold">((Current Price - 52W Low) ÷ 52W Low) × 100</code>.
            </li>
            <li>
              <strong className="font-bold text-slate-900 dark:text-white">Drawdown from ATH %:</strong> Percentage distance below the lifetime All-Time High. Always &le; 0.00%. Formula: <code className="text-xs font-mono text-slate-900 dark:text-white font-semibold">((Current Price - ATH) ÷ ATH) × 100</code>.
            </li>
          </ul>
        </div>

        {/* 6. Stock Weightage Screener */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <PieChartIcon size={18} className="text-slate-500 dark:text-slate-400" />
            <span>6. Stock Weightage Screener (Terms)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Aggregates institutional ownership across mutual funds from the perspective of each individual stock.
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Restricted exclusively to <strong className="font-bold text-slate-900 dark:text-white">Direct Plan &amp; Growth Option</strong> schemes in 5 target active equity categories (Large Cap, Mid Cap, Small Cap, Contra, Value) to eliminate IDCW duplication and broker trail distortion.
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Holdings data reflect periodic statutory AMC disclosures and are strictly for historical institutional research.
          </p>
        </div>

        {/* 7. Platform Agreement & Intellectual Property */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Lock size={18} className="text-slate-500 dark:text-slate-400" />
            <span>7. Platform Agreement &amp; Intellectual Property</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            By accessing or using The Lal Street, you acknowledge and agree that:
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5">
            <li>
              All proprietary ranking formulations, analytics workflows, layout engines, and visual interfaces are protected intellectual property of <strong className="font-bold text-slate-900 dark:text-white">The Lal Street Wealth Managers Pvt. Ltd.</strong>
            </li>
            <li>
              Users may not engage in automated scraping, unauthorized extraction, bulk harvesting, or commercial redistribution of platform data without explicit prior written authorization.
            </li>
            <li>
              The Lal Street disclaims all implied warranties of merchantability, fitness for a particular investment objective, or uninterrupted service uptime. In no event shall The Lal Street be liable for direct, indirect, incidental, or consequential investment losses resulting from trading decisions made using platform information.
            </li>
          </ul>
        </div>

      </div>

      {/* Footer Return Controls */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Return to Dashboard</span>
        </button>

        <button
          onClick={() => { navigate('/documentation'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <FileText size={14} />
          <span>Open Calculations Documentation (3 Modules)</span>
        </button>
      </div>

    </div>
  );
}
