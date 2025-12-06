# Setup Instructions

## Prerequisites

- Node.js >= 18
- pnpm >= 8
- Python >= 3.12 (for SpoonOS)
- uv (recommended) or pip

## Installation Steps

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   # Required for LLM-powered music scripts (via SpoonOS)
   OPENAI_API_KEY=your_openai_key_here
   
   # Required for actual music generation
   ELEVENLABS_API_KEY=your_elevenlabs_key_here
   
   # Optional: CoinGecko API key (for higher rate limits)
   COINGECKO_API_KEY=your_coingecko_key_here
   
   # Python ReACT Agent settings (optional)
   SPOONOS_AGENT_ENABLED=true  # Set to false to disable Python agent
   SPOONOS_URL=http://localhost:3002  # Python service URL
   ```

3. **Build shared packages:**
   ```bash
   pnpm --filter '@wave-ai/shared' build
   pnpm --filter '@wave-ai/agent' build
   ```

4. **Run the application:**
   ```bash
   pnpm dev
   ```
   
   This starts:
   - Frontend: http://localhost:5173
   - API: http://localhost:3001

5. **Test the agent:**
   ```bash
   pnpm agent:demo
   ```

## SpoonOS Integration (Required)

The app uses SpoonOS for market data. Set up the Python service:

### Quick Setup with uv (Recommended)

```bash
cd services/spoonos

# Create virtual environment
uv venv .venv
source .venv/bin/activate  # macOS/Linux
# .\.venv\Scripts\Activate.ps1  # Windows (PowerShell)

# Install SpoonOS SDK
uv pip install -r requirements.txt
```

### Alternative: Setup with pip

```bash
cd services/spoonos
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Running the SpoonOS Service

```bash
# From services/spoonos directory with venv activated
python main.py
```

This starts the SpoonOS data service on http://localhost:3002

### Running Everything Together

You need 3 terminals:

1. **Terminal 1 - SpoonOS Service:**
   ```bash
   cd services/spoonos
   source .venv/bin/activate
   python main.py
   ```

2. **Terminal 2 - Node.js Backend:**
   ```bash
   pnpm dev
   ```

3. The frontend and API will automatically connect to SpoonOS when available.

### Data Source Priority

The app fetches market data in this order:
1. **SpoonOS** (if running) - Uses `spoon-ai-sdk` and `spoon-toolkits`
2. **CoinGecko** (fallback) - Free crypto API
3. **Mock data** (last resort) - For offline development

### Python ReACT Agent (Recommended)

The app now includes a Python ReACT agent that handles the full music generation pipeline:

1. **Fetches historical CoinGecko data** (past 7 days by default)
2. **Analyzes market patterns** (trends, volatility, volume, spikes)
3. **Maps to music parameters** using LLM reasoning (considers genre/DJ preset)
4. **Generates ElevenLabs prompt** with parameters and style
5. **Calls ElevenLabs API** to generate music
6. **Returns complete market moment** with audio file

The Python agent is enabled by default. The Node.js backend will automatically use it if available, otherwise falls back to the Node.js pipeline.

**Features:**
- Historical data analysis (not just current price)
- Intelligent parameter mapping using LLM
- Genre-aware music generation
- End-to-end pipeline in one call

### LLM Music Script Generation

When generating music, the app:
1. **SpoonOS LLM** analyzes market data and generates a creative music script
2. The script is sent to **ElevenLabs** for actual audio generation
3. This produces more evocative, market-aware music descriptions

To enable LLM features, add to your `.env`:
```env
OPENAI_API_KEY=your_openai_key_here
```

The LLM generates prompts like:
> "A pulsing 128 BPM neon house track capturing Bitcoin's bullish surge. 
> Euphoric synth leads rise like the price chart, with punchy kicks 
> driving the momentum. Bright, energetic, unstoppable."

## Troubleshooting

### Port Already in Use
If ports 3001 or 5173 are in use, change them in `.env`:
```env
API_PORT=3002
WEB_PORT=5174
```

### Module Not Found Errors
Make sure you've built the shared packages:
```bash
pnpm --filter '@wave-ai/shared' build
pnpm --filter '@wave-ai/agent' build
```

### Audio Generation Issues
If audio doesn't play:
- Check browser console for errors
- Verify API server is running
- Check that audio files are being generated in `packages/agent/temp/`

### Market Data Not Loading
- Check if SpoonOS service is running: http://localhost:3002/health
- CoinGecko API is free but has rate limits
- If all sources fail, the app will use mock data
- Check network tab in browser devtools

### SpoonOS Service Issues
- Ensure Python 3.12+ is installed: `python --version`
- Check if packages are installed: `pip list | grep spoon`
- Verify service is running: `curl http://localhost:3002/status`
- Check service logs for errors

## Development Workflow

1. **Frontend changes:** Edit files in `apps/web/src/`
2. **API changes:** Edit files in `apps/api/src/`
3. **Agent changes:** Edit files in `packages/agent/src/`
4. **Shared types:** Edit files in `packages/shared/src/`

Hot reload is enabled for both frontend and API in dev mode.

## Building for Production

```bash
pnpm build
```

This builds all packages. Then:
- Frontend: `apps/web/dist/` (serve with any static server)
- API: `apps/api/dist/` (run with `node apps/api/dist/index.js`)


