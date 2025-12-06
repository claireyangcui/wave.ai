import type { WaveformData } from '@wave-ai/shared';

/**
 * Tool: Create waveform data from audio
 * In a real implementation, this would analyze the audio buffer
 * For now, we generate a representative waveform based on music params
 */
export function createWaveform(
  audioBuffer: Buffer | undefined,
  duration: number,
  musicParams: any
): WaveformData {
  const sampleRate = 44100;
  const numPeaks = 200; // Number of waveform bars to generate
  const peaks: number[] = [];
  
  if (audioBuffer) {
    // Analyze audio buffer to extract peaks
    const samplesPerPeak = Math.floor((audioBuffer.length / 2) / numPeaks);
    for (let i = 0; i < numPeaks; i++) {
      let max = 0;
      const start = i * samplesPerPeak * 2;
      const end = Math.min(start + samplesPerPeak * 2, audioBuffer.length);
      
      for (let j = start; j < end; j += 2) {
        const sample = Math.abs(audioBuffer.readInt16LE(j));
        max = Math.max(max, sample);
      }
      
      peaks.push(normalizePeak(max));
    }
  } else {
    // Generate synthetic waveform based on music params
    const tempoHz = musicParams.tempo / 60;
    const drumPattern = musicParams.drumDensity;
    
    for (let i = 0; i < numPeaks; i++) {
      const t = (i / numPeaks) * duration;
      const beatPhase = (t * tempoHz) % 1;
      
      // Base waveform with beat pattern
      let amplitude = 0.3 + Math.sin(t * 2) * 0.2;
      
      // Add kick on beat
      if (beatPhase < 0.1) {
        amplitude += drumPattern * 0.5;
      }
      
      // Add variation
      amplitude += Math.sin(t * musicParams.tempo / 10) * 0.1 * musicParams.brightness;
      
      peaks.push(Math.max(0, Math.min(1, amplitude)));
    }
  }
  
  return {
    peaks,
    duration,
    sampleRate,
  };
}

/**
 * Normalize peak value from 16-bit PCM to 0-1
 */
function normalizePeak(value: number): number {
  return Math.max(0, Math.min(1, value / 32767));
}


