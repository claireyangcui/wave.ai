import { Music, Library } from 'lucide-react';
import type { MarketMoment } from '@wave-ai/shared';

interface SidebarProps {
  moments: MarketMoment[];
  onSelectMoment: (moment: MarketMoment) => void;
}

export default function Sidebar({ moments, onSelectMoment }: SidebarProps) {
  return (
    <div className="w-64 bg-black border-r border-gray-800 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-8 border-2 border-cyan-400 flex items-center justify-center">
            <Music className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">WAVE AI</span>
        </div>

        <nav className="space-y-0">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            Market Areas
          </div>
          <button className="w-full text-left px-0 py-3 border-l-2 border-cyan-400 bg-gray-900/50 text-cyan-300 pl-4">
            Crypto
          </button>
          <button className="w-full text-left px-0 py-3 border-l-2 border-transparent text-gray-400 hover:text-white hover:border-gray-600 pl-4 transition-colors">
            Stocks
          </button>
          <button className="w-full text-left px-0 py-3 border-l-2 border-transparent text-gray-400 hover:text-white hover:border-gray-600 pl-4 transition-colors">
            Forex
          </button>
        </nav>

        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-px h-4 bg-gray-700"></div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Recent Moments
            </span>
          </div>
          <div className="space-y-0 max-h-96 overflow-y-auto">
            {moments.length === 0 ? (
              <div className="text-sm text-gray-500 px-0 py-3 border-l-2 border-transparent pl-4">
                No moments yet
              </div>
            ) : (
              moments.slice(0, 10).map((moment) => (
                <button
                  key={moment.momentId}
                  onClick={() => onSelectMoment(moment)}
                  className="w-full text-left px-0 py-3 border-l-2 border-transparent text-sm hover:bg-gray-900/50 hover:border-cyan-400/30 pl-4 transition-all group"
                >
                  <div className="font-medium text-white group-hover:text-cyan-300 transition-colors">
                    {moment.instrument}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider">
                    {moment.dj.replace('-', ' ')}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

