import type { MarketMoment, NFTMetadata } from '@wave-ai/shared';

/**
 * Tool: Create NFT metadata for a market moment
 */
export function mintMetadata(moment: MarketMoment): NFTMetadata {
  const attributes = [
    { trait_type: 'Instrument', value: moment.instrument },
    { trait_type: 'DJ Style', value: moment.dj },
    { trait_type: 'Tempo (BPM)', value: moment.musicParams.tempo },
    { trait_type: 'Scale', value: moment.musicParams.scale },
    { trait_type: 'Key', value: moment.musicParams.key },
    { trait_type: 'Intensity', value: Math.round(moment.musicParams.intensity * 100) },
    { trait_type: 'Price', value: `$${moment.marketData.price.toLocaleString()}` },
    { trait_type: '24h Change', value: `${moment.marketData.priceChangePercent24h.toFixed(2)}%` },
    { trait_type: 'Volatility', value: `${moment.marketData.volatility.toFixed(2)}%` },
  ];

  return {
    name: `${moment.instrument} Market Moment - ${new Date(moment.timestamp).toLocaleString()}`,
    description: `A sonified market moment: ${moment.explanation}`,
    audio: moment.audioUrl,
    attributes,
    properties: {
      instrument: moment.instrument,
      dj: moment.dj,
      marketData: moment.marketData,
      musicParams: moment.musicParams,
      waveformHash: generateWaveformHash(moment.waveform),
    },
  };
}

/**
 * Generate a simple hash of waveform data
 */
function generateWaveformHash(waveform: any): string {
  const data = JSON.stringify(waveform.peaks.slice(0, 50)); // Use first 50 peaks
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `0x${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

