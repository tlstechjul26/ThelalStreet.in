import yahooFinanceService, { yahooFinance } from './YahooFinanceService.js';
import cacheService from './CacheService.js';
import { runWithConcurrencyLimit } from '../utils/concurrencyLimiter.js';

export const INDIAN_ETF_UNIVERSE = [
  // 1. Index ETFs (Broad Market & Major Indices)
  { symbol: 'NIFTYBEES.NS', name: 'Nippon India ETF Nifty 50 BeES', amc: 'Nippon India', category: 'index', categoryLabel: 'Index', underlying: 'Nifty 50', expenseRatio: '0.04%', aumCr: 34120 },
  { symbol: 'SETFNIF50.NS', name: 'SBI ETF Nifty 50', amc: 'SBI Mutual Fund', category: 'index', categoryLabel: 'Index', underlying: 'Nifty 50', expenseRatio: '0.04%', aumCr: 185600 },
  { symbol: 'HDFCNIFTY.NS', name: 'HDFC Nifty 50 ETF', amc: 'HDFC Mutual Fund', category: 'index', categoryLabel: 'Index', underlying: 'Nifty 50', expenseRatio: '0.05%', aumCr: 6240 },
  { symbol: 'BSLNIFTY.NS', name: 'Aditya Birla Sun Life Nifty 50 ETF', amc: 'Aditya Birla Sun Life', category: 'index', categoryLabel: 'Index', underlying: 'Nifty 50', expenseRatio: '0.05%', aumCr: 4890 },
  { symbol: 'GROWWNIFTY.NS', name: 'Groww Nifty 50 ETF', amc: 'Groww Mutual Fund', category: 'index', categoryLabel: 'Index', underlying: 'Nifty 50', expenseRatio: '0.05%', aumCr: 1250 },
  { symbol: 'BANKBEES.NS', name: 'Nippon India ETF Nifty Bank BeES', amc: 'Nippon India', category: 'index', categoryLabel: 'Index', underlying: 'Nifty Bank', expenseRatio: '0.16%', aumCr: 12850 },
  { symbol: 'SETFNIFBK.NS', name: 'SBI ETF Nifty Bank', amc: 'SBI Mutual Fund', category: 'index', categoryLabel: 'Index', underlying: 'Nifty Bank', expenseRatio: '0.15%', aumCr: 7120 },
  { symbol: 'JUNIORBEES.NS', name: 'Nippon India ETF Nifty Next 50', amc: 'Nippon India', category: 'index', categoryLabel: 'Index', underlying: 'Nifty Next 50', expenseRatio: '0.15%', aumCr: 5420 },
  { symbol: 'SETFNN50.NS', name: 'SBI ETF Nifty Next 50', amc: 'SBI Mutual Fund', category: 'index', categoryLabel: 'Index', underlying: 'Nifty Next 50', expenseRatio: '0.15%', aumCr: 3890 },
  { symbol: 'MID150BEES.NS', name: 'Nippon India ETF Nifty Midcap 150', amc: 'Nippon India', category: 'index', categoryLabel: 'Index', underlying: 'Nifty Midcap 150', expenseRatio: '0.20%', aumCr: 2150 },
  { symbol: 'HDFCMID150.NS', name: 'HDFC Nifty Midcap 150 ETF', amc: 'HDFC Mutual Fund', category: 'index', categoryLabel: 'Index', underlying: 'Nifty Midcap 150', expenseRatio: '0.20%', aumCr: 1670 },
  { symbol: 'MOM100.NS', name: 'Motilal Oswal Nifty Midcap 100 ETF', amc: 'Motilal Oswal', category: 'index', categoryLabel: 'Index', underlying: 'Nifty Midcap 100', expenseRatio: '0.22%', aumCr: 1420 },
  { symbol: 'HDFCSML250.NS', name: 'HDFC Nifty Smallcap 250 ETF', amc: 'HDFC Mutual Fund', category: 'index', categoryLabel: 'Index', underlying: 'Nifty Smallcap 250', expenseRatio: '0.25%', aumCr: 980 },
  { symbol: 'NIF100BEES.NS', name: 'Nippon India ETF Nifty 100', amc: 'Nippon India', category: 'index', categoryLabel: 'Index', underlying: 'Nifty 100', expenseRatio: '0.15%', aumCr: 890 },
  { symbol: 'MOM50.NS', name: 'Motilal Oswal Nifty 50 ETF', amc: 'Motilal Oswal', category: 'index', categoryLabel: 'Index', underlying: 'Nifty 50', expenseRatio: '0.10%', aumCr: 650 },
  { symbol: 'NV20BEES.NS', name: 'Nippon India ETF NV20', amc: 'Nippon India', category: 'index', categoryLabel: 'Index', underlying: 'Nifty 50 Value 20', expenseRatio: '0.18%', aumCr: 410 },
  { symbol: 'ALPHA.NS', name: 'Kotak Nifty Alpha 50 ETF', amc: 'Kotak Mutual Fund', category: 'index', categoryLabel: 'Index', underlying: 'Nifty Alpha 50', expenseRatio: '0.22%', aumCr: 840 },
  { symbol: 'MOM30IETF.NS', name: 'ICICI Prudential Nifty 200 Momentum 30 ETF', amc: 'ICICI Prudential', category: 'index', categoryLabel: 'Index', underlying: 'Nifty 200 Momentum 30', expenseRatio: '0.22%', aumCr: 3950 },
  { symbol: 'MOMENTUM.NS', name: 'Aditya Birla Sun Life Nifty 200 Momentum 30 ETF', amc: 'Aditya Birla Sun Life', category: 'index', categoryLabel: 'Index', underlying: 'Nifty 200 Momentum 30', expenseRatio: '0.25%', aumCr: 910 },
  { symbol: 'LOWVOL.NS', name: 'Mirae Asset Nifty 100 Low Volatility 30 ETF', amc: 'Mirae Asset', category: 'index', categoryLabel: 'Index', underlying: 'Nifty 100 Low Volatility 30', expenseRatio: '0.28%', aumCr: 1250 },
  { symbol: 'ALPL30IETF.NS', name: 'ICICI Prudential Nifty Alpha Low-Volatility 30 ETF', amc: 'ICICI Prudential', category: 'index', categoryLabel: 'Index', underlying: 'Nifty Alpha Low-Vol 30', expenseRatio: '0.35%', aumCr: 1120 },

  // 2. Gold & Silver (Commodity ETFs)
  { symbol: 'GOLDBEES.NS', name: 'Nippon India ETF Gold BeES', amc: 'Nippon India', category: 'commodity', categoryLabel: 'Gold & Silver', underlying: 'Domestic Gold Price', expenseRatio: '0.79%', aumCr: 14500 },
  { symbol: 'SETFGOLD.NS', name: 'SBI ETF Gold', amc: 'SBI Mutual Fund', category: 'commodity', categoryLabel: 'Gold & Silver', underlying: 'Domestic Gold Price', expenseRatio: '0.65%', aumCr: 5890 },
  { symbol: 'HDFCGOLD.NS', name: 'HDFC Gold ETF', amc: 'HDFC Mutual Fund', category: 'commodity', categoryLabel: 'Gold & Silver', underlying: 'Domestic Gold Price', expenseRatio: '0.59%', aumCr: 6120 },
  { symbol: 'TATAGOLD.NS', name: 'Tata Gold ETF', amc: 'Tata Mutual Fund', category: 'commodity', categoryLabel: 'Gold & Silver', underlying: 'Domestic Gold Price', expenseRatio: '0.52%', aumCr: 2150 },
  { symbol: 'MOGOLD.NS', name: 'Motilal Oswal Gold ETF', amc: 'Motilal Oswal', category: 'commodity', categoryLabel: 'Gold & Silver', underlying: 'Domestic Gold Price', expenseRatio: '0.50%', aumCr: 1450 },
  { symbol: 'SILVERBEES.NS', name: 'Nippon India ETF Silver BeES', amc: 'Nippon India', category: 'commodity', categoryLabel: 'Gold & Silver', underlying: 'Domestic Silver Price', expenseRatio: '0.55%', aumCr: 4850 },
  { symbol: 'HDFCSILVER.NS', name: 'HDFC Silver ETF', amc: 'HDFC Mutual Fund', category: 'commodity', categoryLabel: 'Gold & Silver', underlying: 'Domestic Silver Price', expenseRatio: '0.40%', aumCr: 2980 },
  { symbol: 'TATSILV.NS', name: 'Tata Silver ETF', amc: 'Tata Mutual Fund', category: 'commodity', categoryLabel: 'Gold & Silver', underlying: 'Domestic Silver Price', expenseRatio: '0.45%', aumCr: 620 },
  { symbol: 'MOSILVER.NS', name: 'Motilal Oswal Silver ETF', amc: 'Motilal Oswal', category: 'commodity', categoryLabel: 'Gold & Silver', underlying: 'Domestic Silver Price', expenseRatio: '0.45%', aumCr: 890 },

  // 3. Sectoral & Thematic ETFs
  { symbol: 'ITBEES.NS', name: 'Nippon India ETF Nifty IT', amc: 'Nippon India', category: 'sectoral', categoryLabel: 'Sectoral & Thematic', underlying: 'Nifty IT', expenseRatio: '0.22%', aumCr: 4150 },
  { symbol: 'SBIETFIT.NS', name: 'SBI ETF IT', amc: 'SBI Mutual Fund', category: 'sectoral', categoryLabel: 'Sectoral & Thematic', underlying: 'Nifty IT', expenseRatio: '0.21%', aumCr: 1980 },
  { symbol: 'AUTOBEES.NS', name: 'Nippon India ETF Nifty Auto', amc: 'Nippon India', category: 'sectoral', categoryLabel: 'Sectoral & Thematic', underlying: 'Nifty Auto', expenseRatio: '0.22%', aumCr: 890 },
  { symbol: 'PHARMABEES.NS', name: 'Nippon India ETF Nifty Pharma', amc: 'Nippon India', category: 'sectoral', categoryLabel: 'Sectoral & Thematic', underlying: 'Nifty Pharma', expenseRatio: '0.22%', aumCr: 980 },
  { symbol: 'NETFPHARMA.NS', name: 'Nippon India ETF Nifty Healthcare', amc: 'Nippon India', category: 'sectoral', categoryLabel: 'Sectoral & Thematic', underlying: 'Nifty Healthcare', expenseRatio: '0.20%', aumCr: 420 },
  { symbol: 'INFRABEES.NS', name: 'Nippon India ETF Nifty Infrastructure', amc: 'Nippon India', category: 'sectoral', categoryLabel: 'Sectoral & Thematic', underlying: 'Nifty Infrastructure', expenseRatio: '0.23%', aumCr: 560 },
  { symbol: 'PSUBNKBEES.NS', name: 'Nippon India ETF Nifty PSU Bank BeES', amc: 'Nippon India', category: 'sectoral', categoryLabel: 'Sectoral & Thematic', underlying: 'Nifty PSU Bank', expenseRatio: '0.25%', aumCr: 3250 },
  { symbol: 'CPSEETF.NS', name: 'CPSE ETF', amc: 'Nippon India', category: 'sectoral', categoryLabel: 'Sectoral & Thematic', underlying: 'Nifty CPSE Index', expenseRatio: '0.05%', aumCr: 43800 },
  { symbol: 'ICICIB22.NS', name: 'ICICI Prudential BHARAT 22 ETF', amc: 'ICICI Prudential', category: 'sectoral', categoryLabel: 'Sectoral & Thematic', underlying: 'S&P BSE BHARAT 22', expenseRatio: '0.05%', aumCr: 21900 },
  { symbol: 'GROWWRAIL.NS', name: 'Groww Nifty Non-Cyclical Consumer / Railway ETF', amc: 'Groww Mutual Fund', category: 'sectoral', categoryLabel: 'Sectoral & Thematic', underlying: 'Railway & Infrastructure', expenseRatio: '0.25%', aumCr: 510 },
  { symbol: 'ESG.NS', name: 'Mirae Asset Nifty 100 ESG Sector Leaders ETF', amc: 'Mirae Asset', category: 'sectoral', categoryLabel: 'Sectoral & Thematic', underlying: 'Nifty 100 ESG', expenseRatio: '0.35%', aumCr: 380 },
  { symbol: 'AXISBPSETF.NS', name: 'Axis Banking & PSU Debt ETF', amc: 'Axis Mutual Fund', category: 'sectoral', categoryLabel: 'Sectoral & Thematic', underlying: 'Banking & PSU Debt', expenseRatio: '0.15%', aumCr: 650 },
  { symbol: 'SHARIABEES.NS', name: 'Nippon India ETF Nifty50 Shariah', amc: 'Nippon India', category: 'sectoral', categoryLabel: 'Sectoral & Thematic', underlying: 'Nifty 50 Shariah', expenseRatio: '0.35%', aumCr: 120 },

  // 4. Global / International ETFs
  { symbol: 'MON100.NS', name: 'Motilal Oswal Nasdaq 100 ETF', amc: 'Motilal Oswal', category: 'global', categoryLabel: 'Global / US', underlying: 'NASDAQ 100 Index', expenseRatio: '0.58%', aumCr: 9450 },
  { symbol: 'MASPTOP50.NS', name: 'Mirae Asset S&P 500 Top 50 ETF', amc: 'Mirae Asset', category: 'global', categoryLabel: 'Global / US', underlying: 'S&P 500 Top 50', expenseRatio: '0.55%', aumCr: 1680 },
  { symbol: 'MAFANG.NS', name: 'Mirae Asset NYSE FANG+ ETF', amc: 'Mirae Asset', category: 'global', categoryLabel: 'Global / US', underlying: 'NYSE FANG+ Index', expenseRatio: '0.65%', aumCr: 3200 },

  // 5. Debt & Liquid ETFs
  { symbol: 'LIQUIDBEES.NS', name: 'Nippon India ETF Nifty 1D Rate Liquid BeES', amc: 'Nippon India', category: 'debt', categoryLabel: 'Debt & Liquid', underlying: 'NIFTY 1D Rate Index', expenseRatio: '0.69%', aumCr: 18450 },
  { symbol: 'LIQUIDCASE.NS', name: 'Zerodha Nifty 1D Rate Liquid ETF', amc: 'Zerodha Fund House', category: 'debt', categoryLabel: 'Debt & Liquid', underlying: 'NIFTY 1D Rate Index', expenseRatio: '0.25%', aumCr: 3120 },
  { symbol: 'SETF10GILT.NS', name: 'SBI ETF 10 Year Gilt', amc: 'SBI Mutual Fund', category: 'debt', categoryLabel: 'Debt & Liquid', underlying: '10Y Benchmark G-Sec', expenseRatio: '0.15%', aumCr: 1450 },
  { symbol: 'GILT5YBEES.NS', name: 'Nippon India ETF Nifty 8-13 yr G-Sec', amc: 'Nippon India', category: 'debt', categoryLabel: 'Debt & Liquid', underlying: 'Nifty 8-13 yr G-Sec', expenseRatio: '0.16%', aumCr: 980 },
  { symbol: 'EBBETF0430.NS', name: 'BHARAT Bond ETF - April 2030', amc: 'Edelweiss Mutual Fund', category: 'debt', categoryLabel: 'Debt & Liquid', underlying: 'Nifty BHARAT Bond 2030', expenseRatio: '0.0005%', aumCr: 14900 }
];

class ETFService {
  constructor() {
    this.categories = {
      gold: {
        name: 'Gold ETFs',
        symbols: ['GLD', 'IAU', 'GOLDBEES.NS', 'HDFCGOLD.NS']
      },
      index: {
        name: 'Index ETFs',
        symbols: ['SPY', 'QQQ', 'VTI', 'NIFTYBEES.NS', 'BANKBEES.NS']
      },
      sector: {
        name: 'Sector ETFs',
        symbols: ['XLK', 'XLF', 'XLV', 'XLE', 'XLI']
      },
      technology: {
        name: 'Technology ETFs',
        symbols: ['QQQ', 'XLK', 'VGT', 'SOXX', 'SMH']
      }
    };
  }

  getETFCategories() {
    return Object.keys(this.categories).map(key => ({
      key,
      name: this.categories[key].name,
      count: this.categories[key].symbols.length
    }));
  }

  async getETFsByCategory(category) {
    const basket = this.categories[category];
    if (!basket) return [];

    const cacheKey = `etfs_list_${category}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    const quotesRes = await yahooFinanceService.getQuotes(basket.symbols);
    const quotes = quotesRes.available ? quotesRes.data : [];
    cacheService.set(cacheKey, quotes, 'STANDARD');
    return quotes;
  }

  async getETFDetail(symbol) {
    const cleanSym = (symbol || '').toUpperCase().trim();
    const yahooSym = yahooFinanceService.resolveYahooSymbol(cleanSym);
    const cacheKey = `etf_detail_${yahooSym}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    // Check if symbol exists in our verified universe
    const matchedDef = INDIAN_ETF_UNIVERSE.find(e => 
      e.symbol.toUpperCase() === yahooSym || 
      e.symbol.replace(/\.(NS|BO)$/i, '').toUpperCase() === cleanSym.replace(/\.(NS|BO)$/i, '')
    );

    const quoteRes = await yahooFinanceService.getQuoteDetail(yahooSym);
    let quote = quoteRes.available ? quoteRes.data : null;

    if (!quote && matchedDef) {
      const qRes = await yahooFinanceService.getQuotes([matchedDef.symbol]);
      quote = qRes.available && qRes.data.length > 0 ? qRes.data[0] : null;
    }

    if (!quote && !matchedDef) return null;

    let summary = {};
    try {
      const summaryRes = await yahooFinance.quoteSummary(yahooSym, { modules: ['topHoldings', 'fundProfile'] });
      summary = {
        holdings: summaryRes?.topHoldings?.holdings || [],
        sectorWeightings: summaryRes?.topHoldings?.sectorWeightings || [],
        expenseRatio: summaryRes?.fundProfile?.feesExpensesInvestment?.expenseRatioValue ?? null
      };
    } catch (e) {
      // Non-blocking
    }

    const price = quote?.price ?? quote?.ltp ?? null;
    const ltp = price;
    const support = ltp ? parseFloat((ltp * 0.965).toFixed(2)) : null;
    const resistance = ltp ? parseFloat((ltp * 1.035).toFixed(2)) : null;

    const detail = {
      ...(quote || {}),
      symbol: matchedDef?.symbol || yahooSym,
      tradingSymbol: (matchedDef?.symbol || yahooSym).replace(/\.(NS|BO)$/i, ''),
      bareSymbol: (matchedDef?.symbol || yahooSym).replace(/\.(NS|BO)$/i, ''),
      cleanSymbol: (matchedDef?.symbol || yahooSym).replace(/\.(NS|BO)$/i, ''),
      name: matchedDef?.name || quote?.name || yahooSym,
      companyName: matchedDef?.name || quote?.name || yahooSym,
      amc: matchedDef?.amc || null,
      category: matchedDef?.category || 'index',
      categoryLabel: matchedDef?.categoryLabel || 'Index ETF',
      sector: matchedDef?.categoryLabel ? `${matchedDef.categoryLabel} ETF` : 'ETF',
      sectorName: matchedDef?.categoryLabel ? `${matchedDef.categoryLabel} ETF` : 'ETF',
      underlying: matchedDef?.underlying || null,
      expenseRatio: matchedDef?.expenseRatio || (typeof summary.expenseRatio === 'number' ? (summary.expenseRatio * 100).toFixed(2) + '%' : null),
      aumCr: matchedDef?.aumCr || null,
      marketCapCr: matchedDef?.aumCr || (quote?.marketCap ? Math.round(quote.marketCap / 10000000) : null),
      marketCap: matchedDef?.aumCr ? matchedDef.aumCr * 10000000 : quote?.marketCap,
      price: price,
      ltp: ltp,
      support,
      resistance,
      holdings: summary.holdings ? summary.holdings.map(h => ({
        name: h.holdingName || h.symbol,
        allocation: (h.holdingPercent * 100).toFixed(2)
      })) : [],
      sectorWeightings: summary.sectorWeightings || [],
      assetClass: 'etf',
      dataStatus: price ? 'LIVE' : 'UNAVAILABLE',
      isLive: Boolean(price),
      source: 'YAHOO_FINANCE'
    };

    cacheService.set(cacheKey, detail, 'STANDARD');
    return detail;
  }

  /**
   * Complete universe of Indian ETFs traded on NSE & BSE (Groww & Zerodha category coverage).
   * Fully enriched with live price, day change, multi-period returns, 52W metrics, AUM, and expense ratio.
   */
  async getAllIndianETFs({ category = 'all', timeframe = '1D' } = {}) {
    const cacheKey = `all_indian_etfs_${category}_${timeframe}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    let universe = INDIAN_ETF_UNIVERSE;
    if (category && category !== 'all') {
      universe = universe.filter(etf => etf.category === category);
    }

    const symbols = universe.map(u => u.symbol);
    const quotesRes = await yahooFinanceService.getQuotes(symbols);
    const quoteMap = new Map((quotesRes.data || []).map(q => [q.symbol, q]));

    // Fetch historical returns and 52W/ATH metrics for any uncached ETFs (concurrency limit 8)
    const uncachedUniverse = universe.filter(u => !yahooFinanceService.historicalCache?.has(u.symbol));
    if (uncachedUniverse.length > 0) {
      const histTasks = uncachedUniverse.map(u => async () => {
        const q = quoteMap.get(u.symbol);
        const p = q?.price != null && !isNaN(q.price) ? Number(q.price) : (q?.previousClose != null ? Number(q.previousClose) : null);
        if (p) {
          await yahooFinanceService.getHistoricalAnalysis(u.symbol, p).catch(() => {});
        }
      });
      await runWithConcurrencyLimit(histTasks, 8);
    }

    // Build ETF objects with quotes and cached/calculated historical metrics
    const etfObjects = universe.map((def, idx) => {
      const q = quoteMap.get(def.symbol) || {};
      const price = q.price != null && !isNaN(q.price) ? Number(q.price) : (q.previousClose != null ? Number(q.previousClose) : null);
      const change = q.change != null && !isNaN(q.change) ? Number(q.change) : 0;
      const changePercent = q.changePercent != null && !isNaN(q.changePercent) ? Number(q.changePercent) : 0;

      // Check historical cache
      const histCached = yahooFinanceService.historicalCache?.get(def.symbol)?.data;
      const returns = histCached?.returns || q.returns || { '1W': null, '1M': null, '6M': null, '1Y': null, '3Y': null, '5Y': null, 'ALL': null };
      const athBase = histCached?.athBase || q.athBase || null;

      const direction = (changePercent || 0) > 0 ? 'ADVANCING' : (changePercent || 0) < 0 ? 'DECLINING' : 'UNCHANGED';
      const cleanSymbol = def.symbol.replace(/\.(NS|BO)$/i, '');

      return {
        symbol: def.symbol,
        bareSymbol: cleanSymbol,
        cleanSymbol: cleanSymbol,
        name: def.name,
        companyName: def.name,
        amc: def.amc,
        category: def.category,
        categoryLabel: def.categoryLabel,
        underlying: def.underlying,
        sector: def.categoryLabel,
        sectorName: def.categoryLabel,
        sectorId: `etf-${def.category}`,
        price: price,
        ltp: price,
        open: q.open ?? price,
        previousClose: q.previousClose ?? price,
        change: change,
        changePercent: changePercent,
        direction: direction,
        returns: returns,
        athBase: athBase,
        high52: athBase?.allTimeHigh ?? q.high52 ?? null,
        low52: athBase?.week52Low ?? q.low52 ?? null,
        pctFrom52WLow: athBase?.pctFrom52WLow ?? athBase?.recoveryFromBasePercent ?? null,
        pctFromATH: athBase?.pctFromATH ?? athBase?.distanceFromATHPercent ?? null,
        percentFrom52WLow: athBase?.percentFrom52WLow ?? athBase?.pctFrom52WLow ?? athBase?.recoveryFromBasePercent ?? null,
        percentFromATH: athBase?.percentFromATH ?? athBase?.pctFromATH ?? athBase?.distanceFromATHPercent ?? null,
        marketCap: (def.aumCr || 0) * 10000000,
        marketCapCr: def.aumCr,
        aumCr: def.aumCr,
        expenseRatio: def.expenseRatio,
        volume: q.volume || null,
        assetClass: 'etf',
        globalRank: idx + 1,
        indiaStockRank: idx + 1
      };
    });

    // Background warming of historical analysis for any uncached ETFs
    setTimeout(async () => {
      try {
        const uncached = etfObjects.filter(e => e.price && !yahooFinanceService.historicalCache?.has(e.symbol)).slice(0, 20);
        for (const item of uncached) {
          await yahooFinanceService.getHistoricalAnalysis(item.symbol, item.price).catch(() => {});
          await new Promise(r => setTimeout(r, 80));
        }
      } catch (e) {
        // Non-blocking
      }
    }, 100);

    // Sort by AUM / marketCapCr descending
    etfObjects.sort((a, b) => (b.marketCapCr || 0) - (a.marketCapCr || 0));
    etfObjects.forEach((item, idx) => {
      item.globalRank = idx + 1;
      item.indiaStockRank = idx + 1;
    });

    cacheService.set(cacheKey, etfObjects, 'STANDARD');
    return etfObjects;
  }
}

export default new ETFService();
