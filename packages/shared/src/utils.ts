import type { MarketData, MusicParams, DJPreset } from './types';

/**
 * Generate a unique moment ID
 */
export function generateMomentId(): string {
  return `moment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Normalize a value to a range
 */
export function normalize(value: number, min: number, max: number, targetMin: number = 0, targetMax: number = 1): number {
  if (max === min) return targetMin;
  const normalized = (value - min) / (max - min);
  return normalized * (targetMax - targetMin) + targetMin;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Format currency
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format duration (seconds to mm:ss)
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

