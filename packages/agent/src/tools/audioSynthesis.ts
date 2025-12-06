import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { MusicParams, MarketData, DJPreset } from '@wave-ai/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SpoonOS service URL for LLM-powered music script generation
 */
const SPOONOS_SERVICE_URL = process.env.SPOONOS_URL || 'http://localhost:3002';

/**
 * Context for music generation (set by the agent)
 */
let currentContext: {
  instrument?: string;
  djPreset?: DJPreset;
  marketData?: MarketData;
} = {};

/**
 * Set the context for the next audio generation
 */
export function setMusicContext(context: {
  instrument: string;
  djPreset: DJPreset;
  marketData: MarketData;
}) {
  currentContext = context;
}

/**
 * Fetch LLM-generated music script from SpoonOS
 */
async function getLLMMusicScript(
  musicParams: MusicParams
): Promise<{ script: string; mood: string; llmProvider: string } | null> {
  if (!currentContext.instrument || !currentContext.djPreset || !currentContext.marketData) {
    console.log('⚠️  No context set for LLM script generation, using fallback');
    return null;
  }

  try {
    console.log('🧠 Requesting LLM music script from SpoonOS...');
    
    const response = await axios.post(
      `${SPOONOS_SERVICE_URL}/generate-music-script`,
      {
        instrument: currentContext.instrument,
        djPreset: currentContext.djPreset,
        marketData: currentContext.marketData,
        musicParams: musicParams,
      },
      {
        timeout: 30000, // 30 second timeout for LLM
      }
    );

    const data = response.data;
    console.log(`✅ LLM generated script (provider: ${data.llm_provider}):`);
    console.log(`   "${data.script.substring(0, 100)}..."`);
    
    return {
      script: data.script,
      mood: data.mood,
      llmProvider: data.llm_provider,
    };
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.warn('⚠️  SpoonOS service not running, using fallback script');
    } else {
      console.warn('⚠️  LLM script generation failed:', error.message);
    }
    return null;
  }
}

/**
 * Tool: Synthesize audio using ElevenLabs or fallback
 * Now uses SpoonOS LLM for creative script generation
 */
export async function synthesizeAudio(
  musicParams: MusicParams,
  durationSeconds: number = 8
): Promise<{ audioUrl: string; audioBuffer?: Buffer; script?: string }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️  ELEVENLABS_API_KEY not set, using fallback audio generation');
    return generateFallbackAudio(musicParams, durationSeconds);
  }
  
  console.log('🔑 ELEVENLABS_API_KEY detected, using ElevenLabs API');

  // Declare outside try block for error logging
  let musicDescription: string = '';
  let llmUsed = false;

  try {
    // Try to get LLM-generated script from SpoonOS first
    
    const llmResult = await getLLMMusicScript(musicParams);
    if (llmResult) {
      musicDescription = llmResult.script;
      llmUsed = true;
      console.log(`🎵 Using ${llmResult.llmProvider} LLM-generated script (mood: ${llmResult.mood})`);
    } else {
      // Fallback to basic description
      musicDescription = generateMusicDescription(musicParams);
      console.log('🎵 Using basic music description');
    }
    
    console.log('📻 Calling ElevenLabs Music API...');
    console.log('📝 Prompt being sent to ElevenLabs:');
    console.log('─'.repeat(80));
    console.log(musicDescription);
    console.log('─'.repeat(80));
    console.log('🎛️  API Settings:', {
      duration_seconds: durationSeconds,
      prompt_influence: llmUsed ? 0.7 : 0.5,
      llm_enhanced: llmUsed,
    });
    
    // Call ElevenLabs Music Generation API
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/music-generation',
      {
        text: musicDescription,
        duration_seconds: durationSeconds,
        prompt_influence: llmUsed ? 0.7 : 0.5, // Higher influence for LLM scripts
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

    console.log('✅ ElevenLabs response received:', {
      status: response.status,
      contentType: response.headers['content-type'],
      size: `${(response.data.byteLength / 1024).toFixed(2)} KB`,
    });

    // Save the audio file
    const audioBuffer = Buffer.from(response.data);
    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });
    const filename = `audio_${Date.now()}.mp3`; // ElevenLabs returns MP3
    const filepath = path.join(tempDir, filename);
    await fs.writeFile(filepath, audioBuffer);

    console.log('✅ ElevenLabs audio saved successfully:', filename);
    
    return {
      audioUrl: `/api/audio/${filename}`,
      audioBuffer: audioBuffer,
      script: musicDescription,
    };
  } catch (error: any) {
    console.error('❌ ElevenLabs API failed!');
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data ? (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data)) : 'No response data',
    });
    if (musicDescription) {
      console.error('Prompt that failed:', musicDescription.substring(0, 200) + '...');
    }
    console.warn('⚠️  Falling back to synthesized audio generator');
    return generateFallbackAudio(musicParams, durationSeconds);
  }
}

/**
 * Generate a detailed text description of the music for ElevenLabs API
 * Uses sophisticated market-to-music mapping
 */
function generateMusicDescription(params: MusicParams): string {
  // Harmony based on trend direction
  const harmony = params.trendDirection === 'rising' 
    ? 'D Dorian' 
    : 'E minor';
  
  // Timbre instruction based on brightness (price level proxy)
  const timbreNote = params.brightness > 0.6
    ? 'Use brighter timbre with more harmonics and slightly open filter.'
    : params.brightness < 0.4
    ? 'Use darker timbre with closed filter and warm saturation.'
    : '';
  
  // Percussion density based on volatility/energy
  const percussionNote = params.energyScore > 0.6
    ? 'Dense percussion with faster note repetition.'
    : params.energyScore < 0.4
    ? 'Sparser percussion with breathing room.'
    : '';
  
  // Tonal center based on trend
  const tonalNote = params.trendDirection === 'rising'
    ? 'Major-ish tonal center with uplifting intervals.'
    : params.trendDirection === 'falling'
    ? 'Minor-ish tonal center with darker chord voicings.'
    : '';
  
  // Spike effects based on intensity
  const spikeNote = params.intensity > 0.5
    ? 'Add short risers, stutters, or one-hit accents for spike moments.'
    : '';

  return `Create an original electronic instrumental loop (8 seconds) designed for seamless looping. Mood: futuristic, high-energy, slightly tense but optimistic. Tempo: ${params.tempo} BPM with subtle rhythmic variation and intensity changes.

Sound palette: punchy kick, tight hi-hats, warm sub bass, airy synth plucks, and a shifting pad.

${timbreNote} ${percussionNote} ${tonalNote} ${spikeNote}

Harmony: ${harmony}, with a repeating 4-bar progression. Add light glitch elements and tape-stop micro-effects. Keep dynamics punchy and club-ready, but not aggressive. No vocals, no spoken words, no recognizable melodies. Output must be clean, modern, and uniquely composed.

Looping requirements: no long reverb tails at the end; end should match the start for seamless looping.`;
}

/**
 * Advanced synthesizer for generating electronic music
 * Produces actual musical loops with drums, bass, and synths
 */
async function generateFallbackAudio(
  params: MusicParams,
  durationSeconds: number
): Promise<{ audioUrl: string; audioBuffer?: Buffer }> {
  console.log('🎹 Generating synthesized audio with params:', {
    tempo: params.tempo,
    key: params.key,
    scale: params.scale,
    energy: params.energyScore,
  });

  const sampleRate = 44100;
  const numSamples = sampleRate * durationSeconds;
  const buffer = Buffer.alloc(numSamples * 4); // 16-bit stereo
  
  // Get musical scale frequencies
  const rootFreq = getFrequencyFromKey(params.key);
  const scale = getScaleFrequencies(rootFreq, params.scale);
  
  // Tempo calculations
  const beatsPerSecond = params.tempo / 60;
  const samplesPerBeat = sampleRate / beatsPerSecond;
  const totalBeats = Math.floor(durationSeconds * beatsPerSecond);
  
  // Generate chord progression (4 bars, 4 beats each)
  // Rising trend = ascending chord progression, falling = descending
  const chordProgression = params.trendDirection === 'rising'
    ? (params.scale === 'major' ? [0, 2, 3, 4] : [0, 2, 4, 5]) // Ascending progression
    : params.trendDirection === 'falling'
    ? (params.scale === 'major' ? [4, 3, 2, 0] : [5, 4, 2, 0]) // Descending progression
    : (params.scale === 'major' ? [0, 3, 4, 4] : [0, 3, 4, 2]); // Stable/cycling
  
  // Arpeggio pattern - direction follows trend
  const arpPattern = params.trendDirection === 'rising'
    ? [0, 2, 4, 5, 7, 5, 4, 7] // Ascending arpeggio pattern
    : params.trendDirection === 'falling'
    ? [7, 5, 4, 2, 0, 2, 4, 0] // Descending arpeggio pattern  
    : [0, 2, 4, 2, 0, 4, 2, 4]; // Stable cycling pattern
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beatNumber = Math.floor(t * beatsPerSecond);
    const beatPhase = (t * beatsPerSecond) % 1;
    const barNumber = Math.floor(beatNumber / 4) % 4;
    const beatInBar = beatNumber % 4;
    
    let sample = 0;
    
    // === KICK DRUM (4 on the floor) ===
    if (beatPhase < 0.15) {
      const kickEnv = Math.exp(-beatPhase * 30);
      const kickPitch = 150 * Math.exp(-beatPhase * 40) + 40;
      const kick = Math.sin(2 * Math.PI * kickPitch * t) * kickEnv * 0.6;
      sample += kick * params.drumDensity;
    }
    
    // === SNARE (beats 2 and 4) ===
    if ((beatInBar === 1 || beatInBar === 3) && beatPhase < 0.1) {
      const snareEnv = Math.exp(-beatPhase * 25);
      const noise = (Math.random() * 2 - 1) * snareEnv * 0.3;
      const snareBody = Math.sin(2 * Math.PI * 200 * t) * snareEnv * 0.2;
      sample += (noise + snareBody) * params.drumDensity;
    }
    
    // === HI-HAT (8th notes or 16th notes based on energy) ===
    const hihatDiv = params.energyScore > 0.6 ? 4 : 2; // 16ths or 8ths
    const hihatPhase = (t * beatsPerSecond * hihatDiv) % 1;
    if (hihatPhase < 0.05) {
      const hhEnv = Math.exp(-hihatPhase * 80);
      const hihat = (Math.random() * 2 - 1) * hhEnv * 0.15;
      sample += hihat * params.drumDensity * params.brightness;
    }
    
    // === BASS LINE ===
    const chordRoot = chordProgression[barNumber];
    const bassFreq = scale[chordRoot] * 0.5; // One octave down
    const bassEnv = beatPhase < 0.5 ? 1 - beatPhase * 0.5 : 0.75;
    // Saw wave for punchy bass
    const bassPhase = (t * bassFreq) % 1;
    const bassSaw = (bassPhase * 2 - 1) * 0.3 * bassEnv;
    // Add sub bass (sine)
    const bassSub = Math.sin(2 * Math.PI * bassFreq * 0.5 * t) * 0.25 * bassEnv;
    sample += (bassSaw + bassSub) * (0.5 + params.intensity * 0.5);
    
    // === SYNTH PAD (lush filtered chord) ===
    const padNotes = [0, 2, 4]; // Triad
    let pad = 0;
    for (const note of padNotes) {
      const padFreq = scale[(chordRoot + note) % 7] * 2;
      // Detuned oscillators for thickness (supersaw style)
      for (let detune = -2; detune <= 2; detune++) {
        const detuneAmount = 1 + detune * 0.002;
        pad += Math.sin(2 * Math.PI * padFreq * detuneAmount * t) * 0.04;
      }
    }
    // Slow filter sweep
    const filterSweep = 0.5 + Math.sin(t * 0.3) * 0.3;
    const filterAmount = (0.3 + params.filterCutoff * 0.7) * filterSweep;
    sample += pad * filterAmount * params.brightness * 0.8;
    
    // === PLUCK SYNTH (Karplus-Strong inspired) ===
    const pluckSpeed = 2; // 8th notes
    const pluckBeat = Math.floor(t * beatsPerSecond * pluckSpeed);
    const pluckPhase = (t * beatsPerSecond * pluckSpeed) % 1;
    if (pluckPhase < 0.3) {
      const pluckNote = arpPattern[(pluckBeat + 2) % arpPattern.length];
      const pluckFreq = scale[(chordRoot + pluckNote) % 7] * 2;
      const pluckEnv = Math.exp(-pluckPhase * 12);
      // Pluck with harmonics
      const pluck = (
        Math.sin(2 * Math.PI * pluckFreq * t) * 0.5 +
        Math.sin(2 * Math.PI * pluckFreq * 2 * t) * 0.3 +
        Math.sin(2 * Math.PI * pluckFreq * 3 * t) * 0.15
      ) * pluckEnv * 0.2;
      sample += pluck * params.brightness;
    }
    
    // === BELL/CHIME (high sparkles) ===
    const bellSpeed = params.energyScore > 0.5 ? 4 : 2;
    const bellBeat = Math.floor(t * beatsPerSecond * bellSpeed);
    const bellPhase = (t * beatsPerSecond * bellSpeed) % 1;
    if (bellBeat % 3 === 0 && bellPhase < 0.2) { // Sparse bell hits
      const bellNote = arpPattern[bellBeat % arpPattern.length];
      const bellFreq = scale[(chordRoot + bellNote) % 7] * 8; // Very high
      const bellEnv = Math.exp(-bellPhase * 20);
      // Bell = fundamental + inharmonic partials
      const bell = (
        Math.sin(2 * Math.PI * bellFreq * t) +
        Math.sin(2 * Math.PI * bellFreq * 2.4 * t) * 0.5 +
        Math.sin(2 * Math.PI * bellFreq * 5.95 * t) * 0.25
      ) * bellEnv * 0.08;
      sample += bell * params.brightness * params.brightness;
    }
    
    // === ARPEGGIO (lead synth with trend direction) ===
    const arpSpeed = params.tempo > 120 ? 4 : 2; // 16ths or 8ths
    const arpBeat = Math.floor(t * beatsPerSecond * arpSpeed);
    const arpNote = arpPattern[arpBeat % arpPattern.length];
    const arpFreq = scale[(chordRoot + arpNote) % 7] * 4; // Two octaves up
    const arpPhase = (t * beatsPerSecond * arpSpeed) % 1;
    const arpEnv = Math.exp(-arpPhase * 4) * (0.3 + params.energyScore * 0.4);
    // Sawtooth with filter for classic lead sound
    const sawPhase = (t * arpFreq) % 1;
    const sawWave = sawPhase * 2 - 1;
    // Filtered saw (simple lowpass approximation)
    const arpOsc = sawWave * (0.5 + params.filterCutoff * 0.5);
    sample += arpOsc * arpEnv * 0.12 * params.brightness;
    
    // === ACID BASS ACCENT (303 style on upbeats) ===
    if (beatInBar % 2 === 1 && beatPhase < 0.15 && params.intensity > 0.5) {
      const acidFreq = scale[chordRoot] * 2;
      const acidEnv = Math.exp(-beatPhase * 20);
      const acidPhase = (t * acidFreq) % 1;
      // Resonant square wave
      const acidOsc = (acidPhase < 0.5 ? 1 : -1) * acidEnv;
      sample += acidOsc * 0.15 * params.intensity;
    }
    
    // === VOCAL CHOP SIMULATION (formant-like filter) ===
    if (barNumber === 2 && beatInBar === 0 && beatPhase < 0.4) {
      const vowelFreq = scale[chordRoot] * 4;
      const vowelEnv = Math.exp(-beatPhase * 5);
      // Formants for "ah" sound
      const f1 = 730, f2 = 1090, f3 = 2440;
      const vowel = (
        Math.sin(2 * Math.PI * vowelFreq * t) * 0.5 +
        Math.sin(2 * Math.PI * f1 * t) * Math.sin(2 * Math.PI * vowelFreq * t) * 0.3 +
        Math.sin(2 * Math.PI * f2 * t) * Math.sin(2 * Math.PI * vowelFreq * t) * 0.15
      ) * vowelEnv * 0.15;
      sample += vowel * params.brightness;
    }
    
    // === MASTER PROCESSING ===
    // Soft clipping for warmth
    sample = Math.tanh(sample * 1.5) * 0.8;
    
    // Slight stereo width
    const stereoPhase = Math.sin(t * 0.5) * 0.1;
    const left = sample * (1 + stereoPhase);
    const right = sample * (1 - stereoPhase);
    
    // Convert to 16-bit PCM
    const leftInt = Math.floor(Math.max(-1, Math.min(1, left)) * 32767);
    const rightInt = Math.floor(Math.max(-1, Math.min(1, right)) * 32767);
    
    buffer.writeInt16LE(leftInt, i * 4);
    buffer.writeInt16LE(rightInt, i * 4 + 2);
  }
  
  // Create WAV file
  const wavHeader = createWAVHeader(numSamples, sampleRate, 2, 16);
  const wavBuffer = Buffer.concat([wavHeader, buffer]);
  
  // Save to temp file
  const tempDir = path.join(__dirname, '../../temp');
  await fs.mkdir(tempDir, { recursive: true });
  const filename = `audio_${Date.now()}.wav`;
  const filepath = path.join(tempDir, filename);
  await fs.writeFile(filepath, wavBuffer);
  
  console.log('✅ Synthesized audio generated:', filename);
  
  return {
    audioUrl: `/api/audio/${filename}`,
    audioBuffer: wavBuffer,
  };
}

/**
 * Get root frequency from musical key
 */
function getFrequencyFromKey(key: string): number {
  const noteFreqs: Record<string, number> = {
    'C': 130.81,   // C3
    'C#': 138.59,
    'Db': 138.59,
    'D': 146.83,
    'Dm': 146.83,
    'D#': 155.56,
    'Eb': 155.56,
    'E': 164.81,
    'F': 174.61,
    'F#': 185.00,
    'Gb': 185.00,
    'G': 196.00,
    'G#': 207.65,
    'Ab': 207.65,
    'A': 220.00,
    'Am': 220.00,
    'A#': 233.08,
    'Bb': 233.08,
    'B': 246.94,
  };
  return noteFreqs[key] || 130.81;
}

/**
 * Generate scale frequencies (7 notes)
 */
function getScaleFrequencies(root: number, scaleType: string): number[] {
  // Semitone intervals for different scales
  const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
  const minorIntervals = [0, 2, 3, 5, 7, 8, 10];
  
  const intervals = scaleType === 'minor' ? minorIntervals : majorIntervals;
  
  return intervals.map(semitones => root * Math.pow(2, semitones / 12));
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

