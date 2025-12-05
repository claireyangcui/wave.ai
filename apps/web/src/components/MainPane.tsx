import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { Instrument, DJPreset, MarketMoment } from '@wave-ai/shared';
import { api } from '../lib/api';
import DJCard from './DJCard';
import InstrumentPicker from './InstrumentPicker';
import LoadingSpinner from './LoadingSpinner';
import { toast } from './Toast';

const INSTRUMENTS: Instrument[] = ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC'];
const DJ_PRESETS: DJPreset[] = ['neon-house', 'lo-fi-drift', 'industrial-tech'];

interface MainPaneProps {
  onMomentGenerated: (moment: MarketMoment) => void;
}

export default function MainPane({ onMomentGenerated }: MainPaneProps) {
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>('BTC');
  const [selectedDJ, setSelectedDJ] = useState<DJPreset>('neon-house');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const moment = await api.generate({
        instrument: selectedInstrument,
        djPreset: selectedDJ,
      });
      onMomentGenerated(moment);
      toast.success('Market moment generated!');
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate moment');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-black">
      <div className="max-w-6xl mx-auto p-12">
        <div className="mb-16 border-b border-gray-800 pb-8">
          <h1 className="text-6xl font-bold mb-3 text-white tracking-tight">
            MARKET<br />SONIFICATION
          </h1>
          <div className="w-24 h-px bg-cyan-400 mt-4"></div>
          <p className="text-gray-500 text-sm uppercase tracking-widest mt-6">
            Transform live market data into unique music loops
          </p>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-px h-6 bg-gray-700"></div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
              Select Instrument
            </h2>
          </div>
          <InstrumentPicker
            instruments={INSTRUMENTS}
            selected={selectedInstrument}
            onSelect={setSelectedInstrument}
          />
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-px h-6 bg-gray-700"></div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
              Choose Your DJ
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-gray-800">
            {DJ_PRESETS.map((preset, index) => (
              <div key={preset} className={index < DJ_PRESETS.length - 1 ? 'border-r border-gray-800' : ''}>
                <DJCard
                  preset={preset}
                  selected={selectedDJ === preset}
                  onSelect={() => setSelectedDJ(preset)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full md:w-auto px-12 py-4 bg-cyan-400 text-black font-bold uppercase tracking-widest hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 border-2 border-cyan-400"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Loop</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

