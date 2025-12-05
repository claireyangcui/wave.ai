import type { Instrument } from '@wave-ai/shared';

interface InstrumentPickerProps {
  instruments: Instrument[];
  selected: Instrument;
  onSelect: (instrument: Instrument) => void;
}

export default function InstrumentPicker({
  instruments,
  selected,
  onSelect,
}: InstrumentPickerProps) {
  return (
    <div className="flex flex-wrap gap-0 border border-gray-800">
      {instruments.map((instrument, index) => (
        <button
          key={instrument}
          onClick={() => onSelect(instrument)}
          className={`px-8 py-4 font-bold uppercase tracking-widest transition-all border-r border-gray-800 last:border-r-0 ${
            selected === instrument
              ? 'bg-cyan-400 text-black border-cyan-400'
              : 'bg-black text-gray-400 hover:text-white hover:bg-gray-900'
          }`}
        >
          {instrument}
        </button>
      ))}
    </div>
  );
}

