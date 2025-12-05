# Wave AI - Market Sonification Agent

A web application that transforms live market data into unique music loops with waveform visualizations. Built with React, Express, and a SpoonOS ToolCallAgent orchestration pipeline.

## 🎵 Features

- **Market Data Sonification**: Convert crypto market data (price, volatility, volume) into music parameters
- **DJ Presets**: Three distinct music styles (Neon House, Lo-Fi Drift, Industrial Tech)
- **Real-time Audio Generation**: Generate 8-second music loops based on market conditions
- **Waveform Visualization**: Animated waveform visualizer synchronized with playback
- **NFT Minting**: Generate metadata for "Market Moment" NFTs (scaffolded for onchain integration)
- **Micropayments**: Tipping flow for supporting the DJ (scaffolded for wallet integration)

## 🏗️ Architecture

```
wave.ai/
├── apps/
│   ├── web/          # React frontend (Vite + TypeScript + Tailwind)
│   └── api/          # Express API server
├── packages/
│   ├── agent/        # SpoonOS ToolCallAgent + tools
│   └── shared/       # Shared types and utilities
└── README.md
```

### Architecture Diagram

```
┌─────────────┐
│   React UI  │
│  (Frontend) │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐
│ Express API │
│  (Backend)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  SpoonOS ToolCallAgent  │
│                         │
│  Tools:                 │
│  • getMarketData()      │
│  • deriveMusicParams()  │
│  • synthesizeAudio()    │
│  • createWaveform()     │
│  • mintMetadata()       │
└─────────────────────────┘
       │
       ├──► CoinGecko API (market data)
       ├──► ElevenLabs API (audio) [optional]
       └──► Fallback audio generation
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd wave.ai
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. (Optional) Add your API keys to `.env`:
```env
ELEVENLABS_API_KEY=your_key_here
```

### Running the Application

**Development mode** (runs both web and API):
```bash
pnpm dev
```

This will start:
- Frontend: http://localhost:5173
- API: http://localhost:3001

**Run the agent demo**:
```bash
pnpm agent:demo
```

This will generate a sample market moment and save the audio file and metadata.

## 📦 Project Structure

### `/apps/web` - React Frontend

- **Components**:
  - `Sidebar`: Navigation and recent moments library
  - `MainPane`: DJ selection and generation UI
  - `NowPlaying`: Audio player with waveform, controls, tip/mint buttons
  - `WaveformVisualizer`: Canvas-based waveform animation
  - `TipModal`: Micropayment flow UI
  - `MintModal`: NFT metadata generation UI

- **Tech Stack**:
  - React 18 + TypeScript
  - Vite
  - Tailwind CSS
  - Zustand (state management for toasts)
  - Lucide React (icons)

### `/apps/api` - Express API

- **Endpoints**:
  - `POST /api/generate` - Generate a market moment
  - `GET /api/moments` - Get all moments (library)
  - `GET /api/moments/:id` - Get specific moment
  - `POST /api/moments/:id/mint` - Generate NFT metadata
  - `POST /api/tip` - Process tip payment
  - `GET /api/audio/:filename` - Serve audio files

### `/packages/agent` - SpoonOS Agent

- **ToolCallAgent**: Main orchestration class
- **Tools**:
  - `marketData.ts`: Fetches crypto prices from CoinGecko
  - `musicParams.ts`: Maps market data to music parameters
  - `audioSynthesis.ts`: Generates audio (ElevenLabs or fallback)
  - `waveform.ts`: Creates waveform visualization data
  - `nft.ts`: Generates NFT metadata

### `/packages/shared` - Shared Types

- TypeScript types and interfaces
- Utility functions (formatting, normalization, etc.)

## 🎹 Market → Music Mapping

The sonification algorithm maps market data to music parameters:

| Market Feature | Music Parameter | Mapping Logic |
|---------------|----------------|---------------|
| Volatility | Tempo (BPM) | 0-10% volatility → 90-160 BPM |
| 24h Change | Scale | Positive → Major, Negative → Minor |
| Volume | Drum Density | Higher volume → Denser percussion |
| Price Change | Brightness | Positive change → Brighter tones |
| Volatility | Filter Cutoff | Higher volatility → More filter movement |

**DJ Presets** influence the mapping:
- **Neon House**: Higher BPM bias, major scale preference, bright synths
- **Lo-Fi Drift**: Lower BPM, minor scale, sparse drums
- **Industrial Tech**: Dark tones, heavy percussion, minor scale

## 🎨 UI Design

- **Color Scheme**: Dark theme with cyan/purple gradient accents
- **Layout**: Spotify-inspired with sidebar, main pane, and now-playing footer
- **Responsive**: Mobile-friendly design (can be enhanced further)

## 🔧 Configuration

### Environment Variables

- `ELEVENLABS_API_KEY`: Optional - for audio synthesis (falls back to generated WAV)
- `API_PORT`: API server port (default: 3001)
- `WEB_PORT`: Frontend dev server port (default: 5173)
- `NFT_CONTRACT_ADDRESS`: Optional - for onchain NFT minting
- `RPC_URL`: Optional - for blockchain interactions

### Audio Generation

- **With ElevenLabs**: Set `ELEVENLABS_API_KEY` in `.env`
- **Fallback Mode**: Generates simple sine wave loops with WAV export (works without API keys)

## 🧪 Testing

Run unit tests (when implemented):
```bash
pnpm test
```

Test the agent directly:
```bash
pnpm agent:demo
```

## 📝 TODO / Future Enhancements

- [ ] Onchain NFT minting integration (ERC-721/ERC-1155)
- [ ] Wallet connection (MetaMask, WalletConnect)
- [ ] Real payment processing for tips
- [ ] Additional market areas (stocks, forex)
- [ ] More DJ presets
- [ ] Audio quality improvements (better synthesis)
- [ ] User accounts and saved moments
- [ ] Social sharing
- [ ] Unit tests for mapping logic
- [ ] E2E tests

## 🐛 Known Issues

- Audio generation is basic in fallback mode (simple sine waves)
- NFT minting is mocked (generates metadata only)
- Tips are simulated (no real payments)
- Market data uses free CoinGecko API (rate limits apply)

## 📄 License

MIT

## 🙏 Credits

Built with:
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express](https://expressjs.com/)
- [CoinGecko API](https://www.coingecko.com/en/api)
- [ElevenLabs](https://elevenlabs.io/) (optional)

---

**Note**: This is a demo application. For production use, implement proper error handling, rate limiting, authentication, and onchain integrations.
