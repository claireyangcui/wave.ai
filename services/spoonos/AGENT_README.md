# Python ReACT Agent for Music Generation

This directory contains a Python ReACT (Reasoning and Acting) agent that orchestrates the full music generation pipeline using SpoonOS SDK.

## Architecture

The agent uses SpoonOS's ReACT pattern to:
1. **Reason**: Analyze market data and determine optimal music parameter mappings
2. **Act**: Execute tools to fetch data, generate prompts, and create music

## Components

### Agent (`agent.py`)
Main orchestration class that coordinates all tools and executes the pipeline.

### Tools (`tools/`)

- **`coingecko.py`**: Fetches historical price data from CoinGecko API
- **`market_analysis.py`**: Analyzes market patterns (trends, volatility, volume)
- **`music_mapping.py`**: Uses LLM to intelligently map market data to music parameters
- **`elevenlabs.py`**: Calls ElevenLabs API to generate music

## Usage

The agent is automatically used by the Node.js backend when available. To use it directly:

```python
from agent import MusicGenerationAgent

agent = MusicGenerationAgent()
result = agent.generate_moment(
    instrument="BTC",
    dj_preset="neon-house",
    days=7
)
```

## API Endpoint

The agent is exposed via FastAPI endpoint:

```
POST /generate-moment
{
  "instrument": "BTC",
  "djPreset": "neon-house",
  "days": 7
}
```

## Environment Variables

- `OPENAI_API_KEY`: Required for LLM reasoning
- `ELEVENLABS_API_KEY`: Required for music generation
- `COINGECKO_API_KEY`: Optional, for higher rate limits

## Dependencies

See `requirements.txt` for full list. Key dependencies:
- `spoon-ai-sdk`: SpoonOS SDK for ReACT pattern
- `openai`: For LLM reasoning
- `requests`: For API calls
- `fastapi`: For REST API

