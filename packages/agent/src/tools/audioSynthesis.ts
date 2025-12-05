import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { MusicParams } from '@wave-ai/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Tool: Synthesize audio using ElevenLabs or fallback
 */
export async function synthesizeAudio(
  musicParams: MusicParams,
  durationSeconds: number = 8
): Promise<{ audioUrl: string; audioBuffer?: Buffer }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️  ELEVENLABS_API_KEY not set, using fallback audio generation');
    return generateFallbackAudio(musicParams, durationSeconds);
  }

  try {
    // Generate music description from params
    const musicDescription = generateMusicDescription(musicParams);
    
    console.log('🎵 Calling ElevenLabs Music API with:', musicDescription);
    
    // Call ElevenLabs Music Generation API
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/music-generation',
      {
        text: musicDescription,
        duration_seconds: durationSeconds,
        prompt_influence: 0.5, // How much the prompt influences the output (0-1)
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer', // For binary audio data
        timeout: 120000, // 2 minutes timeout for music generation
      }
    );

    // Save the audio file
    const audioBuffer = Buffer.from(response.data);
    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });
    const filename = `audio_${Date.now()}.mp3`; // ElevenLabs returns MP3
    const filepath = path.join(tempDir, filename);
    await fs.writeFile(filepath, audioBuffer);

    console.log('✅ ElevenLabs audio generated successfully');
    
    return {
      audioUrl: `/api/audio/${filename}`,
      audioBuffer: audioBuffer,
    };
  } catch (error: any) {
    console.warn('ElevenLabs API failed, using fallback:', error.response?.data || error.message);
    return generateFallbackAudio(musicParams, durationSeconds);
  }
}

/**
 * Generate a text description of the music for API calls
 */
function generateMusicDescription(params: MusicParams): string {
  const scaleDesc = params.scale === 'major' ? 'uplifting major' : 'melancholic minor';
  const tempoDesc = params.tempo < 100 ? 'slow' : params.tempo < 130 ? 'moderate' : 'fast';
  const brightnessDesc = params.brightness > 0.7 ? 'bright and energetic' : params.brightness < 0.4 ? 'dark and filtered' : 'balanced';
  const densityDesc = params.drumDensity > 0.6 ? 'dense' : params.drumDensity < 0.4 ? 'sparse' : 'moderate';
  
  // Create a more detailed prompt for ElevenLabs
  return `A ${tempoDesc} tempo (${params.tempo} BPM) electronic music loop in ${scaleDesc} scale, key of ${params.key}. ${brightnessDesc} tone with ${densityDesc} percussion. Intensity level ${Math.round(params.intensity * 100)}%. Short loop suitable for background music.`;
}

/**
 * Generate a simple audio loop using Web Audio API concepts (server-side fallback)
 * This creates a basic WAV file with synthesized tones
 */
async function generateFallbackAudio(
  params: MusicParams,
  durationSeconds: number
): Promise<{ audioUrl: string; audioBuffer?: Buffer }> {
  // Generate a simple sine wave loop with the specified parameters
  const sampleRate = 44100;
  const numSamples = sampleRate * durationSeconds;
  const buffer = Buffer.alloc(numSamples * 4); // 16-bit stereo (2 channels * 2 bytes per sample)
  
  // Generate tones based on music params
  // Use major/minor for frequency calculation (scale affects harmony, not base frequency)
  const scaleForFreq = params.scale === 'major' || params.scale === 'minor' ? params.scale : 'major';
  const baseFreq = getFrequencyFromKey(params.key, scaleForFreq);
  const tempoHz = params.tempo / 60; // BPM to Hz
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    
    // Main tone (bass)
    const bassFreq = baseFreq * 0.5;
    const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.3;
    
    // Melody (higher harmonic)
    const melodyFreq = baseFreq * 2;
    const melody = Math.sin(2 * Math.PI * melodyFreq * t) * 0.2 * params.brightness;
    
    // Drum pattern (kick on beat)
    const beatPhase = (t * tempoHz) % 1;
    const kick = beatPhase < 0.1 ? Math.sin(2 * Math.PI * 60 * t) * params.drumDensity * 0.4 : 0;
    
    // Filter effect (simplified)
    const filtered = (bass + melody + kick) * (0.5 + params.filterCutoff * 0.5);
    
    // Convert to 16-bit PCM
    const sample = Math.max(-1, Math.min(1, filtered));
    const int16 = Math.floor(sample * 32767);
    
    // Write stereo (same to both channels)
    buffer.writeInt16LE(int16, i * 4);
    buffer.writeInt16LE(int16, i * 4 + 2);
  }
  
  // Create WAV file header
  const wavHeader = createWAVHeader(numSamples, sampleRate, 2, 16);
  const wavBuffer = Buffer.concat([wavHeader, buffer]);
  
  // Save to temp file
  const tempDir = path.join(__dirname, '../../temp');
  await fs.mkdir(tempDir, { recursive: true });
  const filename = `audio_${Date.now()}.wav`;
  const filepath = path.join(tempDir, filename);
  await fs.writeFile(filepath, wavBuffer);
  
  return {
    audioUrl: `/api/audio/${filename}`,
    audioBuffer: wavBuffer,
  };
}

/**
 * Get frequency from musical key
 */
function getFrequencyFromKey(key: string, scale: 'major' | 'minor'): number {
  // A4 = 440Hz
  const noteMap: Record<string, number> = {
    'C': 261.63,
    'Dm': 293.66,
    'D': 293.66,
    'E': 329.63,
    'F': 349.23,
    'G': 392.00,
    'Am': 440.00,
    'A': 440.00,
  };
  return noteMap[key] || 261.63;
}

/**
 * Create WAV file header
 */
function createWAVHeader(numSamples: number, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = numSamples * channels * (bitsPerSample / 8);
  const fileSize = 36 + dataSize;
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28); // byte rate
  header.writeUInt16LE(channels * (bitsPerSample / 8), 32); // block align
  header.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  
  return header;
}

