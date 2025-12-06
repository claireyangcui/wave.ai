import { useState } from 'react';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import type { Instrument } from '@wave-ai/shared';

// Mock market data - in production this would come from your API
const MOCK_PRICES: Record<Instrument, { price: number; change: number }> = {
  BTC: { price: 97842.50, change: 2.34 },
  ETH: { price: 3891.20, change: -1.12 },
  SOL: { price: 234.67, change: 5.67 },
  AVAX: { price: 45.23, change: -0.89 },
  MATIC: { price: 0.98, change: 3.21 },
};

const INSTRUMENT_COLORS: Record<Instrument, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#00FFA3',
  AVAX: '#E84142',
  MATIC: '#8247E5',
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
  const [isOpen, setIsOpen] = useState(false);
  const currentData = MOCK_PRICES[selected];
  const isPositive = currentData.change >= 0;

  return (
    <div className="relative w-full">
      <label className="block text-xs uppercase tracking-[0.3em] text-white/50 mb-3 text-center">
        Market Data Source
      </label>
      
      {/* Selected Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg hover:bg-white/10 transition-all"
      >
        <div className="flex items-center gap-4">
          {/* Instrument icon/badge */}
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ 
              backgroundColor: `${INSTRUMENT_COLORS[selected]}20`,
              color: INSTRUMENT_COLORS[selected],
              boxShadow: `0 0 20px ${INSTRUMENT_COLORS[selected]}30`
            }}
          >
            {selected}
          </div>
          
          {/* Price info */}
          <div className="text-left">
            <div className="text-white font-semibold text-lg">
              ${currentData.price.toLocaleString()}
            </div>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{isPositive ? '+' : ''}{currentData.change}%</span>
              <span className="text-white/40">24h</span>
            </div>
          </div>
        </div>
        
        <ChevronDown 
          className={`w-5 h-5 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden z-50 shadow-2xl">
            {instruments.map((instrument) => {
              const data = MOCK_PRICES[instrument];
              const positive = data.change >= 0;
              const isSelected = selected === instrument;
              
              return (
                <button
                  key={instrument}
                  onClick={() => {
                    onSelect(instrument);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-6 py-4 transition-all ${
                    isSelected 
                      ? 'bg-white/10' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ 
                      backgroundColor: `${INSTRUMENT_COLORS[instrument]}20`,
                      color: INSTRUMENT_COLORS[instrument]
                    }}
                  >
                    {instrument}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">
                      ${data.price.toLocaleString()}
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{positive ? '+' : ''}{data.change}%</span>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

