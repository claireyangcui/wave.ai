"""
SpoonOS ReACT Agent for Music Generation
Orchestrates the full pipeline: market data → analysis → music params → prompt → audio
"""

import os
from typing import Dict, Any, Optional
from datetime import datetime

# Try to import SpoonOS SDK
try:
    from spoon_ai_sdk import SpoonAgent
    SPOONOS_AVAILABLE = True
except ImportError:
    SPOONOS_AVAILABLE = False
    print("⚠️  SpoonOS SDK not available. Agent will use direct tool calls.")

# Import tools - handle both direct execution and module import
try:
    from tools import (
        CoinGeckoHistoricalDataTool,
        MarketAnalysisTool,
        MusicParameterMappingTool,
        ElevenLabsMusicGenerationTool,
    )
except ImportError:
    # Try relative import if running as module
    try:
        from .tools import (
            CoinGeckoHistoricalDataTool,
            MarketAnalysisTool,
            MusicParameterMappingTool,
            ElevenLabsMusicGenerationTool,
        )
    except ImportError:
        # Fallback: add current directory to path
        import sys
        from pathlib import Path
        sys.path.insert(0, str(Path(__file__).parent))
        from tools import (
            CoinGeckoHistoricalDataTool,
            MarketAnalysisTool,
            MusicParameterMappingTool,
            ElevenLabsMusicGenerationTool,
        )


class MusicGenerationAgent:
    """ReACT agent for generating music from market data"""
    
    def __init__(self):
        if not SPOONOS_AVAILABLE:
            print("⚠️  Using direct tool calls (SpoonOS SDK not available)")
        
        # Initialize tools
        self.coingecko_tool = CoinGeckoHistoricalDataTool()
        self.analysis_tool = MarketAnalysisTool()
        self.mapping_tool = MusicParameterMappingTool()
        self.elevenlabs_tool = ElevenLabsMusicGenerationTool()
        
        # Initialize SpoonOS agent if available
        if SPOONOS_AVAILABLE:
            self.agent = SpoonAgent(
                name="music_generation_agent",
                tools=[
                    self.coingecko_tool,
                    self.analysis_tool,
                    self.mapping_tool,
                    self.elevenlabs_tool,
                ]
            )
        else:
            self.agent = None
    
    def generate_moment(
        self,
        instrument: str,
        dj_preset: str,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Generate a market moment with music
        
        Args:
            instrument: Cryptocurrency symbol (BTC, ETH, etc.)
            dj_preset: Genre/style (neon-house, lo-fi-drift, industrial-tech)
            days: Number of days of historical data to analyze
            
        Returns:
            Dictionary with market data, music params, audio URL, and explanation
        """
        print(f"🎵 Starting music generation for {instrument} with {dj_preset} style...")
        
        try:
            # Step 1: Fetch historical market data
            print(f"📊 Fetching {days} days of historical data for {instrument}...")
            market_data = self.coingecko_tool.get_historical_data(instrument, days)
            
            # Step 2: Analyze market patterns
            print(f"🔍 Analyzing market patterns...")
            market_analysis = self.analysis_tool.analyze_patterns(market_data)
            
            # Step 3: Map to music parameters using LLM reasoning
            print(f"🎹 Mapping market data to music parameters...")
            music_params = self.mapping_tool.map_to_music_params(
                market_data,
                market_analysis,
                dj_preset
            )
            
            # Step 4: Generate music prompt with price sequence
            print(f"📝 Generating music prompt with price sequence...")
            prompt = self._generate_music_prompt(
                market_data,
                market_analysis,
                music_params,
                dj_preset
            )
            
            # Step 5: Generate music with ElevenLabs
            print(f"🎵 Generating music with ElevenLabs...")
            # Calculate duration based on data points (10-12 seconds)
            num_points = len(market_data.get("historical_prices", []))
            duration = min(12, max(10, int(num_points / 30)))
            audio_result = self.elevenlabs_tool.generate_music(
                prompt=prompt,
                duration_seconds=duration,
                prompt_influence=0.7
            )
            
            # Step 6: Generate explanation
            explanation = self._generate_explanation(
                market_data,
                market_analysis,
                music_params,
                dj_preset
            )
            
            # Prepare response
            # Convert audio file path to absolute path for Node.js to read
            import os
            audio_file_path = os.path.abspath(audio_result["audio_file"])
            
            result = {
                "momentId": f"{instrument}_{dj_preset}_{int(datetime.now().timestamp())}",
                "instrument": instrument.upper(),
                "dj": dj_preset,
                "marketData": {
                    "instrument": instrument.upper(),
                    "price": market_data["current_price"],
                    "priceChange24h": market_data["current_price"] - market_data["historical_prices"][0]["price"],
                    "priceChangePercent24h": market_data["total_change_percent"],
                    "volatility": market_data["volatility"],
                    "volume24h": market_data["current_volume"],
                    "timestamp": int(datetime.now().timestamp() * 1000),
                },
                "musicParams": music_params,
                "explanation": explanation,
                "audioUrl": audio_result["audio_url"],
                "audioFile": audio_file_path,
                "timestamp": int(datetime.now().timestamp() * 1000),
            }
            
            print(f"✅ Music generation complete!")
            return result
            
        except Exception as e:
            print(f"❌ Error in music generation: {str(e)}")
            raise
    
    def _generate_music_prompt(
        self,
        market_data: Dict[str, Any],
        market_analysis: Dict[str, Any],
        music_params: Dict[str, Any],
        dj_preset: str
    ) -> str:
        """Generate detailed music prompt for ElevenLabs using price sequence format"""
        
        # Extract price sequence from historical data
        historical_prices = market_data.get("historical_prices", [])
        price_sequence = [round(p["price"], 2) for p in historical_prices]
        
        # Format price sequence as comma-separated list
        price_list_str = ", ".join([str(p) for p in price_sequence])
        
        # Determine instrument name for the prompt
        instrument_name = market_data.get("instrument", "BTC")
        if instrument_name == "BTC":
            instrument_display = "Bitcoin"
        elif instrument_name == "ETH":
            instrument_display = "Ethereum"
        elif instrument_name == "SOL":
            instrument_display = "Solana"
        elif instrument_name == "AVAX":
            instrument_display = "Avalanche"
        elif instrument_name == "MATIC":
            instrument_display = "Polygon"
        else:
            instrument_display = instrument_name
        
        # Calculate duration based on data points (aim for 10-12 seconds)
        num_points = len(price_sequence)
        duration = min(12, max(10, int(num_points / 30)))  # Rough estimate
        
        prompt = f"""Prompt:

Create an original, studio-quality instrumental track (10–12 seconds), seamless looping. The sound must be authentic, immersive, and fully mastered. It can be electronic, cinematic, or hybrid.

You will be given a price sequence for {instrument_display}. Use this data as INSPIRATION for the emotional arc and intensity, but prioritize musicality and creativity. Improvise freely to create a compelling piece.

Data inspiration guide:
	•	Higher levels → brighter, airier moments
	•	Fast changes → higher intensity or rhythmic complexity
	•	Rising trend → hopeful/uplifting moods
	•	Falling trend → melancholic/tense moods
	•	Spikes → dramatic accents or shifts

Output: Rich, professional sound palette. Can use deep bass, organic textures, piano, strings, or high-quality synths. Focus on depth, emotion, and polished production. No recognizable melodies. End must match the start (no long reverb tail).

Do not narrate. Be creative and unexpected.

{instrument_name} price samples:
[{price_list_str}]

Negative: vocals, speech, acoustic guitar strumming, ballad, long reverb tail, recognizable melody, cheap midi, fake strings, low quality, gm sound font, synthetic artifacts, ai generated sound, flat mix."""
        
        return prompt
    
    def _generate_explanation(
        self,
        market_data: Dict[str, Any],
        market_analysis: Dict[str, Any],
        music_params: Dict[str, Any],
        dj_preset: str
    ) -> str:
        """Generate human-readable explanation"""
        
        dj_name = dj_preset.replace('-', ' ').title()
        price = market_data["current_price"]
        change = market_data["total_change_percent"]
        trend = market_analysis["price_trend"]["direction"]
        volatility = market_data["volatility"]
        tempo = music_params.get("tempo", 120)
        scale = music_params.get("scale", "major")
        key = music_params.get("key", "C")
        
        parts = [
            f"The {dj_name} DJ detected {market_data['instrument']} trading at ${price:,.2f}",
        ]
        
        if abs(change) > 1:
            parts.append(f"with a {abs(change):.2f}% {trend} movement")
        else:
            parts.append("with relatively stable pricing")
        
        parts.append(f"Volatility of {volatility:.2f}% drove the tempo to {tempo} BPM")
        
        if scale == "major":
            parts.append(f"The {trend} trend inspired a major scale")
        else:
            parts.append(f"The {trend} trend inspired a minor scale")
        
        parts.append(f"with {key} as the root")
        
        volume_level = market_analysis["volume_patterns"].get("relative_level", 0.5)
        if volume_level > 0.7:
            parts.append("High trading volume translated to dense, energetic percussion")
        elif volume_level < 0.4:
            parts.append("Lower volume created a more sparse, atmospheric rhythm")
        
        brightness = music_params.get("brightness", 0.5)
        if brightness > 0.7:
            parts.append("Bright, uplifting synth tones reflect positive momentum")
        elif brightness < 0.4:
            parts.append("Darker, filtered textures mirror the cautious market mood")
        
        return ". ".join(parts) + "."

