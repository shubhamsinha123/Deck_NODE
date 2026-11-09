/* eslint-disable */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Stock = require('../models/Stock');

const NSE_CSV_URL = 'https://archives.nseindia.com/content/equities/EQUITY_L.csv';
const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'nse_stocks.json');

class NseDirectoryService {
  constructor() {
    this.cachedList = null;
  }

  /**
   * Helper to parse CSV lines safely considering quotes
   */
  parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Intelligently infer sector from company name keywords
   */
  inferSector(name, symbol) {
    const lower = `${name} ${symbol}`.toLowerCase();
    if (/bank|financial|finance|capital|investment|insurance|housing|fin|securities|wealth/.test(lower)) {
      return 'Financial Services';
    }
    if (/infotech|technolog|software|digital|systems|solution|cyber|data|telecom|telecommunication|network/.test(lower)) {
      return 'Information Technology';
    }
    if (/pharma|health|biotech|medical|diagnostic|lifescience|care|hospital|lab|therapeutics/.test(lower)) {
      return 'Healthcare & Pharmaceuticals';
    }
    if (/motor|auto|tyre|wheel|vehicles|battery|engine|ev|forging|chassis/.test(lower)) {
      return 'Automobile & Ancillaries';
    }
    if (/petroleum|oil|gas|energy|power|solar|wind|refin|hydro|green/.test(lower)) {
      return 'Energy & Power';
    }
    if (/steel|metal|copper|zinc|aluminum|mining|mineral|ore|iron|ferro/.test(lower)) {
      return 'Metals & Mining';
    }
    if (/consumer|food|dairy|sugar|brewer|tea|coffee|beverage|fmcg|tobacco|distiller|agro|atta|edible/.test(lower)) {
      return 'Fast Moving Consumer Goods';
    }
    if (/realty|infra|construct|cement|build|project|pipes|estate|properties|developer/.test(lower)) {
      return 'Infrastructure & Real Estate';
    }
    if (/media|entertain|cable|broadcast|multiplex|film|tv|news|publish/.test(lower)) {
      return 'Media & Entertainment';
    }
    if (/chem|fertilizer|petrochem|pesticide|speciality|polymers|pigments/.test(lower)) {
      return 'Chemicals & Fertilizers';
    }
    if (/textile|apparels|garments|cotton|silk|spinning|fabrics|yarn|denim/.test(lower)) {
      return 'Textiles & Apparels';
    }
    return 'Diversified';
  }

  /**
   * Load local official NSE stock master file
   */
  loadLocalStocks() {
    if (this.cachedList && this.cachedList.length > 0) {
      return this.cachedList;
    }

    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        const list = JSON.parse(raw);
        this.cachedList = list;
        return list;
      }
    } catch (e) {
      console.warn('[NseDirectory] Failed to read local nse_stocks.json:', e.message);
    }
    return [];
  }

  /**
   * Fetch fresh master list from official NSE archives and update local copy
   */
  async refreshFromNse() {
    try {
      const response = await axios.get(NSE_CSV_URL, {
        timeout: 10000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      const lines = response.data.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length > 100) {
        const parsed = [];
        for (let i = 1; i < lines.length; i += 1) {
          const parts = this.parseCsvLine(lines[i]);
          if (parts.length >= 7) {
            const sym = parts[0].toUpperCase();
            const companyName = parts[1];
            const series = parts[2] || 'EQ';
            const listingDate = parts[3] || '';
            const isin = parts[6] || '';

            parsed.push({
              symbol: `${sym}.NS`,
              clean_symbol: sym,
              company_name: companyName,
              series,
              exchange: 'NSE',
              sector: this.inferSector(companyName, sym),
              market_cap_category: 'LARGE',
              listing_date: listingDate,
              isin,
            });
          }
        }

        if (parsed.length > 500) {
          const dir = path.dirname(DATA_FILE_PATH);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(parsed, null, 2));
          this.cachedList = parsed;
          console.log(`[NseDirectory] Refreshed ${parsed.length} NSE equities from official portal.`);
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`[NseDirectory] Live NSE refresh skipped (${e.message}). Using local master.`);
    }

    return this.loadLocalStocks();
  }

  /**
   * Look up a stock by symbol across all 2600+ NSE stocks
   */
  findStockBySymbol(symbol) {
    const clean = symbol.replace(/\.(NS|BO)$/i, '').toUpperCase().trim();
    const list = this.loadLocalStocks();
    return list.find((s) => s.clean_symbol === clean || s.symbol === `${clean}.NS`);
  }

  /**
   * Bulk sync all 2600+ NSE stocks into MongoDB collection
   */
  async syncAllNseStocksToDatabase() {
    const list = this.loadLocalStocks();
    if (!list || list.length === 0) return { count: 0 };

    console.log(`[NseDirectory] Bulk seeding ${list.length} NSE equities into MongoDB...`);

    const chunkSize = 400;
    let totalUpserted = 0;

    for (let i = 0; i < list.length; i += chunkSize) {
      const chunk = list.slice(i, i + chunkSize);
      const ops = chunk.map((s) => ({
        updateOne: {
          filter: { _id: s.symbol },
          update: {
            $setOnInsert: {
              _id: s.symbol,
              symbol: s.symbol,
              exchange: 'NSE',
              sector: s.sector || this.inferSector(s.company_name, s.clean_symbol),
              market_cap_category: s.market_cap_category || 'MID',
              current_price: 0,
              day_change: 0,
              day_change_percent: 0,
              volume: 0,
              delivery_percent: 50,
              fifty_two_week: { high: 0, low: 0 },
              fundamentals: {
                pe_ratio: 0,
                industry_pe: 25,
                pb_ratio: 0,
                roe: 0,
                roce: 0,
                debt_to_equity: 0.5,
                promoter_holding: 50,
                promoter_pledged: 0,
                fii_holding: 15,
                dii_holding: 15,
              },
              technicals: {
                rsi_14: 50,
                macd: { signal: 'NEUTRAL', histogram: 0 },
                dma_50: 0,
                dma_200: 0,
                pivot_levels: { p: 0, r1: 0, s1: 0 },
              },
              latest_ai_verdict: {
                verdict: 'PENDING',
                composite_score: 0,
                confidence_score: 0,
                summary: 'AI analysis pending on-demand hydration.',
                updated_at: new Date(),
              },
              last_updated: new Date(),
            },
            $set: {
              company_name: s.company_name,
              series: s.series,
              isin: s.isin,
              listing_date: s.listing_date,
            },
          },
          upsert: true,
        },
      }));

      try {
        await Stock.bulkWrite(ops, { ordered: false });
        totalUpserted += chunk.length;
      } catch (err) {
        console.warn(`[NseDirectory] Bulk write warning at chunk ${i}: ${err.message}`);
      }
    }

    console.log(`[NseDirectory] Completed syncing ${totalUpserted} NSE stocks to MongoDB.`);
    return { count: totalUpserted };
  }
}

module.exports = new NseDirectoryService();

