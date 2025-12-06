"""
SpoonOS Market Data & LLM Service
Exposes SpoonOS data tools and LLM capabilities as a REST API for the Node.js backend
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="SpoonOS Data & LLM Service", version="1.0.0")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class MarketDataResponse(BaseModel):
    instrument: str
    price: float
    priceChange24h: float
    priceChangePercent24h: float
    volatility: float
    volume24h: float
    timestamp: int
    source: str = "spoonos"

class MusicParams(BaseModel):
    tempo: int
    scale: str
    key: str
    filterCutoff: float
    brightness: float
    drumDensity: float
    intensity: float
    energyScore: float

class MusicScriptRequest(BaseModel):
    instrument: str
    djPreset: str
    marketData: Dict[str, Any]
    musicParams: MusicParams

class MusicScriptResponse(BaseModel):
    script: str
    style_notes: str
    mood: str
    suggested_duration: int
    llm_provider: str

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: int
    llm_available: bool


# Try to import SpoonOS SDK
try:
    from spoon_ai_sdk import SpoonAgent
    from spoon_toolkits.data import MarketDataTool
    SPOONOS_AVAILABLE = True
except ImportError:
    SPOONOS_AVAILABLE = False
    print("⚠️  SpoonOS SDK not installed. Using fallback data.")
    print("   Install with: pip install spoon-ai-sdk spoon-toolkits")

# Try to import OpenAI for LLM
try:
    from openai import OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    if OPENAI_API_KEY:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        LLM_AVAILABLE = True
        print("✅ OpenAI LLM configured")
    else:
        LLM_AVAILABLE = False
        print("⚠️  OPENAI_API_KEY not set. LLM features will use fallback.")
except ImportError:
    LLM_AVAILABLE = False
    openai_client = None
    print("⚠️  OpenAI package not installed. pip install openai")


# Instrument mapping for SpoonOS
INSTRUMENT_MAP = {
    "BTC": "bitcoin",
    "ETH": "ethereum", 
    "SOL": "solana",
    "AVAX": "avalanche",
    "MATIC": "polygon",
}


def get_spoonos_market_data(instrument: str) -> dict:
    """
    Fetch market data using SpoonOS data tools
    """
    if not SPOONOS_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="SpoonOS SDK not available. Please install spoon-ai-sdk and spoon-toolkits"
        )
    
    try:
        # Initialize SpoonOS agent with market data tool
        agent = SpoonAgent(
            name="market_data_agent",
            tools=[MarketDataTool()]
        )
        
        # Get the mapped instrument name
        coin_id = INSTRUMENT_MAP.get(instrument, instrument.lower())
        
        # Use the agent to fetch market data
        result = agent.run(
            f"Get current market data for {coin_id} including price, 24h change, volume, and volatility"
        )
        
        # Parse the result - adjust based on actual SpoonOS response format
        return {
            "instrument": instrument,
            "price": result.get("price", 0),
            "priceChange24h": result.get("price_change_24h", 0),
            "priceChangePercent24h": result.get("price_change_percentage_24h", 0),
            "volatility": result.get("volatility", 0),
            "volume24h": result.get("volume_24h", 0),
            "timestamp": int(datetime.now().timestamp() * 1000),
            "source": "spoonos"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SpoonOS error: {str(e)}")


def get_fallback_market_data(instrument: str) -> dict:
    """
    Fallback market data when SpoonOS is not available
    Uses mock data for demo purposes
    """
    import random
    
    # Base prices for each instrument
    base_prices = {
        "BTC": 97000,
        "ETH": 3500,
        "SOL": 180,
        "AVAX": 35,
        "MATIC": 0.85,
    }
    
    base_price = base_prices.get(instrument, 100)
    price_variation = base_price * 0.02  # 2% variation
    
    price = base_price + random.uniform(-price_variation, price_variation)
    price_change_pct = random.uniform(-5, 5)
    price_change = price * (price_change_pct / 100)
    
    return {
        "instrument": instrument,
        "price": round(price, 2),
        "priceChange24h": round(price_change, 2),
        "priceChangePercent24h": round(price_change_pct, 2),
        "volatility": round(random.uniform(1, 8), 2),
        "volume24h": round(random.uniform(1e9, 5e10), 0),
        "timestamp": int(datetime.now().timestamp() * 1000),
        "source": "fallback"
    }


# ============== LLM Music Script Generation ==============

DJ_STYLE_PROMPTS = {
    "neon-house": {
        "style": "high-energy neon house",
        "vibe": "euphoric, electric, vibrant",
        "drums": "punchy four-on-the-floor kick drum, crisp clap/snare on 2 and 4, shimmering open hi-hats",
        "bass": "deep sub bass with sidechained synth bass, pumping groove",
        "instruments": "bright supersaw leads, sparkling arpeggios, euphoric pads"
    },
    "lo-fi-drift": {
        "style": "lo-fi chill hop",
        "vibe": "relaxed, dreamy, nostalgic",
        "drums": "dusty boom-bap kick, lazy snare with vinyl crackle, soft closed hi-hats",
        "bass": "warm mellow bass with subtle movement",
        "instruments": "Rhodes keys, jazzy chords, ambient tape-saturated pads"
    },
    "industrial-tech": {
        "style": "dark industrial techno",
        "vibe": "intense, mechanical, driving",
        "drums": "distorted pounding kick drum, metallic snare hits, relentless hi-hats",
        "bass": "aggressive acid bass, rumbling sub frequencies",
        "instruments": "harsh modular synths, dark atmospheric textures, industrial stabs"
    }
}


def generate_llm_music_script(request: MusicScriptRequest) -> dict:
    """
    Use OpenAI LLM to generate a creative music script for ElevenLabs
    """
    if not LLM_AVAILABLE or not openai_client:
        return generate_fallback_music_script(request)
    
    try:
        dj_style = DJ_STYLE_PROMPTS.get(request.djPreset, DJ_STYLE_PROMPTS["neon-house"])
        market_data = request.marketData
        music_params = request.musicParams
        
        # Determine market mood
        price_change = market_data.get("priceChangePercent24h", 0)
        if price_change > 3:
            market_mood = "bullish euphoria"
        elif price_change > 0:
            market_mood = "cautiously optimistic"
        elif price_change > -3:
            market_mood = "uncertain, slightly bearish"
        else:
            market_mood = "bearish tension"
        
        # Determine trend direction
        trend_direction = "rising" if price_change > 1 else "falling" if price_change < -1 else "stable"
        harmony = "D Dorian" if trend_direction == "rising" else "E minor"
        
        system_prompt = """You are an expert electronic music producer. Generate a precise ElevenLabs music prompt.

Your output must follow this EXACT structure for the "script" field:

"Create an original electronic instrumental loop (8 seconds) designed for seamless looping. Mood: [mood based on market]. Tempo: [BPM] with subtle rhythmic variation.

Sound palette: punchy kick, tight hi-hats, warm sub bass, airy synth plucks, and a shifting pad. [timbre instruction based on price level].

[percussion density instruction]. [tonal center instruction]. [spike effects if volatile].

Harmony: [D Dorian or E minor], with a repeating 4-bar progression. Add light glitch elements and tape-stop micro-effects. Keep dynamics punchy and club-ready. No vocals. Clean, modern production.

Looping requirements: no long reverb tails; end matches start for seamless looping."

Output as JSON with: script, style_notes, mood"""

        user_prompt = f"""Create a music prompt for this market data:

MARKET DATA:
- Asset: {request.instrument}
- Price: ${market_data.get('price', 0):,.2f}
- 24h Change: {price_change:+.2f}%
- Trend: {trend_direction}
- Market mood: {market_mood}

MUSIC PARAMS:
- Tempo: {music_params.tempo} BPM
- Scale: {music_params.scale}
- Energy: {music_params.energyScore * 100:.0f}%
- Brightness: {music_params.brightness * 100:.0f}%

MARKET-TO-MUSIC MAPPING (apply conceptually, don't narrate):
- Higher price → brighter timbre (more harmonics, open filter)
- Higher volatility → denser percussion + faster note repetition  
- Upward trend → {harmony} with uplifting intervals
- Downward trend → E minor with darker chord voicings
- Large moves → short risers, stutters, one-hit accents

Generate the prompt following the exact structure. Make it {dj_style['style']} style."""

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=500,
            temperature=0.8
        )
        
        import json
        result = json.loads(response.choices[0].message.content)
        
        return {
            "script": result.get("script", generate_fallback_music_script(request)["script"]),
            "style_notes": result.get("style_notes", ""),
            "mood": result.get("mood", "dynamic"),
            "suggested_duration": 8,
            "llm_provider": "openai"
        }
        
    except Exception as e:
        print(f"⚠️  LLM generation failed: {e}")
        return generate_fallback_music_script(request)


def generate_fallback_music_script(request: MusicScriptRequest) -> dict:
    """
    Fallback music script generation without LLM
    Explicitly mentions drums, bass, and synths
    """
    dj_style = DJ_STYLE_PROMPTS.get(request.djPreset, DJ_STYLE_PROMPTS["neon-house"])
    music_params = request.musicParams
    market_data = request.marketData
    
    # Build description from params
    scale_desc = "uplifting major" if music_params.scale == "major" else "dark minor"
    tempo_desc = "driving" if music_params.tempo >= 130 else "mid-tempo" if music_params.tempo >= 100 else "laid-back"
    
    price_change = market_data.get("priceChangePercent24h", 0)
    mood = "euphoric" if price_change > 3 else "optimistic" if price_change > 0 else "tense" if price_change > -3 else "ominous"
    
    # Build script with explicit drums, bass, synths
    script = f"A {tempo_desc} {music_params.tempo} BPM {dj_style['style']} track in {scale_desc} scale, key of {music_params.key}. Features {dj_style['drums']}, {dj_style['bass']}, and {dj_style['instruments']}. {mood.capitalize()} energy reflecting {request.instrument}'s market momentum."
    
    return {
        "script": script,
        "style_notes": f"Energy: {music_params.energyScore * 100:.0f}%, Drum Density: {music_params.drumDensity * 100:.0f}%",
        "mood": mood,
        "suggested_duration": 8,
        "llm_provider": "fallback"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if (SPOONOS_AVAILABLE or LLM_AVAILABLE) else "degraded",
        "version": "1.0.0",
        "timestamp": int(datetime.now().timestamp() * 1000),
        "llm_available": LLM_AVAILABLE
    }


@app.get("/market-data/{instrument}", response_model=MarketDataResponse)
async def get_market_data(instrument: str):
    """
    Get market data for a cryptocurrency instrument
    
    - **instrument**: Cryptocurrency symbol (BTC, ETH, SOL, AVAX, MATIC)
    """
    instrument = instrument.upper()
    
    if instrument not in INSTRUMENT_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported instrument: {instrument}. Supported: {list(INSTRUMENT_MAP.keys())}"
        )
    
    if SPOONOS_AVAILABLE:
        try:
            return get_spoonos_market_data(instrument)
        except HTTPException:
            # Fall back to mock data if SpoonOS fails
            print(f"⚠️  SpoonOS failed for {instrument}, using fallback")
            return get_fallback_market_data(instrument)
    else:
        return get_fallback_market_data(instrument)


@app.post("/generate-music-script", response_model=MusicScriptResponse)
async def generate_music_script(request: MusicScriptRequest):
    """
    Generate a creative music script using LLM based on market data
    
    This endpoint analyzes market data and music parameters to create
    an evocative description for ElevenLabs music generation.
    """
    try:
        result = generate_llm_music_script(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Script generation failed: {str(e)}")


class GenerateMomentRequest(BaseModel):
    instrument: str
    djPreset: str
    days: Optional[int] = 7

class GenerateMomentResponse(BaseModel):
    momentId: str
    instrument: str
    dj: str
    marketData: Dict[str, Any]
    musicParams: Dict[str, Any]
    explanation: str
    audioUrl: str
    timestamp: int


@app.post("/generate-moment", response_model=GenerateMomentResponse)
async def generate_moment(request: GenerateMomentRequest):
    """
    Generate a complete market moment with music using the ReACT agent
    
    This endpoint orchestrates the full pipeline:
    1. Fetch historical CoinGecko data
    2. Analyze market patterns
    3. Map to music parameters using LLM reasoning
    4. Generate music with ElevenLabs
    5. Return complete market moment
    """
    try:
        # Import agent module (handle both relative and absolute imports)
        try:
            from agent import MusicGenerationAgent
        except ImportError:
            import sys
            import os
            sys.path.insert(0, os.path.dirname(__file__))
            from agent import MusicGenerationAgent
        
        agent = MusicGenerationAgent()
        result = agent.generate_moment(
            instrument=request.instrument,
            dj_preset=request.djPreset,
            days=request.days
        )
        
        return result
        
    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Music generation agent not available: {str(e)}. Check dependencies."
        )
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"❌ Error in generate_moment: {error_detail}")
        raise HTTPException(
            status_code=500,
            detail=f"Music generation failed: {str(e)}"
        )


@app.get("/status")
async def get_status():
    """Get service status and capabilities"""
    return {
        "spoonos_available": SPOONOS_AVAILABLE,
        "llm_available": LLM_AVAILABLE,
        "llm_provider": "openai" if LLM_AVAILABLE else None,
        "supported_instruments": list(INSTRUMENT_MAP.keys()),
        "supported_dj_presets": list(DJ_STYLE_PROMPTS.keys()),
        "endpoints": [
            "/health",
            "/market-data/{instrument}",
            "/generate-music-script",
            "/generate-moment",
            "/status"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("SPOONOS_PORT", 3002))
    print(f"🥄 Starting SpoonOS Data Service on port {port}")
    print(f"   SpoonOS SDK available: {SPOONOS_AVAILABLE}")
    uvicorn.run(app, host="0.0.0.0", port=port)

