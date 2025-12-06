"""
Music Parameter Mapping Tool
Uses LLM reasoning to intelligently map market data to music parameters
"""

import os
import json
from typing import Dict, Any
from openai import OpenAI


class MusicParameterMappingTool:
    """Tool for mapping market data to music parameters using LLM reasoning"""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set")
        self.client = OpenAI(api_key=api_key)
    
    def map_to_music_params(
        self,
        market_data: Dict[str, Any],
        market_analysis: Dict[str, Any],
        dj_preset: str
    ) -> Dict[str, Any]:
        """
        Use LLM to intelligently map market data to music parameters
        
        Args:
            market_data: Historical market data from CoinGecko
            market_analysis: Analyzed patterns from MarketAnalysisTool
            dj_preset: User-selected genre (neon-house, lo-fi-drift, industrial-tech)
            
        Returns:
            Dictionary with music parameters (tempo, scale, key, etc.)
        """
        # Prepare context for LLM
        context = self._prepare_context(market_data, market_analysis, dj_preset)
        
        # Use LLM to reason about parameter mapping
        music_params = self._llm_reason_mapping(context)
        
        return music_params
    
    def _prepare_context(
        self,
        market_data: Dict[str, Any],
        market_analysis: Dict[str, Any],
        dj_preset: str
    ) -> Dict[str, Any]:
        """Prepare context for LLM reasoning"""
        return {
            "current_price": market_data.get("current_price", 0),
            "total_change_percent": market_data.get("total_change_percent", 0),
            "volatility": market_data.get("volatility", 0),
            "average_volume": market_data.get("average_volume", 0),
            "price_trend": market_analysis.get("price_trend", {}),
            "volatility_patterns": market_analysis.get("volatility_patterns", {}),
            "volume_patterns": market_analysis.get("volume_patterns", {}),
            "spikes": market_analysis.get("spikes", []),
            "momentum": market_analysis.get("momentum", 0),
            "sentiment": market_analysis.get("overall_sentiment", "neutral"),
            "dj_preset": dj_preset,
        }
    
    def _llm_reason_mapping(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Use LLM to reason about music parameter mapping"""
        
        system_prompt = """You are an expert music producer and data analyst. Your task is to map cryptocurrency market data to music parameters.

Consider these mappings:
- Higher volatility → faster tempo, denser percussion
- Rising prices → major scale, brighter timbre, uplifting intervals
- Falling prices → minor scale, darker timbre, descending intervals
- High volume → dense drums, energetic rhythm
- Low volume → sparse drums, atmospheric rhythm
- Price spikes → add stutters, risers, accents
- Strong momentum → higher energy, more intensity

DJ Preset influences:
- neon-house: High energy, major scales, bright, fast tempo
- lo-fi-drift: Low energy, minor scales, dark, slow tempo
- industrial-tech: Medium-high energy, minor scales, dark, medium tempo

Return ONLY valid JSON with these exact fields:
{
  "tempo": <60-180>,
  "scale": "major" or "minor",
  "key": "C", "Dm", "E", "F", "G", "Am", etc.,
  "filterCutoff": <0.0-1.0>,
  "brightness": <0.0-1.0>,
  "drumDensity": <0.0-1.0>,
  "intensity": <0.0-1.0>,
  "energyScore": <0.0-1.0>,
  "trendDirection": "rising" or "falling" or "stable",
  "trendStrength": <0.0-1.0>
}"""

        user_prompt = f"""Map this market data to music parameters:

Current Price: ${context['current_price']:,.2f}
Total Change: {context['total_change_percent']:+.2f}%
Volatility: {context['volatility']:.2f}%
Average Volume: ${context['average_volume']:,.0f}

Price Trend: {context['price_trend'].get('direction')} (strength: {context['price_trend'].get('strength', 0):.2f})
Volatility Level: {context['volatility_patterns'].get('level')}
Volume Trend: {context['volume_patterns'].get('trend')}
Momentum: {context['momentum']:.2f}
Sentiment: {context['sentiment']}
Spikes: {len(context['spikes'])} significant movements

DJ Preset: {context['dj_preset']}

Generate music parameters that reflect this market data."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=300,
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Validate and normalize parameters
            return self._validate_params(result)
            
        except Exception as e:
            # Fallback to deterministic mapping if LLM fails
            print(f"⚠️  LLM mapping failed: {e}, using fallback")
            return self._fallback_mapping(context)
    
    def _validate_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and normalize music parameters"""
        # Ensure all required fields exist with valid ranges
        validated = {
            "tempo": max(60, min(180, int(params.get("tempo", 120)))),
            "scale": params.get("scale", "major") if params.get("scale") in ["major", "minor"] else "major",
            "key": params.get("key", "C"),
            "filterCutoff": max(0.0, min(1.0, float(params.get("filterCutoff", 0.5)))),
            "brightness": max(0.0, min(1.0, float(params.get("brightness", 0.5)))),
            "drumDensity": max(0.0, min(1.0, float(params.get("drumDensity", 0.5)))),
            "intensity": max(0.0, min(1.0, float(params.get("intensity", 0.5)))),
            "energyScore": max(0.0, min(1.0, float(params.get("energyScore", 0.5)))),
            "trendDirection": params.get("trendDirection", "stable") if params.get("trendDirection") in ["rising", "falling", "stable"] else "stable",
            "trendStrength": max(0.0, min(1.0, float(params.get("trendStrength", 0.5)))),
        }
        return validated
    
    def _fallback_mapping(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback deterministic mapping if LLM fails"""
        trend = context['price_trend'].get('direction', 'stable')
        volatility = context['volatility']
        volume_level = context['volume_patterns'].get('relative_level', 0.5)
        dj_preset = context['dj_preset']
        
        # Base tempo from volatility
        tempo = 90 + (volatility * 5)
        if dj_preset == 'neon-house':
            tempo += 20
        elif dj_preset == 'lo-fi-drift':
            tempo -= 20
        
        # Scale based on trend
        scale = 'major' if trend == 'rising' else 'minor'
        
        # Brightness based on price level and trend
        brightness = 0.5 + (context['total_change_percent'] / 20)
        brightness = max(0.2, min(0.9, brightness))
        
        return {
            "tempo": int(max(60, min(180, tempo))),
            "scale": scale,
            "key": "C",
            "filterCutoff": min(0.8, volatility / 10),
            "brightness": brightness,
            "drumDensity": volume_level,
            "intensity": abs(context['momentum']),
            "energyScore": (volatility / 10) + abs(context['momentum']),
            "trendDirection": trend,
            "trendStrength": context['price_trend'].get('strength', 0.5),
        }
    
    def __call__(self, market_data: Dict[str, Any], market_analysis: Dict[str, Any], dj_preset: str) -> Dict[str, Any]:
        """Make the tool callable"""
        return self.map_to_music_params(market_data, market_analysis, dj_preset)

