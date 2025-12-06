import axios from 'axios';
import type { Instrument, MarketData } from '@wave-ai/shared';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

/**
 * Map instrument symbols to CoinGecko IDs
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
 * Tool: Get market data for an instrument
 */
export async function getMarketData(instrument: Instrument): Promise<MarketData> {
  const coinId = INSTRUMENT_TO_COINGECKO[instrument];
  
  if (!coinId) {
    throw new Error(`Unsupported instrument: ${instrument}`);
  }

  try {
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
  } catch (error) {
    // Fallback: generate mock data for demo
    console.warn('Market data API failed, using mock data:', error);
    return {
      instrument,
      price: 45000 + Math.random() * 10000,
      priceChange24h: (Math.random() - 0.5) * 2000,
      priceChangePercent24h: (Math.random() - 0.5) * 10,
      volatility: 2 + Math.random() * 5,
      volume24h: 1000000000 + Math.random() * 5000000000,
      timestamp: Date.now(),
    };
  }
}


