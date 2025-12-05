import type { DJPreset } from '@wave-ai/shared';

const DJ_INFO: Record<DJPreset, { name: string; description: string; emoji: string }> = {
  'neon-house': {
    name: 'Neon House',
    description: 'High-energy electronic beats with vibrant synths',
    emoji: '🌆',
  },
  'lo-fi-drift': {
    name: 'Lo-Fi Drift',
    description: 'Chill, relaxed vibes with smooth textures',
    emoji: '🌊',
  },
  'industrial-tech': {
    name: 'Industrial Tech',
    description: 'Dark, mechanical sounds with heavy percussion',
    emoji: '⚙️',
  },
};

interface DJCardProps {
  preset: DJPreset;
  selected: boolean;
  onSelect: () => void;
}

export default function DJCard({ preset, selected, onSelect }: DJCardProps) {
  const info = DJ_INFO[preset];

  return (
    <button
      onClick={onSelect}
      className={`p-8 transition-all text-left w-full ${
        selected
          ? 'bg-cyan-400/10 border-l-4 border-cyan-400'
          : 'bg-black hover:bg-gray-900 border-l-4 border-transparent'
      }`}
    >
      <div className="text-3xl mb-4">{info.emoji}</div>
      <div className="text-lg font-bold mb-2 text-white uppercase tracking-wide">{info.name}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wider leading-relaxed">{info.description}</div>
    </button>
  );
}

