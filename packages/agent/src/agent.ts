import type { Instrument, DJPreset, MarketMoment, GenerationRequest } from '@wave-ai/shared';
import { generateMomentId } from '@wave-ai/shared';
import { getMarketData } from './tools/marketData.js';
import { deriveMusicParams, generateExplanation } from './tools/musicParams.js';
import { synthesizeAudio } from './tools/audioSynthesis.js';
import { createWaveform } from './tools/waveform.js';
import { mintMetadata } from './tools/nft.js';

/**
 * SpoonOS ToolCallAgent
 * Orchestrates the pipeline: market data → music params → audio → waveform → response
 */
export class ToolCallAgent {
  /**
   * Execute the full generation pipeline
   */
  async generateMoment(request: GenerationRequest): Promise<MarketMoment> {
    const { instrument, djPreset } = request;
    
    // Step 1: Fetch market data
    console.log(`📊 Fetching market data for ${instrument}...`);
    const marketData = await getMarketData(instrument);
    
    // Step 2: Derive music parameters
    console.log(`🎹 Deriving music parameters with ${djPreset} preset...`);
    const musicParams = deriveMusicParams(marketData, djPreset);
    
    // Step 3: Synthesize audio
    console.log(`🎵 Synthesizing audio...`);
    const audioResult = await synthesizeAudio(musicParams, 8);
    
    // Step 4: Create waveform
    console.log(`📈 Creating waveform visualization...`);
    const waveform = createWaveform(audioResult.audioBuffer, 8, musicParams);
    
    // Step 5: Generate explanation
    const explanation = generateExplanation(marketData, musicParams, djPreset);
    
    // Step 6: Create moment
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

