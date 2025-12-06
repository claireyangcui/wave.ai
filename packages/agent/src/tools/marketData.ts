import axios from 'axios';
import type { Instrument, MarketData } from '@wave-ai/shared';

/**
 * SpoonOS Data Service URL
 * The Python SpoonOS service provides market data via REST API
 */
const SPOONOS_SERVICE_URL = process.env.SPOONOS_URL || 'http://localhost:3002';

/**
 * CoinGecko API as fallback
 */
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

/**
 * Map instrument symbols to CoinGecko IDs (for fallback)
 */
const INSTRUMENT_TO_COINGECKO: Record<Instrument, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
};

/**
 * Calculate volatility from price history
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * 100; // Return as percentage
}

/**
 * Fetch market data from SpoonOS service
 */
async function getSpoonOSMarketData(instrument: Instrument): Promise<MarketData | null> {
  try {
    console.log(`🥄 Fetching ${instrument} data from SpoonOS...`);
    const response = await axios.get(`${SPOONOS_SERVICE_URL}/market-data/${instrument}`, {
      timeout: 5000, // 5 second timeout
    });
    
    const data = response.data;
    console.log(`✅ SpoonOS returned data (source: ${data.source})`);
    
    return {
      instrument,
      price: data.price,
      priceChange24h: data.priceChange24h,
      priceChangePercent24h: data.priceChangePercent24h,
      volatility: data.volatility,
      volume24h: data.volume24h,
      timestamp: data.timestamp,
    };
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.warn('⚠️  SpoonOS service not running, falling back to CoinGecko');
    } else {
      console.warn('⚠️  SpoonOS request failed:', error.message);
    }
    return null;
  }
}

/**
 * Fetch market data from CoinGecko (fallback)
 */
async function getCoinGeckoMarketData(instrument: Instrument): Promise<MarketData> {
  const coinId = INSTRUMENT_TO_COINGECKO[instrument];
  
  // Fetch current price and 24h stats
  const response = await axios.get(
    `${COINGECKO_API}/simple/price`,
    {
      params: {
        ids: coinId,
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_24hr_vol: true,
      },
    }
  );

  const data = response.data[coinId];
  const price = data.usd;
  const priceChange24h = data.usd_24h_change || 0;
  const volume24h = data.usd_24h_vol || 0;

  // Fetch price history for volatility calculation (last 7 days)
  let volatility = Math.abs(priceChange24h); // Fallback to 24h change as proxy
  
  try {
    const historyResponse = await axios.get(
      `${COINGECKO_API}/coins/${coinId}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days: 7,
          interval: 'daily',
        },
      }
    );
    
    const prices = historyResponse.data.prices.map((p: [number, number]) => p[1]);
    volatility = calculateVolatility(prices);
  } catch (err) {
    console.warn('Could not fetch price history for volatility, using fallback');
  }

  return {
    instrument,
    price,
    priceChange24h: (priceChange24h / 100) * price, // Convert % to absolute
    priceChangePercent24h: priceChange24h,
    volatility: Math.max(0, volatility),
    volume24h,
    timestamp: Date.now(),
  };
}

/**
 * Generate mock data for demo purposes
 */
function getMockMarketData(instrument: Instrument): MarketData {
  const basePrices: Record<string, number> = {
    BTC: 97000,
    ETH: 3500,
    SOL: 180,
    AVAX: 35,
    MATIC: 0.85,
  };
  
  const basePrice = basePrices[instrument] || 100;
  const priceChange = (Math.random() - 0.5) * 10;
  
  return {
    instrument,
    price: basePrice * (1 + (Math.random() - 0.5) * 0.04),
    priceChange24h: basePrice * (priceChange / 100),
    priceChangePercent24h: priceChange,
    volatility: 2 + Math.random() * 5,
    volume24h: 1000000000 + Math.random() * 5000000000,
    timestamp: Date.now(),
  };
}

/**
 * Tool: Get market data for an instrument
 * 
 * Data source priority:
 * 1. SpoonOS service (if running)
 * 2. CoinGecko API (fallback)
 * 3. Mock data (if all else fails)
 */
export async function getMarketData(instrument: Instrument): Promise<MarketData> {
  const coinId = INSTRUMENT_TO_COINGECKO[instrument];
  
  if (!coinId) {
    throw new Error(`Unsupported instrument: ${instrument}`);
  }

  // Try SpoonOS first
  const spoonOSData = await getSpoonOSMarketData(instrument);
  if (spoonOSData) {
    return spoonOSData;
  }

  // Fallback to CoinGecko
  try {
    console.log(`📊 Fetching ${instrument} data from CoinGecko...`);
    return await getCoinGeckoMarketData(instrument);
  } catch (error) {
    // Final fallback: mock data
    console.warn('⚠️  All market data sources failed, using mock data');
    return getMockMarketData(instrument);
  }
}


