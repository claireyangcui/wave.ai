import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Instrument, DJPreset, MarketMoment, GenerationRequest } from '@wave-ai/shared';
import { generateMomentId } from '@wave-ai/shared';
import { getMarketData } from './tools/marketData.js';
import { deriveMusicParams, generateExplanation } from './tools/musicParams.js';
import { synthesizeAudio, setMusicContext } from './tools/audioSynthesis.js';
import { createWaveform } from './tools/waveform.js';
import { mintMetadata } from './tools/nft.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SpoonOS Python Agent Service URL
 */
const SPOONOS_AGENT_URL = process.env.SPOONOS_URL || 'http://localhost:3002';
const SPOONOS_AGENT_ENABLED = process.env.SPOONOS_AGENT_ENABLED !== 'false'; // Default to true

/**
 * Check if Python ReACT agent is available
 */
async function isPythonAgentAvailable(): Promise<boolean> {
  if (!SPOONOS_AGENT_ENABLED) {
    return false;
  }
  
  try {
    const response = await axios.get(`${SPOONOS_AGENT_URL}/health`, { timeout: 2000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Call Python ReACT agent to generate moment
 */
async function generateMomentWithPythonAgent(
  request: GenerationRequest
): Promise<MarketMoment | null> {
  try {
    console.log('🐍 Using Python ReACT agent for music generation...');
    
    const response = await axios.post(
      `${SPOONOS_AGENT_URL}/generate-moment`,
      {
        instrument: request.instrument,
        djPreset: request.djPreset,
        days: 7,
      },
      {
        timeout: 180000, // 3 minutes timeout
      }
    );
    
    const pythonResult = response.data;
    
    // Read audio file and create waveform
    const audioFilePath = pythonResult.audioFile;
    let audioBuffer: Buffer | undefined;
    let waveform;
    
    if (audioFilePath && await fs.access(audioFilePath).then(() => true).catch(() => false)) {
      audioBuffer = await fs.readFile(audioFilePath);
      waveform = createWaveform(audioBuffer, 8, pythonResult.musicParams);
    } else {
      // Generate synthetic waveform if file not found
      waveform = createWaveform(undefined, 8, pythonResult.musicParams);
    }
    
    // Convert to MarketMoment format
    const moment: MarketMoment = {
      momentId: pythonResult.momentId,
      instrument: pythonResult.instrument as Instrument,
      dj: pythonResult.dj as DJPreset,
      marketData: pythonResult.marketData,
      musicParams: pythonResult.musicParams,
      explanation: pythonResult.explanation,
      audioUrl: pythonResult.audioUrl,
      waveform,
      timestamp: pythonResult.timestamp,
    };
    
    console.log(`✅ Python agent generated moment: ${moment.momentId}`);
    return moment;
    
  } catch (error: any) {
    console.warn('⚠️  Python agent failed, falling back to Node.js pipeline:', error.message);
    return null;
  }
}

/**
 * SpoonOS ToolCallAgent
 * Orchestrates the pipeline: market data → music params → audio → waveform → response
 * Can use Python ReACT agent if available, otherwise falls back to Node.js pipeline
 */
export class ToolCallAgent {
  /**
   * Execute the full generation pipeline
   */
  async generateMoment(request: GenerationRequest): Promise<MarketMoment> {
    const { instrument, djPreset } = request;
    
    // Try Python agent first if enabled
    if (await isPythonAgentAvailable()) {
      const pythonResult = await generateMomentWithPythonAgent(request);
      if (pythonResult) {
        return pythonResult;
      }
      console.log('⚠️  Python agent unavailable, using Node.js pipeline...');
    }
    
    // Fallback to Node.js pipeline
    
    // Step 1: Fetch market data
    console.log(`📊 Fetching market data for ${instrument}...`);
    const marketData = await getMarketData(instrument);
    
    // Step 2: Derive music parameters
    console.log(`🎹 Deriving music parameters with ${djPreset} preset...`);
    const musicParams = deriveMusicParams(marketData, djPreset);
    
    // Step 3: Set context for LLM-powered audio synthesis
    console.log(`🧠 Setting context for SpoonOS LLM...`);
    setMusicContext({
      instrument,
      djPreset,
      marketData,
    });
    
    // Step 4: Synthesize audio (uses SpoonOS LLM for script generation)
    console.log(`🎵 Synthesizing audio...`);
    const audioResult = await synthesizeAudio(musicParams, 8);
    
    // Step 5: Create waveform
    console.log(`📈 Creating waveform visualization...`);
    const waveform = createWaveform(audioResult.audioBuffer, 8, musicParams);
    
    // Step 6: Generate explanation
    const explanation = generateExplanation(marketData, musicParams, djPreset);
    
    // Step 7: Create moment
    const moment: MarketMoment = {
      momentId: generateMomentId(),
      instrument,
      dj: djPreset,
      marketData,
      musicParams,
      explanation,
      audioUrl: audioResult.audioUrl,
      waveform,
      timestamp: Date.now(),
    };
    
    console.log(`✅ Generated moment: ${moment.momentId}`);
    return moment;
  }
  
  /**
   * Generate NFT metadata for a moment
   */
  async generateNFTMetadata(moment: MarketMoment) {
    return mintMetadata(moment);
  }
}


