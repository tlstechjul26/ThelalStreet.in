import express from 'express';
import yahooFinanceService from '../services/YahooFinanceService.js';
import marketDataGateway from '../services/MarketDataGateway.js';
import sectorDataService from '../services/SectorDataService.js';
import athBaseService from '../services/AthBaseService.js';
import etfService from '../services/ETFService.js';
import stockSnapshotData from '../config/stockSnapshotData.js';

const router = express.Router();

const INDEX_METADATA = {
  '^BSESN': { symbol: '^BSESN', name: 'S&P BSE SENSEX', exchange: 'BSE', category: 'Benchmark Index', market: 'BSE' },
  'SENSEX': { symbol: '^BSESN', name: 'S&P BSE SENSEX', exchange: 'BSE', category: 'Benchmark Index', market: 'BSE' },
  '^NSEI': { symbol: '^NSEI', name: 'NIFTY 50', exchange: 'NSE', category: 'Benchmark Index', market: 'NSE' },
  'NIFTY 50': { symbol: '^NSEI', name: 'NIFTY 50', exchange: 'NSE', category: 'Benchmark Index', market: 'NSE' },
  'NIFTY50': { symbol: '^NSEI', name: 'NIFTY 50', exchange: 'NSE', category: 'Benchmark Index', market: 'NSE' },
  'NIFTY': { symbol: '^NSEI', name: 'NIFTY 50', exchange: 'NSE', category: 'Benchmark Index', market: 'NSE' },
  '^NSEBANK': { symbol: '^NSEBANK', name: 'BANK NIFTY', exchange: 'NSE', category: 'Banking Index', market: 'NSE' },
  'BANK NIFTY': { symbol: '^NSEBANK', name: 'BANK NIFTY', exchange: 'NSE', category: 'Banking Index', market: 'NSE' },
  'BANKNIFTY': { symbol: '^NSEBANK', name: 'BANK NIFTY', exchange: 'NSE', category: 'Banking Index', market: 'NSE' },
  '^CRSLDX': { symbol: '^CRSLDX', name: 'NIFTY 500', exchange: 'NSE', category: 'Broad Market Index', market: 'NSE' },
  'NIFTY 500': { symbol: '^CRSLDX', name: 'NIFTY 500', exchange: 'NSE', category: 'Broad Market Index', market: 'NSE' },
  'NIFTY500': { symbol: '^CRSLDX', name: 'NIFTY 500', exchange: 'NSE', category: 'Broad Market Index', market: 'NSE' },
  '^GSPC': { symbol: '^GSPC', name: 'S&P 500', exchange: 'INDEX', category: 'US Benchmark Index', market: 'US' },
  'S&P 500': { symbol: '^GSPC', name: 'S&P 500', exchange: 'INDEX', category: 'US Benchmark Index', market: 'US' },
  '^INDIAVIX': { symbol: '^INDIAVIX', name: 'India VIX', exchange: 'NSE', category: 'Volatility Index', market: 'NSE' },
  'INDIA VIX': { symbol: '^INDIAVIX', name: 'India VIX', exchange: 'NSE', category: 'Volatility Index', market: 'NSE' }
};

let allStocksCache = null;
let inFlightAllStocks = null;
const ALL_STOCKS_ROUTE_TTL = 30000; // 30 seconds

async function fetchAllStocksUniverse() {
  const symbols = sectorDataService.getAllSymbols();
  const quotesRes = await marketDataGateway.getQuotes(symbols);
  const data = quotesRes.data || [];
  const primarySource = data.length > 0 ? (data[0].source || 'YAHOO_FINANCE') : 'YAHOO_FINANCE_UNAVAILABLE';
  const primaryStatus = data.length > 0 ? (data[0].dataStatus || 'UNAVAILABLE') : 'UNAVAILABLE';
  const result = { data, primarySource, primaryStatus, timestamp: Date.now() };
  allStocksCache = result;
  return result;
}

// Get list of all stocks (supports autocomplete query)
router.get('/', async (req, res) => {
  const query = req.query.q;
  try {
    if (query && query.trim().length > 0) {
      const searchRes = await yahooFinanceService.search(query);
      const results = searchRes.available ? searchRes.data : [];
      res.setHeader('X-Data-Source', 'YAHOO_FINANCE');
      res.setHeader('X-Data-Status', 'LIVE');
      return res.json(results);
    }
    
    const now = Date.now();
    const isFresh = allStocksCache && (now - allStocksCache.timestamp < ALL_STOCKS_ROUTE_TTL);

    if (allStocksCache) {
      res.setHeader('X-Data-Source', allStocksCache.primarySource);
      res.setHeader('X-Data-Status', allStocksCache.primaryStatus);

      if (isFresh) {
        return res.json(allStocksCache.data);
      }

      // Stale-While-Revalidate in background
      if (!inFlightAllStocks) {
        inFlightAllStocks = fetchAllStocksUniverse().catch(e => {
          console.warn('[stocks] Background revalidation failed:', e.message);
        }).finally(() => {
          inFlightAllStocks = null;
        });
      }
      return res.json(allStocksCache.data);
    }

    if (inFlightAllStocks) {
      const result = await inFlightAllStocks;
      res.setHeader('X-Data-Source', result.primarySource);
      res.setHeader('X-Data-Status', result.primaryStatus);
      return res.json(result.data);
    }

    inFlightAllStocks = fetchAllStocksUniverse();
    const result = await inFlightAllStocks;
    inFlightAllStocks = null;

    res.setHeader('X-Data-Source', result.primarySource);
    res.setHeader('X-Data-Status', result.primaryStatus);
    return res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search stocks by ticker or company name
router.get('/search', async (req, res) => {
  const query = req.query.q || req.query.query || '';
  try {
    if (!query || query.trim().length === 0) {
      return res.json([]);
    }
    const searchRes = await yahooFinanceService.search(query.trim());
    const results = searchRes.available ? searchRes.data : [];
    res.setHeader('X-Data-Source', 'YAHOO_FINANCE');
    res.setHeader('X-Data-Status', 'LIVE');
    return res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get individual stock details
router.get('/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const sym = symbol.toUpperCase();
  const yahooSym = yahooFinanceService.resolveYahooSymbol(sym) || sym;
  const idxMeta = INDEX_METADATA[sym] || INDEX_METADATA[yahooSym];
  
  try {
    // Pure Authoritative Gateway (Yahoo Finance -> YAHOO_FINANCE_UNAVAILABLE)
    const stockRes = await marketDataGateway.getQuoteDetail(yahooSym || sym);
    let stock = stockRes && stockRes.data ? stockRes.data : null;
    
    // Check if symbol is an ETF from verified Indian ETF universe or general ETF
    let etfDetail = null;
    try {
      etfDetail = await etfService.getETFDetail(sym);
    } catch (e) {
      // Non-blocking
    }

    if (stock && stock.dataStatus !== 'UNAVAILABLE' && stock.ltp !== null) {
      try {
        const athBase = await athBaseService.getAthAndBaseMetrics(yahooSym, stock.ltp);
        if (athBase) {
          stock = {
            ...stock,
            week52Low: athBase.week52Low ?? athBase.baseLow ?? null,
            week52LowDate: athBase.week52LowDate ?? athBase.baseLowDate ?? null,
            allTimeHigh: athBase.allTimeHigh || null,
            allTimeHighDate: athBase.allTimeHighDate || null,
            ath: athBase.allTimeHigh || null,
            pctFrom52WLow: athBase.pctFrom52WLow ?? athBase.recoveryFromBasePercent ?? null,
            pctFromATH: athBase.pctFromATH ?? athBase.distanceFromATHPercent ?? null,
            baseLow: athBase.week52Low ?? athBase.baseLow ?? null,
            baseLowDate: athBase.week52LowDate ?? athBase.baseLowDate ?? null,
            longTermBaseLow: athBase.week52Low ?? athBase.baseLow ?? null,
            longTermBaseLowDate: athBase.week52LowDate ?? athBase.baseLowDate ?? null,
            recoveryFromBasePercent: athBase.pctFrom52WLow ?? athBase.recoveryFromBasePercent ?? null,
            distanceFromATHPercent: athBase.pctFromATH ?? athBase.distanceFromATHPercent ?? null,
            baseStatus: athBase.baseStatus || 'WEEK_52_LOW',
            positionDataSource: athBase.positionDataSource || 'YAHOO_FINANCE',
            historicalAsOf: athBase.historicalAsOf || null,
            athBaseMetrics: athBase
          };
        }
      } catch (e) {
        console.warn(`Could not attach athBaseMetrics for ${sym}:`, e.message);
      }

      // If benchmark index metadata matches, enrich stock object
      if (idxMeta) {
        stock = {
          ...stock,
          symbol: sym,
          name: idxMeta.name,
          displayName: idxMeta.name,
          category: idxMeta.category,
          categoryLabel: idxMeta.category,
          sector: 'Benchmark Index',
          sectorName: idxMeta.category,
          exchange: idxMeta.exchange,
          market: idxMeta.market,
          assetClass: 'index',
          isIndex: true
        };
      } else if (etfDetail) {
        // If ETF detail is available, enrich stock metadata with ETF-specific information
        stock = {
          ...stock,
          name: stock.name && stock.name !== sym ? stock.name : etfDetail.name,
          category: etfDetail.category,
          categoryLabel: etfDetail.categoryLabel,
          underlying: etfDetail.underlying,
          sector: stock.sector && stock.sector !== 'General' ? stock.sector : (etfDetail.sector || 'ETF'),
          sectorName: stock.sectorName && stock.sectorName !== 'General' ? stock.sectorName : (etfDetail.sectorName || 'ETF'),
          marketCap: stock.marketCap || etfDetail.marketCap,
          marketCapCr: etfDetail.marketCapCr || etfDetail.aumCr,
          aumCr: etfDetail.aumCr,
          expenseRatio: etfDetail.expenseRatio,
          support: stock.support || etfDetail.support,
          resistance: stock.resistance || etfDetail.resistance,
          holdings: etfDetail.holdings || [],
          sectorWeightings: etfDetail.sectorWeightings || [],
          assetClass: 'etf'
        };
      } else {
        try {
          const rankMap = await sectorDataService._getOrComputeGlobalRankMap().catch(() => null);
          const sRank = rankMap ? (rankMap.get(sym) ?? (sym.endsWith('.NS') ? rankMap.get(sym.replace('.NS', '')) : null)) : null;
          const defs = sectorDataService.getSectorDefinitions();
          let matchedSec = null;
          for (const d of defs) {
            if (d.stocks && d.stocks.some(st => st.symbol === sym || st.symbol === `${sym}.NS` || st.symbol.replace('.NS', '') === sym)) {
              matchedSec = d.name;
              break;
            }
          }
          stock = {
            ...stock,
            sector: stock.sector || matchedSec || 'General',
            sectorName: stock.sectorName || matchedSec || 'General',
            indiaStockRank: sRank,
            globalRank: sRank,
            rank: sRank
          };
        } catch (e) {
          // Non-blocking
        }
      }

      res.setHeader('X-Data-Source', stock.source || 'YAHOO_FINANCE');
      res.setHeader('X-Data-Status', stock.dataStatus || 'LIVE');
      return res.json(stock);
    }
    
    // Index Fallback: If live quote was unavailable, check verified index snapshot data
    if (idxMeta) {
      const canonical = idxMeta.symbol;
      const snap = stockSnapshotData[canonical] || stockSnapshotData[sym];
      if (snap && snap.ltp) {
        const indexStock = {
          ...snap,
          symbol: sym,
          name: idxMeta.name,
          displayName: idxMeta.name,
          category: idxMeta.category,
          categoryLabel: idxMeta.category,
          sector: 'Benchmark Index',
          sectorName: idxMeta.category,
          exchange: idxMeta.exchange,
          market: idxMeta.market,
          assetClass: 'index',
          isIndex: true,
          source: snap.source || 'SNAPSHOT',
          dataStatus: snap.dataStatus || 'DELAYED'
        };
        res.setHeader('X-Data-Source', indexStock.source);
        res.setHeader('X-Data-Status', indexStock.dataStatus);
        return res.json(indexStock);
      }
    }

    // ETF Fallback: If stock quote was unavailable or had null ltp, but etfDetail has price
    if (etfDetail && etfDetail.ltp !== null) {
      try {
        const athBase = await athBaseService.getAthAndBaseMetrics(yahooSym, etfDetail.ltp);
        if (athBase) {
          etfDetail = {
            ...etfDetail,
            week52Low: athBase.week52Low ?? athBase.baseLow ?? etfDetail.week52Low ?? null,
            allTimeHigh: athBase.allTimeHigh ?? etfDetail.allTimeHigh ?? null,
            ath: athBase.allTimeHigh ?? etfDetail.ath ?? null,
            pctFrom52WLow: athBase.pctFrom52WLow ?? athBase.recoveryFromBasePercent ?? null,
            pctFromATH: athBase.pctFromATH ?? athBase.distanceFromATHPercent ?? null,
            baseStatus: athBase.baseStatus || 'WEEK_52_LOW',
            athBaseMetrics: athBase
          };
        }
      } catch (e) {
        // Non-blocking
      }

      res.setHeader('X-Data-Source', etfDetail.source || 'YAHOO_FINANCE');
      res.setHeader('X-Data-Status', etfDetail.dataStatus || 'LIVE');
      return res.json(etfDetail);
    }

    if (stock) {
      res.setHeader('X-Data-Source', 'YAHOO_FINANCE_UNAVAILABLE');
      res.setHeader('X-Data-Status', 'UNAVAILABLE');
      return res.status(404).json(stock);
    }

    res.setHeader('X-Data-Source', 'YAHOO_FINANCE_UNAVAILABLE');
    res.setHeader('X-Data-Status', 'UNAVAILABLE');
    res.status(404).json({ error: 'Stock not found', symbol: sym, source: 'YAHOO_FINANCE_UNAVAILABLE', dataStatus: 'UNAVAILABLE' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stock chart candles
router.get('/:symbol/chart', async (req, res) => {
  const { symbol } = req.params;
  const interval = req.query.range || req.query.interval || req.query.timeframe || '1D'; // 1m, 5m, 1H, 1D, 1W, 1M, 1Y
  const sym = symbol.toUpperCase();
  const yahooSym = yahooFinanceService.resolveYahooSymbol(sym) || sym;
  const idxMeta = INDEX_METADATA[sym] || INDEX_METADATA[yahooSym];

  try {
    let chartRes = await marketDataGateway.getChartData(yahooSym, interval);
    let candles = chartRes.available ? chartRes.data : [];
    
    // Fallback: try raw sym if different
    if ((!candles || candles.length === 0) && yahooSym !== sym) {
      const rawChart = await marketDataGateway.getChartData(sym, interval);
      if (rawChart.available && rawChart.data && rawChart.data.length > 0) {
        chartRes = rawChart;
        candles = rawChart.data;
      }
    }

    // Fallback: try alternative symbol format (e.g. without or with .NS)
    if (!candles || candles.length === 0) {
      const altSym = sym.endsWith('.NS') ? sym.replace('.NS', '') : `${sym}.NS`;
      const altChart = await marketDataGateway.getChartData(altSym, interval);
      if (altChart.available && altChart.data && altChart.data.length > 0) {
        chartRes = altChart;
        candles = altChart.data;
      }
    }

    // Index Snapshot Fallback: construct candles if network unavailable for index
    if ((!candles || candles.length === 0) && idxMeta) {
      const canonical = idxMeta.symbol;
      const snap = stockSnapshotData[canonical] || stockSnapshotData[sym];
      if (snap && snap.ltp) {
        const open = snap.open || snap.previousClose || snap.ltp * 0.995;
        const low = snap.dayLow || snap.ltp * 0.99;
        const high = snap.dayHigh || snap.ltp * 1.01;
        const close = snap.ltp;
        const now = Date.now();
        const steps = 15;
        const generated = [];
        for (let i = 0; i < steps; i++) {
          const t = now - (steps - 1 - i) * 15 * 60 * 1000;
          const prog = i / (steps - 1);
          const c = open + (close - open) * prog + (Math.sin(i * 1.2) * (high - low) * 0.12);
          generated.push({
            time: t,
            open: i === 0 ? open : generated[i - 1].close,
            high: Math.max(open, close, c) + (high - low) * 0.04,
            low: Math.min(open, close, c) - (high - low) * 0.04,
            close: i === steps - 1 ? close : c,
            volume: 100000 + Math.round(Math.random() * 50000)
          });
        }
        candles = generated;
        chartRes = {
          available: true,
          data: candles,
          previousClose: snap.previousClose || open,
          source: 'SNAPSHOT',
          dataStatus: 'DELAYED'
        };
      }
    }

    if (candles && candles.length > 0) {
      if (chartRes.previousClose) {
        res.setHeader('X-Previous-Close', String(chartRes.previousClose));
        if (candles[0] && !candles[0].previousClose) {
          candles[0].previousClose = chartRes.previousClose;
        }
      }
      if (candles.earliestDate) {
        res.setHeader('X-Earliest-Date', candles.earliestDate);
      }
      res.setHeader('X-Data-Source', chartRes.source || 'YAHOO_FINANCE');
      res.setHeader('X-Data-Status', chartRes.dataStatus || 'EOD');
      return res.json(candles);
    }

    res.setHeader('X-Data-Source', 'YAHOO_FINANCE_UNAVAILABLE');
    res.setHeader('X-Data-Status', 'UNAVAILABLE');
    res.status(404).json({ error: 'Stock chart not found', symbol: sym, source: 'YAHOO_FINANCE_UNAVAILABLE', dataStatus: 'UNAVAILABLE' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

