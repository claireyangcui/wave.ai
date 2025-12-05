import { ToolCallAgent } from './agent.js';
import type { GenerationRequest } from '@wave-ai/shared';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🎵 Wave AI - Market Sonification Agent Demo\n');
  
  const agent = new ToolCallAgent();
  
  const request: GenerationRequest = {
    instrument: 'BTC',
    djPreset: 'neon-house',
  };
  
  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('\n---\n');
  
  try {
    const moment = await agent.generateMoment(request);
    
    console.log('\n---\n');
    console.log('Generated Moment:');
    console.log(JSON.stringify({
      momentId: moment.momentId,
      instrument: moment.instrument,
      dj: moment.dj,
      marketData: {
        price: moment.marketData.price,
        priceChangePercent24h: moment.marketData.priceChangePercent24h,
        volatility: moment.marketData.volatility,
      },
      musicParams: moment.musicParams,
      explanation: moment.explanation,
      audioUrl: moment.audioUrl,
      waveform: {
        peaks: moment.waveform.peaks.length,
        duration: moment.waveform.duration,
      },
    }, null, 2));
    
    // Save audio file if buffer exists
    if (moment.audioUrl.startsWith('/api/audio/')) {
      const filename = moment.audioUrl.replace('/api/audio/', '');
      const tempPath = path.join(__dirname, '../temp', filename);
      const outputPath = path.join(__dirname, '../demo_output.wav');
      
      try {
        await fs.copyFile(tempPath, outputPath);
        console.log(`\n💾 Audio saved to: ${outputPath}`);
      } catch (err) {
        console.log('\n⚠️  Could not save audio file:', err);
      }
    }
    
    // Generate NFT metadata
    const nftMetadata = await agent.generateNFTMetadata(moment);
    const metadataPath = path.join(__dirname, '../demo_metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(nftMetadata, null, 2));
    console.log(`📄 NFT metadata saved to: ${metadataPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

