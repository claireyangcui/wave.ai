# SpoonOS Data & LLM Service

A Python microservice that exposes SpoonOS data tools and LLM capabilities as a REST API for the wave.ai application.

## Features

- Fetches market data using SpoonOS SDK (`spoon-ai-sdk` and `spoon-toolkits`)
- **LLM-powered music script generation** using OpenAI GPT-4
- Analyzes market data and creates creative ElevenLabs prompts
- REST API endpoints for the Node.js backend
- Automatic fallback if SpoonOS SDK or OpenAI is not configured
- Health check and status endpoints

## Setup

### Using uv (Recommended)

```bash
uv venv .venv
source .venv/bin/activate  # macOS/Linux
# .\.venv\Scripts\Activate.ps1  # Windows

uv pip install -r requirements.txt
```

### Using pip

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Running

```bash
python main.py
```

The service starts on port 3002 by default. Set `SPOONOS_PORT` to change.

## API Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": 1701234567890
}
```

### GET /market-data/{instrument}
Get market data for a cryptocurrency.

**Parameters:**
- `instrument`: BTC, ETH, SOL, AVAX, or MATIC

**Response:**
```json
{
  "instrument": "BTC",
  "price": 97842.50,
  "priceChange24h": 2234.15,
  "priceChangePercent24h": 2.34,
  "volatility": 3.45,
  "volume24h": 32456789012,
  "timestamp": 1701234567890,
  "source": "spoonos"
}
```

### POST /generate-moment
Generate a complete market moment with music using the Python ReACT agent.

**Request Body:**
```json
{
  "instrument": "BTC",
  "djPreset": "neon-house",
  "days": 7
}
```

**Response:**
```json
{
  "momentId": "BTC_neon-house_1701234567",
  "instrument": "BTC",
  "dj": "neon-house",
  "marketData": {
    "instrument": "BTC",
    "price": 97842.50,
    "priceChange24h": 2234.15,
    "priceChangePercent24h": 2.34,
    "volatility": 3.45,
    "volume24h": 32456789012,
    "timestamp": 1701234567890
  },
  "musicParams": {
    "tempo": 128,
    "scale": "major",
    "key": "C",
    "brightness": 0.8,
    "drumDensity": 0.7,
    "intensity": 0.75,
    "energyScore": 0.8,
    "filterCutoff": 0.6,
    "trendDirection": "rising",
    "trendStrength": 0.7
  },
  "explanation": "The Neon House DJ detected BTC trading at $97,842.50...",
  "audioUrl": "/api/audio/audio_abc123.mp3",
  "audioFile": "/path/to/audio_abc123.mp3",
  "timestamp": 1701234567890
}
```

This endpoint orchestrates the full pipeline:
1. Fetches historical CoinGecko data
2. Analyzes market patterns
3. Maps to music parameters using LLM reasoning
4. Generates music with ElevenLabs
5. Returns complete market moment

### POST /generate-music-script
Generate a creative music script using LLM based on market data.

**Request Body:**
```json
{
  "instrument": "BTC",
  "djPreset": "neon-house",
  "marketData": {
    "price": 97842.50,
    "priceChangePercent24h": 2.34,
    "volatility": 3.45,
    "volume24h": 32456789012
  },
  "musicParams": {
    "tempo": 128,
    "scale": "major",
    "key": "C",
    "brightness": 0.8,
    "drumDensity": 0.7,
    "intensity": 0.75,
    "energyScore": 0.8,
    "filterCutoff": 0.6
  }
}
```

**Response:**
```json
{
  "script": "A pulsing 128 BPM neon house track capturing Bitcoin's bullish surge. Euphoric synth leads rise like the price chart, with punchy kicks driving the momentum forward. Bright, energetic, unstoppable.",
  "style_notes": "Energy: 80%, Use bright FM synths and sidechained pads",
  "mood": "euphoric",
  "suggested_duration": 8,
  "llm_provider": "openai"
}
```

### GET /status
Get service status and capabilities.

**Response:**
```json
{
  "spoonos_available": true,
  "llm_available": true,
  "llm_provider": "openai",
  "supported_instruments": ["BTC", "ETH", "SOL", "AVAX", "MATIC"],
  "supported_dj_presets": ["neon-house", "lo-fi-drift", "industrial-tech"],
  "endpoints": ["/health", "/market-data/{instrument}", "/generate-music-script", "/generate-moment", "/status"]
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SPOONOS_PORT` | 3002 | Port to run the service on |
| `OPENAI_API_KEY` | - | OpenAI API key for LLM features |
| `ELEVENLABS_API_KEY` | - | ElevenLabs API key for music generation |
| `COINGECKO_API_KEY` | - | Optional CoinGecko API key for higher rate limits |

## Integration with Node.js

The Node.js agent automatically uses the Python ReACT agent when available. Set these environment variables in Node.js:

```bash
SPOONOS_URL=http://localhost:3002  # Python service URL
SPOONOS_AGENT_ENABLED=true         # Enable Python agent (default: true)
```

The Node.js backend will:
1. Check if Python agent is available via `/health` endpoint
2. If available, use `/generate-moment` endpoint for full pipeline
3. If unavailable, fall back to Node.js pipeline

## Python ReACT Agent

See [AGENT_README.md](./AGENT_README.md) for details on the Python ReACT agent implementation.

