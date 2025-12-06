import type { MarketData, MusicParams, DJPreset } from '@wave-ai/shared';
import { normalize, clamp } from '@wave-ai/shared';

/**
 * DJ Preset configurations that bias the music generation
 */
const DJ_PRESETS: Record<DJPreset, {
  tempoBias: number; // BPM offset
  scaleBias: 'major' | 'minor';
  drumDensityBias: number; // 0-1
  brightnessBias: number; // 0-1
  name: string;
  description: string;
}> = {
  'neon-house': {
    tempoBias: 20, // Higher BPM
    scaleBias: 'major',
    drumDensityBias: 0.7,
    brightnessBias: 0.8,
    name: 'Neon House',
    description: 'High-energy electronic beats with vibrant synths',
  },
  'lo-fi-drift': {
    tempoBias: -20, // Lower BPM
    scaleBias: 'minor',
    drumDensityBias: 0.3,
    brightnessBias: 0.4,
    name: 'Lo-Fi Drift',
    description: 'Chill, relaxed vibes with smooth textures',
  },
  'industrial-tech': {
    tempoBias: 10,
    scaleBias: 'minor',
    drumDensityBias: 0.9,
    brightnessBias: 0.5,
    name: 'Industrial Tech',
    description: 'Dark, mechanical sounds with heavy percussion',
  },
};

/**
 * Map volatility to BPM range (90-160)
 */
function volatilityToTempo(volatility: number, djPreset: DJPreset): number {
  const baseTempo = normalize(volatility, 0, 10, 90, 160);
  const preset = DJ_PRESETS[djPreset];
  return clamp(baseTempo + preset.tempoBias, 60, 180);
}

/**
 * Map 24h change to scale (positive = major, negative = minor)
 */
function priceChangeToScale(priceChangePercent24h: number, djPreset: DJPreset): 'major' | 'minor' {
  const presetScale = DJ_PRESETS[djPreset].scaleBias;
  // If price is up significantly, prefer major; if down, prefer minor
  if (Math.abs(priceChangePercent24h) < 1) {
    return presetScale; // Neutral, use preset default
  }
  return priceChangePercent24h > 0 ? 'major' : 'minor';
}

/**
 * Select key based on instrument (deterministic mapping)
 */
function instrumentToKey(instrument: string): string {
  const keyMap: Record<string, string> = {
    BTC: 'C',
    ETH: 'Dm',
    SOL: 'F',
    AVAX: 'Am',
    MATIC: 'G',
  };
  return keyMap[instrument] || 'C';
}

/**
 * Map volume to drum density
 */
function volumeToDrumDensity(volume24h: number, djPreset: DJPreset): number {
  const preset = DJ_PRESETS[djPreset];
  // Normalize volume (assuming range 0-10B)
  const normalizedVolume = normalize(volume24h, 0, 10000000000, 0, 1);
  const baseDensity = clamp(normalizedVolume, 0.2, 0.9);
  return clamp(baseDensity + (preset.drumDensityBias - 0.5) * 0.3, 0, 1);
}

/**
 * Map price acceleration (change rate) to brightness
 */
function priceChangeToBrightness(priceChangePercent24h: number, djPreset: DJPreset): number {
  const preset = DJ_PRESETS[djPreset];
  // Positive change = brighter, negative = darker
  const changeFactor = normalize(priceChangePercent24h, -10, 10, 0.3, 0.9);
  return clamp(changeFactor + (preset.brightnessBias - 0.5) * 0.2, 0, 1);
}

/**
 * Calculate filter cutoff from volatility
 */
function volatilityToFilterCutoff(volatility: number): number {
  // Higher volatility = more movement in filter
  return normalize(volatility, 0, 10, 0.3, 0.8);
}

/**
 * Calculate intensity/energy score
 */
function calculateEnergyScore(
  volatility: number,
  volume24h: number,
  priceChangePercent24h: number
): number {
  const volScore = normalize(volatility, 0, 10, 0, 0.4);
  const volumeScore = normalize(volume24h, 0, 10000000000, 0, 0.3);
  const changeScore = normalize(Math.abs(priceChangePercent24h), 0, 10, 0, 0.3);
  return clamp(volScore + volumeScore + changeScore, 0, 1);
}

/**
 * Determine trend direction from price change
 */
function determineTrendDirection(priceChangePercent24h: number): 'rising' | 'falling' | 'stable' {
  if (priceChangePercent24h > 1) return 'rising';
  if (priceChangePercent24h < -1) return 'falling';
  return 'stable';
}

/**
 * Calculate trend strength (0-1)
 */
function calculateTrendStrength(priceChangePercent24h: number): number {
  // Map absolute change to 0-1, capped at 10%
  return Math.min(Math.abs(priceChangePercent24h) / 10, 1);
}

/**
 * Tool: Derive music parameters from market data
 */
export function deriveMusicParams(
  marketData: MarketData,
  djPreset: DJPreset
): MusicParams {
  const preset = DJ_PRESETS[djPreset];
  
  const tempo = volatilityToTempo(marketData.volatility, djPreset);
  const scale = priceChangeToScale(marketData.priceChangePercent24h, djPreset);
  const key = instrumentToKey(marketData.instrument);
  const filterCutoff = volatilityToFilterCutoff(marketData.volatility);
  const brightness = priceChangeToBrightness(marketData.priceChangePercent24h, djPreset);
  const drumDensity = volumeToDrumDensity(marketData.volume24h, djPreset);
  const energyScore = calculateEnergyScore(
    marketData.volatility,
    marketData.volume24h,
    marketData.priceChangePercent24h
  );
  const intensity = energyScore;
  const trendDirection = determineTrendDirection(marketData.priceChangePercent24h);
  const trendStrength = calculateTrendStrength(marketData.priceChangePercent24h);

  return {
    tempo: Math.round(tempo),
    scale,
    key,
    filterCutoff: Math.round(filterCutoff * 100) / 100,
    brightness: Math.round(brightness * 100) / 100,
    drumDensity: Math.round(drumDensity * 100) / 100,
    intensity: Math.round(intensity * 100) / 100,
    energyScore: Math.round(energyScore * 100) / 100,
    trendDirection,
    trendStrength: Math.round(trendStrength * 100) / 100,
  };
}

/**
 * Generate human-readable explanation of the mapping
 */
export function generateExplanation(
  marketData: MarketData,
  musicParams: MusicParams,
  djPreset: DJPreset
): string {
  const preset = DJ_PRESETS[djPreset];
  const changeDirection = marketData.priceChangePercent24h > 0 ? 'upward' : 'downward';
  const changeMagnitude = Math.abs(marketData.priceChangePercent24h);
  
  const parts: string[] = [];
  
  parts.push(`The ${preset.name} DJ detected ${marketData.instrument} trading at $${marketData.price.toLocaleString()}`);
  
  if (changeMagnitude > 1) {
    parts.push(`with a ${changeMagnitude.toFixed(2)}% ${changeDirection} movement`);
  } else {
    parts.push('with relatively stable pricing');
  }
  
  parts.push(`Volatility of ${marketData.volatility.toFixed(2)}%`);
  parts.push(`drove the tempo to ${musicParams.tempo} BPM`);
  
  if (musicParams.scale === 'major') {
    parts.push(`The ${changeDirection} trend inspired a major scale`);
  } else {
    parts.push(`The ${changeDirection} trend inspired a minor scale`);
  }
  
  parts.push(`with ${musicParams.key} as the root`);
  
  if (musicParams.drumDensity > 0.7) {
    parts.push('High trading volume translated to dense, energetic percussion');
  } else if (musicParams.drumDensity < 0.4) {
    parts.push('Lower volume created a more sparse, atmospheric rhythm');
  }
  
  if (musicParams.brightness > 0.7) {
    parts.push('Bright, uplifting synth tones reflect positive momentum');
  } else if (musicParams.brightness < 0.4) {
    parts.push('Darker, filtered textures mirror the cautious market mood');
  }
  
  return parts.join('. ') + '.';
}

