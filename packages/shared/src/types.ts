export type MarketArea = 'crypto' | 'stocks' | 'forex';

export type Instrument = 'BTC' | 'ETH' | 'SOL' | 'AVAX' | 'MATIC';

export type DJPreset = 'neon-house' | 'lo-fi-drift' | 'industrial-tech';

export interface MarketData {
  instrument: Instrument;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volatility: number;
  volume24h: number;
  timestamp: number;
}

export interface MusicParams {
  tempo: number; // BPM
  scale: 'major' | 'minor' | 'pentatonic' | 'chromatic';
  key: string; // e.g., 'C', 'Dm', 'F#'
  filterCutoff: number; // 0-1
  brightness: number; // 0-1
  drumDensity: number; // 0-1
  intensity: number; // 0-1
  energyScore: number; // 0-1
}

export interface WaveformData {
  peaks: number[]; // Normalized amplitude values 0-1
  duration: number; // seconds
  sampleRate: number;
}

export interface MarketMoment {
  momentId: string;
  instrument: Instrument;
  dj: DJPreset;
  marketData: MarketData;
  musicParams: MusicParams;
  explanation: string;
  audioUrl: string;
  waveform: WaveformData;
  timestamp: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image?: string;
  audio: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    instrument: Instrument;
    dj: DJPreset;
    marketData: MarketData;
    musicParams: MusicParams;
    waveformHash?: string;
  };
}

export interface TipRequest {
  amount: number;
  currency: 'USD' | 'ETH' | 'USDC';
  recipient?: string;
}

export interface GenerationRequest {
  instrument: Instrument;
  djPreset: DJPreset;
  marketArea?: MarketArea;
}

export interface GenerationResponse {
  success: boolean;
  moment?: MarketMoment;
  error?: string;
}

