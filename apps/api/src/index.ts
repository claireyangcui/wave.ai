import express from 'express';
import cors from 'cors';
import { ToolCallAgent } from '@wave-ai/agent';
import type { GenerationRequest, GenerationResponse, MarketMoment, TipRequest } from '@wave-ai/shared';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

const agent = new ToolCallAgent();

// In-memory storage for demo (replace with DB in production)
const moments: MarketMoment[] = [];

// Serve audio files
app.get('/api/audio/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    // Resolve path relative to project root
    const projectRoot = path.resolve(__dirname, '../../..');
    const filepath = path.join(projectRoot, 'packages/agent/temp', filename);
    const audioBuffer = await fs.readFile(filepath);
    
    // Determine content type based on file extension
    const contentType = filename.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
  } catch (error) {
    res.status(404).json({ error: 'Audio file not found' });
  }
});

// Generate a market moment
app.post('/api/generate', async (req, res) => {
  try {
    const request: GenerationRequest = req.body;
    
    if (!request.instrument || !request.djPreset) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: instrument, djPreset',
      } as GenerationResponse);
    }
    
    console.log('Generating moment with request:', request);
    const moment = await agent.generateMoment(request);
    console.log('Moment generated successfully:', moment.momentId);
    
    moments.push(moment);
    
    // Keep only last 50 moments
    if (moments.length > 50) {
      moments.shift();
    }
    
    res.json({
      success: true,
      moment,
    } as GenerationResponse);
  } catch (error: any) {
    console.error('Generation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate moment',
    } as GenerationResponse);
  }
});

// Get all moments (library)
app.get('/api/moments', (req, res) => {
  try {
    res.json(moments.slice().reverse()); // Most recent first
  } catch (error: any) {
    console.error('Get moments error:', error);
    res.status(500).json({ error: error.message || 'Failed to get moments' });
  }
});

// Get a specific moment
app.get('/api/moments/:momentId', (req, res) => {
  const moment = moments.find(m => m.momentId === req.params.momentId);
  if (!moment) {
    return res.status(404).json({ error: 'Moment not found' });
  }
  res.json(moment);
});

// Generate NFT metadata
app.post('/api/moments/:momentId/mint', async (req, res) => {
  try {
    const moment = moments.find(m => m.momentId === req.params.momentId);
    if (!moment) {
      return res.status(404).json({ error: 'Moment not found' });
    }
    
    const metadata = await agent.generateNFTMetadata(moment);
    
    // TODO: In production, this would interact with a smart contract
    // For now, we just return the metadata
    res.json({
      success: true,
      metadata,
      contractAddress: process.env.NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
      tokenId: `#${moment.momentId.slice(-8)}`,
      message: 'NFT metadata generated. TODO: Implement onchain minting.',
    });
  } catch (error: any) {
    console.error('Mint error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate NFT metadata' });
  }
});

// Tip the DJ
app.post('/api/tip', async (req, res) => {
  try {
    const tipRequest: TipRequest = req.body;
    
    // TODO: In production, this would process a real payment
    // For now, we simulate the payment
    res.json({
      success: true,
      transactionHash: `0x${Math.random().toString(16).substring(2)}`,
      amount: tipRequest.amount,
      currency: tipRequest.currency,
      message: 'Tip processed (simulated). TODO: Implement real payment processing.',
    });
  } catch (error: any) {
    console.error('Tip error:', error);
    res.status(500).json({ error: error.message || 'Failed to process tip' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});

