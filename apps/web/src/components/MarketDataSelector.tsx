import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Instrument } from '@wave-ai/shared';

// Mock market data - in production this would come from your API
const MOCK_PRICES: Record<Instrument, { price: number; change: number }> = {
  BTC: { price: 97842.50, change: 2.34 },
  ETH: { price: 3891.20, change: -1.12 },
  SOL: { price: 234.67, change: 5.67 },
  AVAX: { price: 45.23, change: -0.89 },
  MATIC: { price: 0.98, change: 3.21 },
};

interface MarketDataSelectorProps {
  instruments: Instrument[];
  selected: Instrument;
  onSelect: (instrument: Instrument) => void;
}

export default function MarketDataSelector({
  instruments,
  selected,
  onSelect,
}: MarketDataSelectorProps) {

  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2">
      <label className="block text-xs uppercase tracking-[0.3em] text-white/50 mb-4 text-center">
        Select Market
      </label>
      
      {/* Full width horizontal scroll */}
      <div 
        className="flex gap-3 overflow-x-auto px-8 py-2 snap-x snap-mandatory"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
        }}
      >
        {/* Left spacer for centering */}
        <div className="flex-shrink-0 w-[calc(50vw-180px)]" />
        
        {instruments.map((instrument) => {
          const data = MOCK_PRICES[instrument];
          const positive = data.change >= 0;
          const isSelected = selected === instrument;
          
          return (
            <button
              key={instrument}
              onClick={() => onSelect(instrument)}
              className={`flex-shrink-0 snap-center relative px-5 py-3 rounded-lg transition-all duration-300 ${
                isSelected 
                  ? 'bg-white/15 border-2 border-white' 
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              {/* Ticker */}
              <div className="text-white font-bold text-lg mb-1">
                {instrument}
              </div>
              
              {/* Price */}
              <div className="text-white/70 text-sm mb-1">
                ${data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              
              {/* Change */}
              <div className={`flex items-center gap-1 text-xs ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{positive ? '+' : ''}{data.change}%</span>
              </div>
            </button>
          );
        })}
        
        {/* Right spacer for centering */}
        <div className="flex-shrink-0 w-[calc(50vw-180px)]" />
      </div>
    </div>
  );
}
