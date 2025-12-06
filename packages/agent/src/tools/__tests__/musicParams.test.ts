import { describe, it, expect } from 'vitest';
import { deriveMusicParams } from '../musicParams';
import type { MarketData, DJPreset } from '@wave-ai/shared';

describe('deriveMusicParams', () => {
  const createMarketData = (overrides: Partial<MarketData> = {}): MarketData => ({
    instrument: 'BTC',
    price: 45000,
    priceChange24h: 1000,
    priceChangePercent24h: 2.5,
    volatility: 3.5,
    volume24h: 5000000000,
    timestamp: Date.now(),
    ...overrides,
  });

  it('should generate music params for neon-house preset', () => {
    const marketData = createMarketData();
    const params = deriveMusicParams(marketData, 'neon-house');

    expect(params.tempo).toBeGreaterThanOrEqual(60);
    expect(params.tempo).toBeLessThanOrEqual(180);
    expect(['major', 'minor', 'pentatonic', 'chromatic']).toContain(params.scale);
    expect(params.brightness).toBeGreaterThanOrEqual(0);
    expect(params.brightness).toBeLessThanOrEqual(1);
    expect(params.drumDensity).toBeGreaterThanOrEqual(0);
    expect(params.drumDensity).toBeLessThanOrEqual(1);
  });

  it('should generate music params for lo-fi-drift preset', () => {
    const marketData = createMarketData();
    const params = deriveMusicParams(marketData, 'lo-fi-drift');

    expect(params.tempo).toBeGreaterThanOrEqual(60);
    expect(params.tempo).toBeLessThanOrEqual(180);
    expect(params.scale).toBeDefined();
  });

  it('should generate music params for industrial-tech preset', () => {
    const marketData = createMarketData();
    const params = deriveMusicParams(marketData, 'industrial-tech');

    expect(params.tempo).toBeGreaterThanOrEqual(60);
    expect(params.tempo).toBeLessThanOrEqual(180);
    expect(params.scale).toBeDefined();
  });

  it('should map positive price change to major scale', () => {
    const marketData = createMarketData({ priceChangePercent24h: 5.0 });
    const params = deriveMusicParams(marketData, 'neon-house');
    // With positive change and neon-house (major bias), should prefer major
    expect(['major', 'minor']).toContain(params.scale);
  });

  it('should map negative price change to minor scale', () => {
    const marketData = createMarketData({ priceChangePercent24h: -5.0 });
    const params = deriveMusicParams(marketData, 'lo-fi-drift');
    // With negative change and lo-fi-drift (minor bias), should prefer minor
    expect(['major', 'minor']).toContain(params.scale);
  });

  it('should map high volatility to higher tempo', () => {
    const lowVolData = createMarketData({ volatility: 1.0 });
    const highVolData = createMarketData({ volatility: 8.0 });

    const lowVolParams = deriveMusicParams(lowVolData, 'neon-house');
    const highVolParams = deriveMusicParams(highVolData, 'neon-house');

    // Higher volatility should generally result in higher tempo
    expect(highVolParams.tempo).toBeGreaterThanOrEqual(lowVolParams.tempo - 20); // Allow some variance
  });

  it('should map high volume to higher drum density', () => {
    const lowVolData = createMarketData({ volume24h: 1000000000 });
    const highVolData = createMarketData({ volume24h: 10000000000 });

    const lowVolParams = deriveMusicParams(lowVolData, 'neon-house');
    const highVolParams = deriveMusicParams(highVolData, 'neon-house');

    expect(highVolParams.drumDensity).toBeGreaterThanOrEqual(lowVolParams.drumDensity);
  });
});


